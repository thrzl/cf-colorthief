// @ts-ignore
import quantize from "@lokesh.dhakar/quantize";
import { decode } from "./decoders";

type DecodeFunction = (
  data: ArrayBuffer,
  options?: object,
) => Promise<{ data: Uint8Array; width: number; height: number }>;

function createPixelArray(
  pixels: Uint8Array,
  pixelCount: number,
  quality: number,
) {
  const pixelArray = [];

  for (
    let i = 0,
      offset: number,
      r: number,
      g: number,
      b: number,
      a: number | undefined;
    i < pixelCount;
    i += quality
  ) {
    offset = i * 4;

    r = pixels[offset] ?? 0;
    g = pixels[offset + 1] ?? 0;
    b = pixels[offset + 2] ?? 0;
    a = pixels[offset + 3] ?? 0;

    // If pixel is mostly opaque and not white
    if (
      (typeof a === "undefined" || a >= 125) &&
      !(r > 250 && g > 250 && b > 250)
    )
      pixelArray.push([r, g, b]);
  }

  return pixelArray;
}

function validateOptions(options: { colorCount: number; quality: number }) {
  let { colorCount, quality } = options;

  if (typeof colorCount === "undefined" || !Number.isInteger(colorCount)) {
    colorCount = 10;
  } else if (colorCount === 1) {
    throw new Error(
      "`colorCount` should be between 2 and 20. To get one color, call `getColor()` instead of `getPalette()`",
    );
  } else {
    colorCount = Math.max(colorCount, 2);
    colorCount = Math.min(colorCount, 20);
  }

  if (
    typeof quality === "undefined" ||
    !Number.isInteger(quality) ||
    quality < 1
  )
    quality = 10;

  return { colorCount, quality };
}

export async function getPalette(
  img: ArrayBuffer,
  colorCount = 10,
  quality = 10,
  decoder: DecodeFunction | undefined = undefined,
): Promise<[number, number, number][]> {
  const options = validateOptions({ colorCount, quality });

  decoder = decoder || decode;
  const imgData = await decoder(img);
  const pixelCount = imgData.width * imgData.height;
  const pixelArray = createPixelArray(
    imgData.data,
    pixelCount,
    options.quality,
  );

  const cmap = quantize(pixelArray, options.colorCount);
  const palette = cmap ? cmap.palette() : null;

  return palette;
}

export async function getColor(
  img: ArrayBuffer,
  quality = 10,
  decoder: DecodeFunction | undefined = undefined,
): Promise<[number, number, number]> {
  return (await getPalette(img, 5, quality, decoder))[0] as [
    number,
    number,
    number,
  ];
}
