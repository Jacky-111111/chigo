type MealImageStorageClient = {
  from(bucketName: string): {
    remove(paths: string[]): Promise<{
      error: { message?: string } | null;
    }>;
  };
};

export async function removeStoredMealImage(
  storage: MealImageStorageClient,
  imagePath: string | null,
) {
  if (!imagePath) {
    return { ok: true as const };
  }

  try {
    const { error } = await storage.from("meal-images").remove([imagePath]);

    if (error) {
      return {
        ok: false as const,
        errorMessage: error.message ?? "Could not remove meal image.",
      };
    }

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      errorMessage:
        error instanceof Error ? error.message : "Could not remove meal image.",
    };
  }
}
