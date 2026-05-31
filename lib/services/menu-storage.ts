type MenuImageStorageClient = {
  from(bucketName: string): {
    remove(paths: string[]): Promise<{
      error: { message?: string } | null;
    }>;
  };
};

export type RemoveStoredMenuImageResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

export async function removeStoredMenuImage(
  storage: MenuImageStorageClient,
  imagePath: string,
): Promise<RemoveStoredMenuImageResult> {
  if (!imagePath) {
    return { ok: false, errorMessage: "Missing menu image path." };
  }

  try {
    const { error } = await storage.from("menu-images").remove([imagePath]);

    if (error) {
      return {
        ok: false,
        errorMessage: error.message ?? "Could not remove menu image.",
      };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, errorMessage: getStorageErrorMessage(error) };
  }
}

function getStorageErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not remove menu image.";
}
