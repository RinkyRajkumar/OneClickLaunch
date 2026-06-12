import { nativeImage, type NativeImage } from "electron";
import { deflateSync } from "node:zlib";

const size = 32;

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function createPng() {
  const rowLength = size * 4 + 1;
  const pixels = Buffer.alloc(rowLength * size);

  for (let y = 0; y < size; y += 1) {
    pixels[y * rowLength] = 0;
    for (let x = 0; x < size; x += 1) {
      const offset = y * rowLength + 1 + x * 4;
      const roundedCorner =
        (x < 5 && y < 5 && (x - 5) ** 2 + (y - 5) ** 2 > 25) ||
        (x > 26 && y < 5 && (x - 26) ** 2 + (y - 5) ** 2 > 25) ||
        (x < 5 && y > 26 && (x - 5) ** 2 + (y - 26) ** 2 > 25) ||
        (x > 26 && y > 26 && (x - 26) ** 2 + (y - 26) ** 2 > 25);

      if (!roundedCorner) {
        pixels[offset] = 54;
        pixels[offset + 1] = 199;
        pixels[offset + 2] = 154;
        pixels[offset + 3] = 255;
      }

      const inPlayTriangle = x >= 11 && x <= 23 && y >= 8 && y <= 24 && x - 11 >= Math.abs(y - 16) * 0.72;
      if (inPlayTriangle) {
        pixels[offset] = 9;
        pixels[offset + 1] = 9;
        pixels[offset + 2] = 11;
        pixels[offset + 3] = 255;
      }
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

export function createTrayIcon(): NativeImage {
  return nativeImage.createFromBuffer(createPng()).resize({ width: 16, height: 16 });
}
