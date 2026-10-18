import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";

// Usage: node scripts/make-demo-gif.mjs INPUT.png OUTPUT.gif FOCUS_X FOCUS_Y
// Dependency-free GIF encoder for the captured README previews.
const [, , inputPath, outputPath, xArg, yArg] = process.argv;
if (!outputPath) throw new Error("Usage: make-demo-gif.mjs INPUT.png OUTPUT.gif FOCUS_X FOCUS_Y");

const png = readFileSync(inputPath);
if (png.subarray(0, 8).compare(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error("Expected a PNG");

let offset = 8;
let width, height, colorType;
const idat = [];
while (offset < png.length) {
  const length = png.readUInt32BE(offset);
  const type = png.subarray(offset + 4, offset + 8).toString("ascii");
  const data = png.subarray(offset + 8, offset + 8 + length);
  if (type === "IHDR") {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    if (data[8] !== 8 || ![2, 6].includes(data[9])) throw new Error("Only 8-bit RGB/RGBA PNGs are supported");
    colorType = data[9];
  }
  if (type === "IDAT") idat.push(data);
  offset += length + 12;
}
const channels = colorType === 6 ? 4 : 3;
const packed = inflateSync(Buffer.concat(idat));
const rgba = Buffer.alloc(width * height * 3);
let previous = Buffer.alloc(width * channels);
let at = 0;
for (let y = 0; y < height; y++) {
  const filter = packed[at++];
  const row = Buffer.from(packed.subarray(at, at + width * channels));
  at += row.length;
  for (let x = 0; x < row.length; x++) {
    const left = x >= channels ? row[x - channels] : 0;
    const up = previous[x];
    const upperLeft = x >= channels ? previous[x - channels] : 0;
    if (filter === 1) row[x] = (row[x] + left) & 255;
    else if (filter === 2) row[x] = (row[x] + up) & 255;
    else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 255;
    else if (filter === 4) {
      const p = left + up - upperLeft;
      const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upperLeft);
      row[x] = (row[x] + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upperLeft)) & 255;
    } else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);
  }
  for (let x = 0; x < width; x++) {
    const source = x * channels;
    const target = (y * width + x) * 3;
    rgba[target] = row[source]; rgba[target + 1] = row[source + 1]; rgba[target + 2] = row[source + 2];
  }
  previous = row;
}

const outWidth = 720;
const outHeight = Math.round(outWidth * height / width);
const frameCount = 32;
const focusX = Number(xArg), focusY = Number(yArg);
const chunks = [];
const push = (...values) => chunks.push(Buffer.from(values));
const u16 = (n) => push(n & 255, n >> 8);
push(...Buffer.from("GIF89a")); u16(outWidth); u16(outHeight); push(0xf7, 0, 0);
for (let i = 0; i < 256; i++) push((i & 0xe0) | 16, ((i << 3) & 0xe0) | 16, ((i << 6) & 0xc0) | 32);
push(0x21, 0xff, 0x0b, ...Buffer.from("NETSCAPE2.0"), 3, 1, 0, 0, 0);

function lzw(indices) {
  const clear = 256, end = 257;
  let dictionary = new Map();
  let next = 258, codeSize = 9, bitBuffer = 0, bits = 0;
  const bytes = [];
  const write = (code) => { bitBuffer |= code << bits; bits += codeSize; while (bits >= 8) { bytes.push(bitBuffer & 255); bitBuffer >>>= 8; bits -= 8; } };
  const reset = () => { dictionary = new Map(); next = 258; codeSize = 9; };
  reset(); write(clear);
  let phrase = String(indices[0]);
  for (let i = 1; i < indices.length; i++) {
    const value = indices[i], joined = `${phrase},${value}`;
    if (dictionary.has(joined)) phrase = joined;
    else {
      write(phrase.includes(",") ? dictionary.get(phrase) : Number(phrase));
      if (next < 4096) {
        dictionary.set(joined, next++);
        // The decoder adds an entry only after it reads the next code, so grow
        // one emitted code later than the encoder's insertion counter.
        if (next === (1 << codeSize) + 1 && codeSize < 12) codeSize++;
      } else { write(clear); reset(); }
      phrase = String(value);
    }
  }
  write(phrase.includes(",") ? dictionary.get(phrase) : Number(phrase)); write(end);
  if (bits) bytes.push(bitBuffer & 255);
  return Buffer.from(bytes);
}

for (let frame = 0; frame < frameCount; frame++) {
  const t = frame / (frameCount - 1), eased = 0.5 - 0.5 * Math.cos(Math.PI * t);
  const zoom = 1 + 0.24 * eased, cropW = width / zoom, cropH = height / zoom;
  const centerX = Math.min(Math.max(focusX * width, cropW / 2), width - cropW / 2);
  const centerY = Math.min(Math.max(focusY * height, cropH / 2), height - cropH / 2);
  const left = centerX - cropW / 2, top = centerY - cropH / 2;
  const indices = Buffer.alloc(outWidth * outHeight);
  for (let y = 0; y < outHeight; y++) for (let x = 0; x < outWidth; x++) {
    const sx = Math.min(width - 1, Math.max(0, Math.floor(left + (x + 0.5) * cropW / outWidth)));
    const sy = Math.min(height - 1, Math.max(0, Math.floor(top + (y + 0.5) * cropH / outHeight)));
    const source = (sy * width + sx) * 3;
    indices[y * outWidth + x] = (rgba[source] & 0xe0) | ((rgba[source + 1] & 0xe0) >> 3) | ((rgba[source + 2] & 0xc0) >> 6);
  }
  push(0x21, 0xf9, 4, 4, 6, 0, 0, 0, 0x2c); u16(0); u16(0); u16(outWidth); u16(outHeight); push(0, 8);
  const encoded = lzw(indices);
  for (let i = 0; i < encoded.length; i += 255) push(Math.min(255, encoded.length - i), ...encoded.subarray(i, i + 255));
  push(0);
}
push(0x3b);
writeFileSync(outputPath, Buffer.concat(chunks));
