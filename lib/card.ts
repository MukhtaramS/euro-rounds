import type { Post } from "./types";

export const CARD_SIZE = 1080;

const NAVY = "#14213D";
const GOLD = "#F2BE3A";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.72)";

const PAD = 110;
const BAR_WIDTH = 28;
const FALLBACK_FONT = '"Helvetica Neue", Arial, sans-serif';

export interface CardPhoto {
  image: CanvasImageSource & { width: number; height: number };
  credit: string;
}

// next/font registers Geist under a generated family name exposed via --font-geist-sans.
function cardFont() {
  const geist = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
  return geist ? `${geist}, ${FALLBACK_FONT}` : FALLBACK_FONT;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Largest headline size (from `max` down) that fits in at most `maxLines` lines.
function fitHeadline(ctx: CanvasRenderingContext2D, text: string, font: string, max: number, maxLines: number) {
  const maxWidth = CARD_SIZE - PAD * 2;
  let size = max;
  let lines: string[] = [];
  for (; size >= 52; size -= 4) {
    ctx.font = `800 ${size}px ${font}`;
    lines = wrap(ctx, text, maxWidth);
    if (lines.length <= maxLines) break;
  }
  return { size, lines };
}

// Scales the photo to cover the whole card, cropping the overflow (like CSS object-fit: cover).
function drawCover(ctx: CanvasRenderingContext2D, photo: CardPhoto["image"]) {
  const scale = Math.max(CARD_SIZE / photo.width, CARD_SIZE / photo.height);
  const w = photo.width * scale;
  const h = photo.height * scale;
  ctx.drawImage(photo, (CARD_SIZE - w) / 2, (CARD_SIZE - h) / 2, w, h);
}

// Draws the Euro Rounds card. Classic: navy background, headline centered.
// Photo: the photo full-bleed under a navy gradient, headline anchored to the bottom, photo credit top-right.
// Both: gold left bar, company · city at the bottom, "Euro Rounds" in gold bottom-right.
export function drawCard(
  canvas: HTMLCanvasElement,
  post: Pick<Post, "headline" | "company" | "city" | "country">,
  photo?: CardPhoto,
) {
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const font = cardFont();

  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  if (photo) {
    drawCover(ctx, photo.image);
    const shade = ctx.createLinearGradient(0, 0, 0, CARD_SIZE);
    shade.addColorStop(0, "rgba(20,33,61,0.15)");
    shade.addColorStop(0.4, "rgba(20,33,61,0.45)");
    shade.addColorStop(0.75, "rgba(20,33,61,0.92)");
    shade.addColorStop(1, "rgba(20,33,61,0.98)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
  }

  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 0, BAR_WIDTH, CARD_SIZE);

  const bottom = CARD_SIZE - PAD + 20;
  const { size, lines } = fitHeadline(ctx, post.headline, font, photo ? 96 : 112, photo ? 3 : 4);
  const lineHeight = size * 1.12;
  // Classic centers the headline; Photo keeps it low so the picture stays visible above it.
  const firstBaseline = photo
    ? bottom - 90 - (lines.length - 1) * lineHeight
    : (CARD_SIZE - 160 - lines.length * lineHeight) / 2 + size * 0.85;

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = WHITE;
  ctx.font = `800 ${size}px ${font}`;
  if (photo) {
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 18;
  }
  lines.forEach((l, i) => ctx.fillText(l, PAD, firstBaseline + i * lineHeight));
  ctx.shadowBlur = 0;

  const place = [post.company, post.city || post.country].filter(Boolean).join(" · ");
  ctx.font = `500 40px ${font}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(place, PAD, bottom, CARD_SIZE - PAD * 2 - 320);

  ctx.font = `800 40px ${font}`;
  ctx.fillStyle = GOLD;
  ctx.textAlign = "right";
  ctx.fillText("Euro Rounds", CARD_SIZE - PAD + 40, bottom);

  if (photo?.credit) {
    ctx.font = `500 24px ${font}`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 8;
    ctx.fillText(`Photo: ${photo.credit}`, CARD_SIZE - 48, 64);
    ctx.shadowBlur = 0;
  }
}

// Draws each line as text on its own solid box, like a printed sticker.
function boxedLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  firstTop: number,
  size: number,
  colors: { box: string; text: string },
) {
  const padX = size * 0.22;
  const boxH = size * 1.12;
  lines.forEach((line, i) => {
    const top = firstTop + i * boxH;
    ctx.fillStyle = colors.box;
    ctx.fillRect(x, top, ctx.measureText(line).width + padX * 2, boxH);
    ctx.fillStyle = colors.text;
    ctx.fillText(line, x + padX, top + size * 0.9);
  });
  return firstTop + lines.length * boxH;
}

// First sentence of the post: the hook, used as the caption on the Bold card.
function hookLine(post: string) {
  const first = post.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  return first.length > 110 ? `${first.slice(0, 107).trimEnd()}…` : first;
}

// Bold poster: full-bleed photo, uppercase headline in black-on-white boxes (top-left),
// the post's hook in white-on-black boxes (bottom-left), photo credit, Euro Rounds block (bottom-right).
export function drawBoldCard(
  canvas: HTMLCanvasElement,
  post: Pick<Post, "headline" | "company" | "city" | "country" | "post">,
  photo: CardPhoto,
) {
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const font = cardFont();
  const margin = 56;
  const maxWidth = CARD_SIZE - margin * 2 - 40;

  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
  drawCover(ctx, photo.image);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Headline: biggest size that fits in 3 lines.
  const headline = post.headline.toUpperCase();
  let size = 92;
  let lines: string[] = [];
  for (; size >= 52; size -= 4) {
    ctx.font = `900 ${size}px ${font}`;
    lines = wrap(ctx, headline, maxWidth);
    if (lines.length <= 3) break;
  }
  boxedLines(ctx, lines, margin, margin, size, { box: WHITE, text: "#0B0B0B" });

  // Caption: the hook, max 3 lines, anchored above the bottom row.
  ctx.font = `600 38px ${font}`;
  const caption = wrap(ctx, hookLine(post.post), CARD_SIZE * 0.62).slice(0, 3);
  const captionTop = CARD_SIZE - margin - 70 - caption.length * 38 * 1.12;
  boxedLines(ctx, caption, margin, captionTop, 38, { box: "rgba(0,0,0,0.88)", text: WHITE });

  // Bottom row: company · place (+ credit) left, Euro Rounds block right.
  const place = [post.company, post.city || post.country].filter(Boolean).join(" · ").toUpperCase();
  ctx.font = `800 26px ${font}`;
  ctx.fillStyle = WHITE;
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 10;
  ctx.fillText(place, margin, CARD_SIZE - margin - 22, CARD_SIZE * 0.6);
  if (photo.credit) {
    ctx.font = `500 20px ${font}`;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(`PHOTO: ${photo.credit.toUpperCase()}`, margin, CARD_SIZE - margin + 8, CARD_SIZE * 0.6);
  }
  ctx.shadowBlur = 0;

  ctx.font = `900 40px ${font}`;
  const label = "EURO ROUNDS";
  const labelW = ctx.measureText(label).width + 36;
  const labelX = CARD_SIZE - margin - labelW;
  const labelY = CARD_SIZE - margin - 64;
  ctx.fillStyle = GOLD;
  ctx.fillRect(labelX, labelY, labelW, 64);
  ctx.fillStyle = NAVY;
  ctx.fillText(label, labelX + 18, labelY + 46);
}

export function cardFileName(post: Pick<Post, "company">) {
  const slug = post.company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `euro-rounds-${slug || "card"}.png`;
}
