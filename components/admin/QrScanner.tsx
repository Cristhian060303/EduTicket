"use client";

import {
  Camera,
  CameraOff,
  Check,
  CircleAlert,
  Loader2,
  TriangleAlert,
  Volume2,
  VolumeX,
} from "lucide-react";
import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";
import { checkInAction } from "@/app/admin/actions";
import { EVENT } from "@/lib/site";

/**
 * Continuous QR scanner for the door.
 *
 * One camera stays open and every ticket is checked in without leaving the
 * page — with thirty students queuing, opening a tab per person is the slow
 * part, not the scanning.
 *
 * Decoding happens entirely in the browser (jsQR over canvas frames): no
 * image ever leaves the phone. The camera is only requested after a tap,
 * because iOS requires a user gesture and because asking on page load, for a
 * page the team opens all afternoon, is rude.
 */

type Outcome = {
  id: number;
  tone: "ok" | "warn" | "bad";
  title: string;
  detail: string;
};

/** Accepts a full ticket URL or a bare token. */
function tokenFrom(text: string): string | null {
  const fromUrl = text.match(/\/t\/([0-9a-f]{16})/i);
  if (fromUrl) return fromUrl[1].toLowerCase();
  const bare = text.trim().toLowerCase();
  return /^[0-9a-f]{16}$/.test(bare) ? bare : null;
}

/**
 * A short alert tone, played ONLY when something needs a second look.
 *
 * A successful check-in stays silent: this is a literary event with talks
 * going on, and a beep per student would be thirty beeps of pure noise. The
 * sound is reserved for the two cases where the organiser has to stop and
 * look up — a ticket already used, or one that does not exist.
 */
