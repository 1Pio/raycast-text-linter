import { rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const size = 512;
const ppmPath = join(process.cwd(), "assets", "icon.ppm");
const pngPath = join(process.cwd(), "assets", "icon.png");

function colorAt(x, y) {
  const left = [32, 61, 84];
  const right = [45, 108, 96];
  const ratio = x / (size - 1);
  const base = left.map((channel, index) => Math.round(channel * (1 - ratio) + right[index] * ratio));

  const insidePaper = x > 120 && x < 392 && y > 92 && y < 420;
  const lineOne = x > 166 && x < 346 && y > 176 && y < 198;
  const lineTwo = x > 166 && x < 346 && y > 242 && y < 264;
  const check = x > 158 && x < 354 && y > 305 && y < 356 && Math.abs(y - (365 - 0.35 * x)) < 10;

  if (insidePaper) {
    return [246, 249, 247];
  }
  if (lineOne || lineTwo) {
    return [44, 62, 80];
  }
  if (check) {
    return [28, 150, 118];
  }
  return base;
}

const bytes = [`P6\n${size} ${size}\n255\n`];
const pixels = Buffer.alloc(size * size * 3);
let offset = 0;
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const [r, g, b] = colorAt(x, y);
    pixels[offset++] = r;
    pixels[offset++] = g;
    pixels[offset++] = b;
  }
}
bytes.push(pixels);
writeFileSync(
  ppmPath,
  Buffer.concat(bytes.map((part) => (typeof part === "string" ? Buffer.from(part) : part))),
);
execFileSync("sips", ["-s", "format", "png", ppmPath, "--out", pngPath], { stdio: "inherit" });
rmSync(ppmPath, { force: true });
