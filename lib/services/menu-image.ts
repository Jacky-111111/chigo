import { Buffer } from "node:buffer";
import convert from "heic-convert";

export type NormalizedMenuImage = {
  buffer: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
  wasConverted: boolean;
};

const heicMimeTypes = new Set(["image/heic", "image/heif"]);
const heicExtensions = new Set(["heic", "heif"]);

export async function normalizeMenuImage({
  buffer,
  mimeType,
  filename,
}: {
  buffer: Buffer;
  mimeType: string;
  filename?: string;
}): Promise<NormalizedMenuImage> {
  if (isHeicLikeImage({ mimeType, filename })) {
    const converted = await convert({
      buffer,
      format: "JPEG",
      quality: 0.92,
    });

    return {
      buffer: toBuffer(converted),
      mimeType: "image/jpeg",
      extension: "jpg",
      wasConverted: true,
    };
  }

  const extension = filename?.split(".").pop()?.toLowerCase();

  if (mimeType === "image/png" || extension === "png") {
    return {
      buffer,
      mimeType: "image/png",
      extension: "png",
      wasConverted: false,
    };
  }

  if (mimeType === "image/webp" || extension === "webp") {
    return {
      buffer,
      mimeType: "image/webp",
      extension: "webp",
      wasConverted: false,
    };
  }

  return {
    buffer,
    mimeType: "image/jpeg",
    extension: "jpg",
    wasConverted: false,
  };
}

export function isHeicLikeImage({
  mimeType,
  filename,
}: {
  mimeType?: string | null;
  filename?: string | null;
}) {
  if (mimeType && heicMimeTypes.has(mimeType.toLowerCase())) {
    return true;
  }

  const extension = filename?.split(".").pop()?.toLowerCase();
  return Boolean(extension && heicExtensions.has(extension));
}

function toBuffer(value: Buffer | Uint8Array | ArrayBuffer) {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }

  return Buffer.from(value);
}
