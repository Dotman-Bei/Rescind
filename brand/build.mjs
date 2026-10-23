// Builds the Rescind logo set as plain SVG. Run: node brand/build.mjs
// Mark: a disc with its top-right quarter pulled out and set apart: your share taken back early,
// and the first quarter of the exit clock.
// Wordmark: condensed caps drawn on a 100-unit cap height, 20-unit stems, one chamfer motif.
import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const INK = "#181715", BRASS = "#bfb21a", PAPER = "#e8e8e3";

// --- mark (64 × 64) ---
const markShapes = (fg) =>
  `<path d="M29 35V16A19 19 0 1 0 48 35Z" fill="${fg}"/><path d="M34 30V11A19 19 0 0 1 53 30Z" fill="${fg}"/>`;
const mark = (bg, fg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" fill="${bg}"/>${markShapes(fg)}</svg>\n`;

// --- wordmark letters (cap height 100) ---
const L = {
  R: { w: 58, d: "M0 0H44L58 14V42L49 51L58 100H38L30 56H20V100H0ZM20 18V38H38V18Z" },
  E: { w: 54, d: "M0 0H54V18H20V41H48V59H20V82H54V100H0Z" },
  S: { w: 58, d: "M14 0H58V18H20V41H58V86L44 100H0V82H38V59H0V14Z" },
  C: { w: 56, d: "M14 0H56V18H20V82H56V100H14L0 86V14Z" },
  I: { w: 20, d: "M0 0H20V100H0Z" },
  N: { w: 60, d: "M0 0H20L40 52V0H60V100H40L20 48V100H0Z" },
  D: { w: 60, d: "M0 0H44L60 16V84L44 100H0ZM20 18V82H36L42 76V24L36 18Z" },
};
const GAP = 14;
function word(fill, x0 = 0, y0 = 0, scale = 1) {
  let x = 0;
  const parts = [];
  for (const ch of "RESCIND") {
    parts.push(`<path transform="translate(${x} 0)" fill-rule="evenodd" d="${L[ch].d}"/>`);
    x += L[ch].w + GAP;
  }
  const width = x - GAP;
  return { width, svg: `<g transform="translate(${x0} ${y0}) scale(${scale})" fill="${fill}">${parts.join("")}</g>` };
}

const wm = (fill) => {
  const { width, svg } = word(fill);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 100" width="${width}" height="100">${svg}</svg>\n`;
};

// --- lockup: mark at cap height + wordmark ---
function lockup(tileBg, tileFg, textFill, bg) {
  const s = 100 / 64; // mark scaled to cap height
  const { width, svg } = word(textFill, 100 + 28, 0);
  const W = 100 + 28 + width;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 100" width="${W}" height="100">${bg ? `<rect width="${W}" height="100" fill="${bg}"/>` : ""}<g transform="scale(${s})"><rect width="64" height="64" fill="${tileBg}"/>${markShapes(tileFg)}</g>${svg}</svg>\n`;
}

const files = {
  "rescind-mark.svg": mark(BRASS, INK),
  "rescind-mark-mono.svg": mark(INK, PAPER),
  "rescind-mark-mono-reversed.svg": mark(PAPER, INK),
  "rescind-wordmark.svg": wm(INK),
  "rescind-wordmark-paper.svg": wm(PAPER),
  "rescind-lockup.svg": lockup(BRASS, INK, INK),
  "rescind-lockup-mono.svg": lockup(INK, PAPER, INK),
  "rescind-lockup-reversed.svg": lockup(PAPER, INK, PAPER),
};
for (const [f, s] of Object.entries(files)) fs.writeFileSync(path.join(DIR, f), s);
console.log("wrote", Object.keys(files).join(", "));
