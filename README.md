# cf-colorthief

a modified version of colorthief that uses [jsquash](https://github.com/jamsinclair/jSquash) to provide WASM-based image decoding. compatible out of the box with cloudflare workers.

identical results & (nearly) identical API to the original colorthief, as well as including scrict types.

the only con of this library is that it only includes support for PNG, JPEG, WebP, and AVIF. for other formats supported by the jsquash project, you should import it manually and pass it in to the `getPalette` or `getColor` functions.

## usage

examples based on code from [calore](https://github.com/thrzl/calore), the cloudflare worker this library was built for.

### get a color palette

```ts
const imageResp = await fetch(imageURL);

const buffer = await imageResp.arrayBuffer();

const palette: [number, number, number][] = await getPalette(buffer, colorCount, quality);
```

### get a single color

this is done by getting a 5-color palette and taking only, the first, just like in the original module.

```ts
const imageResp = await fetch(imageURL);

const buffer = await imageResp.arrayBuffer();

const color: [number, number, number] = await getColor(buffer, 1);
```

### using your own decoder

```ts
import { decode } from '@jsquash/jxl'

// or, if using cloudflare workers...
import decode, { init as initJXLDecode } from '@jsquash/jxl/decode';
import JXL_WASM from '../node_modules/@jsquash/jxl/codec/dec/jxl_dec.wasm';
initJXLDecode(JXL_WASM)

const palette: [number, number, number][] = await getPalette(buffer, colorCount, 1, decode);
```
