"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Send, Trash2 } from "lucide-react";
import {
  deleteOwnChatMessage,
  sendChatMessage,
} from "@/lib/actions/chat-actions";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";
import type { ChatMessageWithSender } from "@/lib/services/chats";
import type { ChatMessage, Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ChatPanelProps = {
  threadId: string;
  currentUserId: string;
  initialMessages: ChatMessageWithSender[];
  title?: string;
  emptyHint: string;
};

export function ChatPanel({
  threadId,
  currentUserId,
  initialMessages,
  title = "Chat",
  emptyHint,
}: ChatPanelProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshMessages = useCallback(async () => {
    const supabase = createClient();
    const { data, error: messageError } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (messageError) {
      setError(messageError.message);
      return;
    }

    const rows = (data ?? []) as ChatMessage[];
    const senderIds = [...new Set(rows.map((message) => message.sender_id))];
    const senderMap = new Map<string, ChatMessageWithSender["sender"]>();

    if (senderIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", senderIds);

      if (profileError) {
        setError(profileError.message);
        return;
      }

      for (const profile of (profiles ?? []) as Profile[]) {
        senderMap.set(profile.id, {
          id: profile.id,
          display_name: profile.display_name,
          username: profile.username,
        });
      }
    }

    setMessages(
      rows.flatMap((message) => {
        const sender = senderMap.get(message.sender_id);

        if (!sender) {
          return [];
        }

        return [{ ...message, sender }];
      }),
    );
  }, [threadId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          void refreshMessages();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshMessages, threadId]);

  function handleSend(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await sendChatMessage(formData);

      if (!result.ok) {
        setError(result.error ?? "Could not send message.");
        return;
      }

      formRef.current?.reset();
      await refreshMessages();
    });
  }

  function handleDelete(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await deleteOwnChatMessage(formData);

      if (!result.ok) {
        setError(result.error ?? "Could not delete message.");
        return;
      }

      await refreshMessages();
    });
  }

  return (
    <Card className="grid min-h-[520px] grid-rows-[auto_1fr_auto] overflow-hidden">
      <div className="border-b border-[var(--border)] p-4">
        <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Text-only realtime group chat
        </p>
      </div>

      <div className="grid content-start gap-3 overflow-y-auto bg-[#fbfbfe] p-4">
        {messages.length > 0 ? (
          messages.map((message) => {
            const isMine = message.sender_id === currentUserId;
            const deleted = Boolean(message.deleted_at);

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isMine ? "justify-end" : "justify-start",
                )}
              >
                {!isMine ? (
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--brand-eggplant)] text-sm font-black text-white">
                    {message.sender.display_name.slice(0, 1).toUpperCase()}
                  </span>
                ) : null}
                <div
                  className={cn(
                    "max-w-[82%] rounded-[8px] border px-3 py-2 text-sm shadow-sm",
                    isMine
                      ? "border-[rgba(222,127,36,0.22)] bg-[rgba(236,178,45,0.2)]"
                      : "border-[var(--border)] bg-white",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-black text-[var(--brand-eggplant)]">
                      {isMine ? "You" : message.sender.display_name}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "whitespace-pre-wrap break-words leading-6 text-[var(--text-main)]",
                      deleted && "italic text-[var(--text-muted)]",
                    )}
                  >
                    {deleted ? "Message deleted" : message.body}
                  </p>
                  {isMine && !deleted ? (
                    <form
                      action={handleDelete}
                      className="mt-2 flex justify-end"
                    >
                      <input type="hidden" name="threadId" value={threadId} />
                      <input
                        type="hidden"
                        name="messageId"
                        value={message.id}
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-white hover:text-[var(--food-chili)]"
                        disabled={isPending}
                        title="Delete message"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid min-h-56 place-items-center rounded-[8px] border border-dashed border-[var(--border)] bg-white p-6 text-center">
            <p className="max-w-sm text-sm leading-6 text-[var(--text-muted)]">
              {emptyHint}
            </p>
          </div>
        )}
      </div>

      <form
        ref={formRef}
        action={handleSend}
        className="grid gap-3 border-t border-[var(--border)] bg-white p-4"
      >
        {error ? (
          <p className="rounded-[8px] bg-[rgba(224,92,32,0.08)] p-2 text-sm font-semibold text-[var(--food-chili)]">
            {error}
          </p>
        ) : null}
        <input type="hidden" name="threadId" value={threadId} />
        <Textarea
          name="body"
          maxLength={1000}
          required
          placeholder="Send a message"
          className="min-h-20 resize-none"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            <Send size={16} />
            Send
          </Button>
        </div>
      </form>
    </Card>
  );
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
