"use client";

import { Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Book trailer player.
 *
 * Pressing play opens the video in a fullscreen theatre: the page dims, the
 * video scales up into place, and when it ends everything closes by itself
 * and returns to exactly where the reader was.
 *
 * Fullscreen is done in two layers. The overlay covers the viewport by itself,
 * which is what actually guarantees the effect everywhere; on top of that the
 * native Fullscreen API is requested as a bonus, and simply ignored where it
 * is unavailable — iOS Safari, for instance, refuses it for anything that is
 * not a <video>.
 *
 * Two sources are accepted: a file served by this site (`/trailers/….mp4`) or
 * a YouTube link. Neither loads until the click, so the landing page never
 * pays for a video most visitors do not open.
 *
 * `url = null` renders the "coming soon" state.
 */
export default function TrailerEmbed({
  url,
  title,
  poster,
}: {
  url: string | null;
  title: string;
  poster?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isFile = Boolean(url && (/\.(mp4|webm|mov)$/i.test(url) || url.startsWith("/")));
  const videoId = url && !isFile ? youtubeId(url) : null;

  const close = useCallback(() => {
    setClosing(true);

    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});

    // Let the closing animation finish before unmounting the video.
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      triggerRef.current?.focus();
    }, 220);
  }, []);

  const openTheatre = () => {
    setOpen(true);
    // Best effort: some browsers refuse fullscreen for a plain element.
    window.setTimeout(() => {
      overlayRef.current?.requestFullscreen?.().catch(() => {});
      closeButtonRef.current?.focus();
    }, 50);
  };

  // Escape closes, the page underneath stays put, and leaving native
  // fullscreen by any other means closes the theatre too.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !closing) close();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, closing, close]);

  if (!url || (!isFile && !videoId)) {
    return (
      <div className="card grid aspect-video place-items-center">
        <div className="px-6 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full border border-gold/40 text-gold animate-float">
            <Play aria-hidden className="size-6 translate-x-0.5 fill-current" strokeWidth={0} />
          </div>
          <p className="mt-5 font-display text-xl">El trailer se está grabando</p>
          <p className="mt-2 text-sm text-mist">
            Aparecerá aquí en cuanto el equipo lo publique.
          </p>
        </div>
      </div>
    );
  }

  // The still frame: our own poster for a local file, YouTube's for an embed.
  const thumbnail = isFile ? poster : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openTheatre}
        className="card group relative grid aspect-video w-full place-items-center overflow-hidden"
        aria-label={`Reproducir el book trailer de ${title} en pantalla completa`}
      >
        {thumbnail && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnail}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover opacity-70 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
          />
        )}

        <span className="absolute inset-0 bg-linear-to-t from-midnight/80 via-transparent to-transparent" />

        <span className="relative grid size-20 place-items-center rounded-full bg-gold text-midnight shadow-2xl transition-transform duration-300 group-hover:scale-110">
          <Play aria-hidden className="size-8 translate-x-0.5 fill-current" strokeWidth={0} />
        </span>
      </button>

      {open && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Book trailer de ${title}`}
          onClick={close}
          className={`fixed inset-0 z-[100] grid place-items-center bg-midnight/95 p-3 backdrop-blur-xl sm:p-6 ${
            closing ? "animate-curtain-out" : "animate-curtain-in"
          }`}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Cerrar el video"
            className="absolute top-4 right-4 z-10 grid size-11 place-items-center rounded-full bg-night/80 text-parchment transition-colors hover:bg-gold hover:text-midnight"
            style={{ top: "max(1rem, env(safe-area-inset-top, 0px))" }}
          >
            <X aria-hidden className="size-5" />
          </button>

          {/* Sized against the screen, not against a page column: the video
              grows to the largest 16:9 rectangle that fits, so a fullscreen
              theatre actually looks fullscreen. */}
          <div
            /* Clicking the video itself must not close the theatre */
            onClick={(event) => event.stopPropagation()}
            className={`flex size-full items-center justify-center ${
              closing ? "animate-stage-out" : "animate-stage-in"
            }`}
          >
            {isFile ? (
              <video
                src={url}
                poster={poster ?? undefined}
                controls
                autoPlay
                playsInline
                onEnded={close}
                /* size-full + object-contain, not max-h/max-w: a max is only a
                   ceiling, so a 1280x720 file kept rendering at its own size
                   and left the screen half empty. This fills the box and
                   letterboxes inside it, keeping the proportions. */
                className="size-full object-contain"
              >
                Tu navegador no puede reproducir este video.
              </video>
            ) : (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                title={`Book trailer de ${title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="aspect-video max-h-full w-full max-w-[calc(100dvh*16/9)] rounded-lg bg-black shadow-2xl shadow-black/60"
              />
            )}
          </div>

          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-mist/60">
            Toca fuera del video o presiona Esc para volver
          </p>
        </div>
      )}
    </>
  );
}

/** Pulls the id out of the usual YouTube URL shapes. */
function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/,
  );
  if (match) return match[1];

  // Already a bare id
  return /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
}
