import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { createMenuFeedback } from "@/lib/actions/menu-actions";
import type { MenuItem } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

export function MenuItemCard({
  item,
  menuUploadId,
  feedbackSubmitted,
}: {
  item: MenuItem;
  menuUploadId: string;
  feedbackSubmitted: boolean;
}) {
  const score = item.recommendation_score;
  const warnings = item.dietary_warnings ?? [];
  const confidence =
    item.confidence === null ? null : Math.round(item.confidence * 100);

  return (
    <Card className="grid gap-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              {item.translated_name ?? item.original_name}
            </h2>
            <Badge variant="indigo">AI estimate</Badge>
            {confidence !== null ? (
              <Badge variant="neutral">{confidence}% confidence</Badge>
            ) : null}
          </div>
          {item.translated_name &&
          item.translated_name !== item.original_name ? (
            <p className="text-sm font-semibold text-[var(--text-muted)]">
              {item.original_name}
            </p>
          ) : null}
        </div>

        {score !== null ? (
          <div className="min-w-24 rounded-[8px] bg-[#f7f7fb] px-3 py-2 text-center">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
              Fit
            </p>
            <p className="text-2xl font-black text-[var(--brand-eggplant)]">
              {score}
            </p>
          </div>
        ) : null}
      </div>

      {item.description ? (
        <p className="text-sm leading-6 text-[var(--text-main)]">
          {item.description}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {item.ingredients.length > 0 ? (
          <div className="rounded-[8px] border border-[var(--border)] bg-white p-3">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
              Likely ingredients
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.ingredients.map((ingredient) => (
                <Badge key={ingredient} variant="warm">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3">
          {item.cooking_method ? (
            <MiniFact label="Method" value={item.cooking_method} />
          ) : null}
          {item.cuisine_context ? (
            <MiniFact label="Context" value={item.cuisine_context} />
          ) : null}
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.22)] bg-[rgba(224,92,32,0.08)] p-3">
          <p className="flex items-center gap-2 text-sm font-black text-[var(--food-chili)]">
            <AlertTriangle size={16} />
            Possible dietary warnings
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {warnings.map((warning) => (
              <Badge key={warning} variant="urgent">
                {warning}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {item.recommendation_reason ? (
        <p className="flex items-start gap-2 rounded-[8px] bg-[rgba(108,107,226,0.1)] px-3 py-2 text-sm leading-6 text-[var(--brand-eggplant)]">
          <Sparkles
            className="mt-0.5 shrink-0 text-[var(--brand-indigo)]"
            size={16}
          />
          {item.recommendation_reason}
        </p>
      ) : null}

      {feedbackSubmitted ? (
        <p className="flex items-center gap-2 rounded-[8px] bg-[rgba(236,178,45,0.16)] px-3 py-2 text-sm font-semibold text-[#815714]">
          <CheckCircle2 size={16} />
          Feedback received for this dish.
        </p>
      ) : (
        <form
          action={createMenuFeedback}
          className="grid gap-3 rounded-[8px] border border-[var(--border)] bg-[#f7f7fb] p-3"
        >
          <input type="hidden" name="menuUploadId" value={menuUploadId} />
          <input type="hidden" name="menuItemId" value={item.id} />
          <div className="flex items-center gap-2 text-sm font-black text-[var(--brand-eggplant)]">
            <MessageSquare size={16} />
            Report an issue
          </div>
          <div className="grid gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
            <Field label="Issue">
              <Select name="feedbackType" defaultValue="incorrect_translation">
                <option value="incorrect_translation">
                  Incorrect translation
                </option>
                <option value="wrong_ingredients">Wrong ingredients</option>
                <option value="allergy_risk">Allergy risk</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Note">
              <Textarea
                name="note"
                placeholder="Optional correction"
                rows={2}
              />
            </Field>
            <SubmitButton pendingLabel="Sending..." variant="secondary">
              Send
            </SubmitButton>
          </div>
        </form>
      )}
    </Card>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-white p-3">
      <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-[var(--text-main)]">{value}</p>
    </div>
  );
}