function alertTone() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 320;
    gain.gain.value = 0.06;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
    setTimeout(() => void ctx.close(), 600);
  } catch {
    // Audio is a nicety; a blocked AudioContext must not stop the scanning.
  }
}

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  /** Tokens already handled recently, so one QR in view is not read 30 times */
  const seenRef = useRef<Map<string, number>>(new Map());
  const busyRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [muted, setMuted] = useState(false);
  /** Colours the aiming frame for a moment after each read */
  const [flash, setFlash] = useState<Outcome["tone"] | null>(null);

  const mutedRef = useRef(false);
  mutedRef.current = muted;

  // Remember the choice per phone: whoever mans the door prefers one way.
  useEffect(() => {
    try {
      setMuted(localStorage.getItem("eduticket-scanner-muted") === "1");
    } catch {
      // Private browsing or blocked storage: the default is fine.
    }
  }, []);

  const toggleMute = () => {
    setMuted((current) => {
      const next = !current;
      try {
        localStorage.setItem("eduticket-scanner-muted", next ? "1" : "0");
      } catch {
        // Not worth interrupting the door queue over.
      }
      return next;
    });
  };

  const handleToken = useCallback(async (token: string) => {
    const now = Date.now();
    const last = seenRef.current.get(token);
    if (busyRef.current || (last && now - last < 6000)) return;

    busyRef.current = true;
    seenRef.current.set(token, now);

    const result = await checkInAction(token);
    const at = (iso: string | null) =>
      iso
        ? new Date(iso).toLocaleTimeString("es-EC", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: EVENT.timeZone,
          })
        : "";

    let outcome: Outcome;
    if (result.status === "ok" && !result.alreadyIn) {
      outcome = { id: now, tone: "ok", title: result.name, detail: "Ingreso registrado" };
    } else if (result.status === "ok") {
      outcome = {
        id: now,
        tone: "warn",
        title: result.name,
        detail: `Este ticket ya ingresó a las ${at(result.since)}. Verifica quién lo está mostrando.`,
      };
    } else if (result.status === "not-found") {
      outcome = {
        id: now,
        tone: "bad",
        title: "Ticket desconocido",
        detail: "Ese QR no corresponde a ningún registro.",
      };
    } else {
      outcome = {
        id: now,
        tone: "bad",
        title: "No se pudo registrar",
        detail: "Revisa la conexión e inténtalo otra vez.",
      };
    }

    // Silent when everything is fine; audible only when it is not.
    if (outcome.tone !== "ok" && !mutedRef.current) alertTone();

    setFlash(outcome.tone);
    setTimeout(() => setFlash(null), 1200);

    setOutcomes((current) => [outcome, ...current].slice(0, 6));
    busyRef.current = false;
  }, []);

  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const start = useCallback(async () => {
    setProblem(null);
    setStarting(true);

    if (!window.isSecureContext) {
      setProblem("La cámara solo funciona por HTTPS. Abre el sitio con su dirección https.");
      setStarting(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();
      setScanning(true);

      let lastLook = 0;
      const look = (time: number) => {
        frameRef.current = requestAnimationFrame(look);

        // ~8 reads per second is plenty and keeps older phones cool.
        if (time - lastLook < 120) return;
        lastLook = time;

        const canvas = canvasRef.current;
        if (!canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        const width = 480;
        const height = Math.round((video.videoHeight / video.videoWidth) * width) || 360;
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;

        context.drawImage(video, 0, 0, width, height);
        const found = jsQR(context.getImageData(0, 0, width, height).data, width, height, {
          inversionAttempts: "dontInvert",
        });

        const token = found ? tokenFrom(found.data) : null;
        if (token) void handleToken(token);
      };

      frameRef.current = requestAnimationFrame(look);
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      setProblem(
        name === "NotAllowedError"
          ? "Diste permiso denegado a la cámara. Habilítala en los ajustes del navegador o usa el buscador de abajo."
          : "No pudimos abrir la cámara. Usa el buscador por nombre de abajo.",
      );
    } finally {
      setStarting(false);
    }
  }, [handleToken]);

  // Release the camera when leaving the page: a light left on in a pocket is
  // both a battery drain and a privacy problem.
  useEffect(() => stop, [stop]);

  const tones = {
    ok: "border-abyss/50 bg-abyss/10",
    warn: "border-gold/50 bg-gold/10",
    bad: "border-magenta/50 bg-magenta/10",
  };
  const icons = {
    ok: <Check aria-hidden className="size-5 shrink-0 text-abyss" />,
    warn: <TriangleAlert aria-hidden className="size-5 shrink-0 text-gold" />,
    bad: <CircleAlert aria-hidden className="size-5 shrink-0 text-magenta" />,
  };

  return (
    <div className="space-y-4">
      <div className="card relative overflow-hidden">
        <div className="relative aspect-4/3 bg-black sm:aspect-video">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`size-full object-cover ${scanning ? "" : "opacity-0"}`}
          />

          {/* Aiming frame. It changes colour on each read, so the result is
              visible without looking away from where the QR is being held. */}
          {scanning && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <div
                className={`size-48 rounded-card border-4 shadow-[0_0_0_9999px_rgba(6,10,22,0.55)] transition-colors duration-200 ${
                  flash === "ok"
                    ? "border-abyss"
                    : flash === "warn"
                      ? "border-gold"
                      : flash === "bad"
                        ? "border-magenta"
                        : "border-parchment/40"
                }`}
              />
            </div>
          )}

          {!scanning && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <Camera aria-hidden className="mx-auto size-10 text-mist" />
                <p className="mt-3 text-sm text-mist">
                  La cámara se enciende solo cuando tú lo pidas.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge/60 px-5 py-4">
          <p className="text-sm text-mist">
            {scanning ? "Escaneando… acerca el QR al recuadro" : "Cámara apagada"}
          </p>

          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={muted}
            className="inline-flex items-center gap-2 rounded-full border border-edge px-4 py-2 text-xs text-mist transition-colors hover:text-parchment"
            title="El sonido sólo avisa cuando un ticket ya ingresó o no existe"
          >
            {muted ? (
              <VolumeX aria-hidden className="size-[1.15em]" />
            ) : (
              <Volume2 aria-hidden className="size-[1.15em]" />
            )}
            <span className="leading-none">{muted ? "Sin sonido" : "Avisos con sonido"}</span>
          </button>

          {scanning ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-full border border-edge px-5 py-2.5 text-sm font-semibold text-parchment transition-colors hover:border-magenta/50 hover:text-magenta"
            >
              <CameraOff aria-hidden className="size-[1.15em]" />
              <span className="leading-none">Apagar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={starting}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-midnight transition-transform hover:scale-[1.03] disabled:opacity-60"
            >
              {starting ? (
                <Loader2 aria-hidden className="size-[1.15em] animate-spin" />
              ) : (
                <Camera aria-hidden className="size-[1.15em]" />
              )}
              <span className="leading-none">Encender cámara</span>
            </button>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {problem && (
        <p className="card border-magenta/40 p-4 text-sm text-parchment">{problem}</p>
      )}

      {/* Newest first and deliberately large: the screen is the main channel,
          readable at arm's length while the phone points at the next ticket. */}
      <ul className="space-y-2" aria-live="assertive">
        {outcomes.map((outcome, index) => {
          const latest = index === 0;

          return (
            <li
              key={outcome.id}
              className={`flex items-start gap-3 rounded-card border ${tones[outcome.tone]} ${
                latest ? "p-5" : "p-3 opacity-55"
              }`}
            >
              <span className={latest ? "mt-0.5 scale-125" : ""}>{icons[outcome.tone]}</span>
              <div className="min-w-0">
                <p
                  className={`font-display text-parchment ${latest ? "text-2xl leading-tight" : "text-base"}`}
                >
                  {outcome.title}
                </p>
                <p className={`text-mist ${latest ? "mt-1 text-base" : "text-sm"}`}>
                  {outcome.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
