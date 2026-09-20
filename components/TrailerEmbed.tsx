"use client";

import { Play } from "lucide-react";
import { useState } from "react";

/**
 * YouTube embed behind a facade.
 *
 * Nothing from YouTube loads until somebody presses play — an embed pulls
 * roughly a megabyte of scripts, and on the school wifi that would stall the
 * whole page for a video most visitors never open.
 *
 * Passing `url = null` renders the "coming soon" state, so the page works
 * before the team has published anything.
 */
export default function TrailerEmbed({
  url,
  title,
}: {
  url: string | null;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const videoId = url ? youtubeId(url) : null;

  if (!videoId) {
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

  if (playing) {
    return (
      <div className="card aspect-video overflow-hidden">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={`Book trailer de ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="size-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="card group relative grid aspect-video w-full place-items-center overflow-hidden"
      aria-label={`Reproducir el book trailer de ${title}`}
    >
      {/* YouTube's own thumbnail: one image instead of the whole player */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-80"
      />
      <span className="relative grid size-20 place-items-center rounded-full bg-gold text-midnight shadow-2xl transition-transform duration-300 group-hover:scale-110">
        <Play aria-hidden className="size-8 translate-x-0.5 fill-current" strokeWidth={0} />
      </span>
    </button>
  );
}

/** Pulls the id out of the usual YouTube URL shapes. */
function youtubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Already a bare id
  return /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
}
