"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Copy, Download, ExternalLink, ImagePlus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { cardFileName, drawBoldCard, drawCard, type CardPhoto } from "@/lib/card";
import type { Post, PostStatus } from "@/lib/types";

const X_LIMIT = 280;

// Layout of the card; Photo and Bold use the uploaded photo if there is one, else the article photo.
type CardStyle = "classic" | "photo" | "bold";

interface Props {
  post: Post;
  onStatus: (id: number, status: PostStatus) => Promise<void>;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

export default function PostCard({ post, onStatus }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<PostStatus | null>(null);
  const [style, setStyle] = useState<CardStyle>("classic");
  // undefined = still looking, null = the source article has no usable photo.
  const [articlePhoto, setArticlePhoto] = useState<CardPhoto | null | undefined>(undefined);
  const [uploadPhoto, setUploadPhoto] = useState<CardPhoto | null>(null);

  // Served through our own route so the canvas stays exportable (cross-origin images would taint it).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/post-image?id=${post.id}`);
        if (!res.ok) throw new Error();
        const credit = res.headers.get("x-image-credit") ?? "";
        const image = await loadImage(URL.createObjectURL(await res.blob()));
        if (!cancelled) setArticlePhoto({ image, credit });
      } catch {
        if (!cancelled) setArticlePhoto(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const photo = uploadPhoto ?? articlePhoto ?? undefined;
    // Wait for Geist to load so the card uses it instead of the fallback font.
    document.fonts.ready.then(() => {
      if (style === "bold" && photo) drawBoldCard(canvas, post, photo);
      else drawCard(canvas, post, style === "photo" ? photo : undefined);
    });
  }, [post, style, articlePhoto, uploadPhoto]);

  const hasPhoto = Boolean(uploadPhoto ?? articlePhoto);

  async function onUpload(file: File | undefined) {
    if (!file) return;
    try {
      const image = await loadImage(URL.createObjectURL(file));
      setUploadPhoto({ image, credit: "" });
      if (style === "classic") setStyle("bold");
    } catch {
      toast.error("Could not read that image");
    }
  }

  // Add hashtags to the X version only while it stays within X's limit.
  const xText = post.hashtags
    .split(" ")
    .filter(Boolean)
    .reduce((text, tag) => (text.length + 1 + tag.length <= X_LIMIT ? `${text} ${tag}` : text), post.post_x ?? "")
    .trim();
  const fullText = [post.post, post.hashtags].filter(Boolean).join("\n\n");

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  function download() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cardFileName(post);
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  async function setStatus(status: PostStatus) {
    setBusy(status);
    try {
      await onStatus(post.id, status);
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="grid gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 md:grid-cols-[minmax(0,320px)_1fr]">
      <div className="space-y-3">
        <canvas ref={canvasRef} className="aspect-square w-full rounded-lg" aria-label={`Card: ${post.headline}`} />

        <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-950/60 p-1 text-xs">
          {(["classic", "photo", "bold"] as const).map((s) => (
            <StyleButton
              key={s}
              active={style === s}
              disabled={s !== "classic" && !hasPhoto}
              title={s !== "classic" && !hasPhoto ? "No article photo. Upload one below." : undefined}
              onClick={() => setStyle(s)}
            >
              {s === "classic" ? "Classic" : s === "photo" ? "Photo" : "Bold"}
            </StyleButton>
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onUpload(e.target.files?.[0])} />
        <p className="flex flex-wrap items-center gap-x-2 text-[11px] leading-snug text-zinc-500">
          <span>
            {uploadPhoto
              ? "Using your photo."
              : articlePhoto === undefined
                ? "Looking for a photo in the article…"
                : articlePhoto
                  ? `Photo from ${articlePhoto.credit}.`
                  : "No photo in the article."}
          </span>
          <button className="inline-flex items-center gap-1 text-zinc-300 underline" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={11} /> {uploadPhoto ? "Replace photo" : "Upload your own"}
          </button>
          {uploadPhoto && articlePhoto && (
            <button className="text-zinc-300 underline" onClick={() => setUploadPhoto(null)}>
              Use article photo
            </button>
          )}
        </p>
        {style !== "classic" && !uploadPhoto && articlePhoto && (
          <p className="text-[11px] leading-snug text-amber-300/80">
            This photo belongs to the publisher. Check you may reuse it before posting, or upload a press photo.
          </p>
        )}

        <button onClick={download} className="btn w-full justify-center">
          <Download size={16} /> Download image (1080×1080)
        </button>
      </div>

      <div className="min-w-0 space-y-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">{post.headline}</h2>
            <p className="text-sm text-zinc-400">
              {post.company} · {[post.city, post.country].filter(Boolean).join(", ")} · {post.amount}
              {post.round ? ` · ${post.round}` : ""}
            </p>
          </div>
          <StatusBadge status={post.status} />
        </header>

        {post.check && (
          <p className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            <AlertTriangle size={16} /> Check the amount: sources disagree.
          </p>
        )}

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="label">Post · LinkedIn / Facebook / Instagram</h3>
            <button onClick={() => copy(fullText, "Post")} className="btn-sm">
              <Copy size={14} /> Copy post
            </button>
          </div>
          <p className="whitespace-pre-line rounded-lg bg-zinc-950/60 p-3 text-sm leading-relaxed text-zinc-200">{post.post}</p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="label">
              X version{" "}
              <span className={xText.length > X_LIMIT ? "text-red-400" : "text-zinc-500"}>
                {xText.length}/{X_LIMIT}
              </span>
            </h3>
            <button onClick={() => copy(xText, "X version")} className="btn-sm">
              <Copy size={14} /> Copy X version
            </button>
          </div>
          <p className="rounded-lg bg-zinc-950/60 p-3 text-sm text-zinc-200">{post.post_x || "—"}</p>
        </section>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono text-blue-400">{post.hashtags}</span>
          <button onClick={() => copy(post.hashtags, "Hashtags")} className="btn-sm">
            <Copy size={14} /> Copy hashtags
          </button>
          {post.source_url && (
            <a href={post.source_url} target="_blank" rel="noreferrer" className="btn-sm">
              <ExternalLink size={14} /> Source
            </a>
          )}
        </div>

        <footer className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          {post.status !== "approved" && (
            <button disabled={!!busy} onClick={() => setStatus("approved")} className="btn bg-emerald-600 hover:bg-emerald-500">
              <Check size={16} /> {busy === "approved" ? "Saving…" : "Approve"}
            </button>
          )}
          {post.status !== "rejected" && (
            <button disabled={!!busy} onClick={() => setStatus("rejected")} className="btn bg-zinc-800 hover:bg-red-600">
              <X size={16} /> {busy === "rejected" ? "Saving…" : "Reject"}
            </button>
          )}
          {post.status !== "pending" && (
            <button disabled={!!busy} onClick={() => setStatus("pending")} className="btn bg-zinc-800 hover:bg-zinc-700">
              <RotateCcw size={16} /> Back to pending
            </button>
          )}
          {Number(post.cost_usd) > 0 && (
            <span className="ml-auto self-center font-mono text-xs text-zinc-500">Claude cost ${Number(post.cost_usd).toFixed(3)}</span>
          )}
        </footer>
      </div>
    </article>
  );
}

function StyleButton({
  active,
  children,
  ...rest
}: { active: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  const styles: Record<PostStatus, string> = {
    pending: "bg-blue-500/15 text-blue-300",
    approved: "bg-emerald-500/15 text-emerald-300",
    rejected: "bg-red-500/15 text-red-300",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}>{status}</span>;
}
