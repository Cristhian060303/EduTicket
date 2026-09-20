"use client";

import { Play, RotateCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Two APIs that TypeScript does not declare yet.
 *
 * `lock` is the Screen Orientation API, which only works while in native
 * fullscreen and is absent on iOS. `webkitEnterFullscreen` is iOS Safari's
 * own video player, which rotates to landscape by itself — it is the only way
 * to get the effect there.
 */
type OrientationLock = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
  unlock?: () => void;
};

type IOSVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

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
  const videoRef = useRef<HTMLVideoElement>(null);

  const isFile = Boolean(url && (/\.(mp4|webm|mov)$/i.test(url) || url.startsWith("/")));
  const videoId = url && !isFile ? youtubeId(url) : null;

  const close = useCallback(() => {
    setClosing(true);

    // Give the phone its rotation back before anything else.
    (screen.orientation as OrientationLock | undefined)?.unlock?.();

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

    window.setTimeout(async () => {
      closeButtonRef.current?.focus();

      const phone = window.matchMedia("(max-width: 900px)").matches;
      const overlay = overlayRef.current;

      try {
        // Fullscreen first: locking the orientation is only allowed from
        // inside it. Some browsers refuse it for a plain element.
        await overlay?.requestFullscreen?.();

        if (phone) {
          // Android/Chrome honours this. It fails when the phone has its own
          // rotation lock on, which is the user's choice to make, not ours.
          await (screen.orientation as OrientationLock).lock?.("landscape");
        }
      } catch {
        // iOS Safari lands here: it grants fullscreen to a <video> and to
        // nothing else, and knows no orientation lock. Its native player
        // rotates on its own, so hand the video over to it.
        const video = videoRef.current as IOSVideo | null;
        if (phone && video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
      }
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

    // On iOS the video plays in Safari's own player: when the viewer dismisses
    // it, the theatre behind has to go too, or they come back to a black
    // screen with nothing on it.
    const video = videoRef.current;
    video?.addEventListener("webkitendfullscreen", close);

    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      video?.removeEventListener("webkitendfullscreen", close);
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
          className={`fixed inset-0 z-100 grid place-items-center bg-midnight/95 p-3 backdrop-blur-xl sm:p-6 ${
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
                ref={videoRef}
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

          {/* Shown only on a phone held upright. Whether the screen refuses to
              turn because the rotation lock is on cannot be detected, so the
              message has to cover both cases: turning it, and why turning it
              might do nothing. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 px-6 text-center portrait:block sm:portrait:hidden">
            <p className="inline-flex items-center gap-2 text-xs text-parchment/90">
              <RotateCw aria-hidden className="size-[1.15em] shrink-0" />
              Gira el teléfono para verlo en grande
            </p>
            <p className="mt-1 text-[11px] leading-snug text-mist/70">
              Si no rota, desactiva el bloqueo de rotación de tu celular
            </p>
          </div>

          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-mist/60 portrait:hidden sm:portrait:block">
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
