// Just enough PNG to write pixel art at build time (share images, the art contact sheet)
// without an image library: an RGBA bitmap you draw pixel art into, and an encoder.
import { crc32, deflateSync } from 'node:zlib';

const hexToRgba = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
  255,
];

export function createBitmap(width, height, background = null) {
  const data = new Uint8Array(width * height * 4);
  const bitmap = {
    width,
    height,
    data,
    // Fills a rectangle; anything outside the bitmap is clipped.
    fill(x, y, w, h, hex) {
      const rgba = hexToRgba(hex);
      for (let py = Math.max(0, y); py < Math.min(height, y + h); py++) {
        for (let px = Math.max(0, x); px < Math.min(width, x + w); px++) {
          data.set(rgba, (py * width + px) * 4);
        }
      }
    },
    // Draws pixel-art rows (see src/engine/pixel-art.js) with each art pixel `scale` wide.
    drawArt(rows, palette, x, y, scale = 1) {
      rows.forEach((row, ry) => {
        [...row].forEach((char, rx) => {
          if (char in palette) bitmap.fill(x + rx * scale, y + ry * scale, scale, scale, palette[char]);
        });
      });
    },
  };
  if (background) bitmap.fill(0, 0, width, height, background);
  return bitmap;
}

function chunk(type, body) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const typeAndBody = Buffer.concat([Buffer.from(type, 'ascii'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndBody));
  return Buffer.concat([length, typeAndBody, crc]);
}

export function encodePng({ width, height, data }) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bits per channel
  header[9] = 6; // RGBA
  // Each row is prefixed with filter type 0 (none); pixel art compresses well regardless.
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    Buffer.from(data.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
