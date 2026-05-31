declare module "heic-convert" {
  import type { Buffer } from "node:buffer";

  type ConvertOptions = {
    buffer: Buffer | Uint8Array | ArrayBuffer;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  type ConvertResult = Buffer | Uint8Array | ArrayBuffer;

  type Convert = {
    (options: ConvertOptions): Promise<ConvertResult>;
    all(
      options: ConvertOptions,
    ): Promise<Array<{ convert: () => Promise<ConvertResult> }>>;
  };

  const convert: Convert;
  export default convert;
}
