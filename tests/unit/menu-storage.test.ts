import { describe, expect, it } from "vitest";
import { removeStoredMenuImage } from "@/lib/services/menu-storage";

describe("removeStoredMenuImage", () => {
  it("removes the exact menu image path from the menu-images bucket", async () => {
    const calls: Array<{ bucketName: string; paths: string[] }> = [];
    const storage = {
      from(bucketName: string) {
        return {
          async remove(paths: string[]) {
            calls.push({ bucketName, paths });
            return { error: null };
          },
        };
      },
    };

    const result = await removeStoredMenuImage(storage, "user-1/menu.jpg");

    expect(result).toEqual({ ok: true });
    expect(calls).toEqual([
      { bucketName: "menu-images", paths: ["user-1/menu.jpg"] },
    ]);
  });

  it("returns a failure result when Supabase reports a storage error", async () => {
    const storage = {
      from() {
        return {
          async remove() {
            return { error: { message: "delete denied" } };
          },
        };
      },
    };

    await expect(
      removeStoredMenuImage(storage, "user-1/menu.jpg"),
    ).resolves.toEqual({
      ok: false,
      errorMessage: "delete denied",
    });
  });

  it("does not throw when storage cleanup itself throws", async () => {
    const storage = {
      from() {
        return {
          async remove() {
            throw new Error("storage network failed");
          },
        };
      },
    };

    await expect(
      removeStoredMenuImage(storage, "user-1/menu.jpg"),
    ).resolves.toEqual({
      ok: false,
      errorMessage: "storage network failed",
    });
  });
});
