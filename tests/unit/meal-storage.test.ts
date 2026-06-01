import { describe, expect, it } from "vitest";
import { removeStoredMealImage } from "@/lib/services/meal-storage";

describe("removeStoredMealImage", () => {
  it("removes the exact meal image path from the meal-images bucket", async () => {
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

    const result = await removeStoredMealImage(storage, "user-1/meal.jpg");

    expect(result).toEqual({ ok: true });
    expect(calls).toEqual([
      { bucketName: "meal-images", paths: ["user-1/meal.jpg"] },
    ]);
  });

  it("returns success when there is no stored image path", async () => {
    const storage = {
      from() {
        throw new Error("should not remove");
      },
    };

    await expect(removeStoredMealImage(storage, null)).resolves.toEqual({
      ok: true,
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
      removeStoredMealImage(storage, "user-1/meal.jpg"),
    ).resolves.toEqual({
      ok: false,
      errorMessage: "storage network failed",
    });
  });
});
