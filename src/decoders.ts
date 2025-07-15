import { init as initJPEG } from "@jsquash/jpeg/decode";
import { decode as decodeJPEG } from "@jsquash/jpeg";

import { init as initPNG } from "@jsquash/png/decode";
import { decode as decodePNG } from "@jsquash/png";

import { init as initWebP } from "@jsquash/webp/decode";
import { decode as decodeWebP } from "@jsquash/webp";

import { init as initAVIF } from "@jsquash/avif/decode";
import { decode as decodeAVIF } from "@jsquash/avif";

// @ts-ignore
import jpegWASM from "./codecs/mozjpeg_dec.wasm";
// @ts-ignore
import pngWASM from "./codecs/squoosh_png_bg.wasm";
// @ts-ignore
import webpWASM from "./codecs/webp_dec.wasm";
// @ts-ignore
import avifWASM from "./codecs/avif_dec.wasm";

const importedModules: Record<string, boolean> = {};

function doBytesMatch(data: ArrayBuffer, reference: number[]) {
  const dataArray = new Uint8Array(data);
  return reference.every((byte, i) => dataArray[i] === byte);
}

export async function decode(data: ArrayBuffer) {
  const decoder = chooseDecoder(data);
  if (!decoder) {
    throw Error(
      "failed to detect proper decoder for image. is the image corrupted?",
    );
  }
  return await decoder(data);
}

function detectFormat(
  data: ArrayBuffer,
): "png" | "jpeg" | "webp" | "avif" | undefined {
  if (doBytesMatch(data, [0x89, 0x50])) return "png";
  if (doBytesMatch(data, [0xff, 0xd8])) return "jpeg";
  if (doBytesMatch(data, [0x52, 0x49, 0x57, 0x45])) return "webp";
  if (doBytesMatch(data, [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]))
    return "avif";
}

export function chooseDecoder(imageData: ArrayBuffer) {
  const format = detectFormat(imageData);
  if (!format) {
    throw Error(
      "image format not detectable from PNG, JPEG, WebP, or AVIF. is the image corrupted?",
    );
  }
  return importDecoder(format);
}

export function importDecoder(
  decoder: "png" | "jpeg" | "webp" | "avif",
):
  | ((
      data: ArrayBuffer,
      options?: object,
    ) => Promise<{ data: Uint8Array; width: number; height: number }>)
  | undefined {
  switch (decoder) {
    case "png":
      if (!importedModules.png) {
        initPNG(pngWASM);
        importedModules.png = true;
      }
      return decodePNG;
    case "jpeg":
      if (!importedModules.jpeg) {
        initJPEG(jpegWASM);
        importedModules.jpeg = true;
      }
      return decodeJPEG;
    case "webp":
      if (!importedModules.webp) {
        initWebP(webpWASM);
        importedModules.webp = true;
      }
      return decodeWebP;
    case "avif":
      if (!importedModules.avif) {
        initAVIF(avifWASM);
        importedModules.avif = true;
      }
      return decodeAVIF;
  }
}
