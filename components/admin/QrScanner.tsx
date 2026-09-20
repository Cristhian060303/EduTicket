"use client";

import {
  Camera,
  CameraOff,
  Check,
  CircleAlert,
  Loader2,
  RotateCcw,
  TriangleAlert,
  Volume2,
  VolumeX,
} from "lucide-react";
import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";
import { checkInAction, undoCheckInAction } from "@/app/admin/actions";
import { EVENT } from "@/lib/site";

/**
 * Door scanner.
 *
 * One person at a time, on purpose: the camera reads a ticket, switches off
 * and shows the result on its own. Turning the camera back on for the next
 * student clears it. That extra tap buys a moment where the organiser and the
 * person in front of them see the same confirmation — better at a door than a
 * list of results scrolling past.
 *
 * Decoding happens entirely in the browser (jsQR over canvas frames), so no
 * image ever leaves the phone.
 */

type Tone = "ok" | "warn" | "bad";

type Result = {
  tone: Tone;
  title: string;
  detail: string;
  /** Present only when the check-in can still be undone */
  token?: string;
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
 * going on, and a beep per student would be thirty beeps of pure noise.
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

const TONES: Record<Tone, { box: string; icon: React.ReactNode }> = {
  ok: {
    box: "border-abyss/50 bg-abyss/10",
    icon: <Check aria-hidden className="size-7 shrink-0 text-abyss" />,
  },
  warn: {
    box: "border-gold/50 bg-gold/10",
    icon: <TriangleAlert aria-hidden className="size-7 shrink-0 text-gold" />,
  },
  bad: {
    box: "border-magenta/50 bg-magenta/10",
    icon: <CircleAlert aria-hidden className="size-7 shrink-0 text-magenta" />,
  },
};

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const mutedRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [muted, setMuted] = useState(false);

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

  const stopCamera = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const handleToken = useCallback(
    async (token: string) => {
      if (busyRef.current) return;
      busyRef.current = true;

      // Switch the camera off first: the reading is done and the result is
      // what matters now.
      stopCamera();

      const outcome = await checkInAction(token);
      const at = (iso: string | null) =>
        iso
          ? new Date(iso).toLocaleTimeString("es-EC", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: EVENT.timeZone,
            })
          : "";

      let next: Result;
      if (outcome.status === "ok" && !outcome.alreadyIn) {
        next = { tone: "ok", title: outcome.name, detail: "Ingreso registrado", token };
      } else if (outcome.status === "ok") {
        next = {
          tone: "warn",
          title: outcome.name,
          detail: `Este ticket ya había ingresado a las ${at(outcome.since)}. Verifica quién lo está mostrando.`,
        };
      } else if (outcome.status === "not-found") {
        next = {
          tone: "bad",
          title: "Ticket desconocido",
          detail: "Ese QR no corresponde a ningún registro.",
        };
      } else {
        next = {
          tone: "bad",
          title: "No se pudo registrar",
          detail: "Revisa la conexión e inténtalo otra vez.",
        };
      }

      if (next.tone !== "ok" && !mutedRef.current) alertTone();

      setResult(next);
      busyRef.current = false;
    },
    [stopCamera],
  );

  const startCamera = useCallback(async () => {
    setProblem(null);
    setResult(null); // turning the camera back on clears the previous result
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

  const undo = async () => {
    if (!result?.token) return;
    setUndoing(true);
    await undoCheckInAction(result.token);
    setUndoing(false);
    setResult({
      tone: "bad",
      title: result.title,
      detail: "Ingreso deshecho. Esta persona vuelve a figurar como no ingresada.",
    });
  };

  // Release the camera when leaving the page: a light left on in a pocket is
  // both a battery drain and a privacy problem.
  useEffect(() => stopCamera, [stopCamera]);

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        {/* Viewfinder */}
        <div className="relative aspect-4/3 bg-black sm:aspect-video">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`size-full object-cover ${scanning ? "" : "invisible"}`}
          />

          {scanning ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <div className="size-48 rounded-card border-4 border-parchment/50 shadow-[0_0_0_9999px_rgba(6,10,22,0.55)]" />
            </div>
          ) : (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <Camera aria-hidden className="mx-auto size-10 text-mist/70" />
                <p className="mt-3 text-sm text-mist">
                  {result ? "Listo para el siguiente" : "La cámara está apagada"}
                </p>
              </div>
            </div>
          )}

          {/* Mute lives in the corner: it is set once, not per student */}
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={muted}
            title={
              muted
                ? "Activar el aviso sonoro de tickets repetidos"
                : "Silenciar el aviso sonoro"
            }
            className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-midnight/70 text-mist backdrop-blur transition-colors hover:text-parchment"
          >
            {muted ? (
              <VolumeX aria-hidden className="size-5" />
            ) : (
              <Volume2 aria-hidden className="size-5" />
            )}
            <span className="sr-only">{muted ? "Sonido desactivado" : "Sonido activado"}</span>
          </button>
        </div>

        {/* One full-width action: nothing to aim at with a queue in front */}
        <div className="border-t border-edge/60 p-4">
          {scanning ? (
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-edge px-6 py-3.5 font-semibold text-parchment transition-colors hover:border-magenta/50 hover:text-magenta"
            >
              <CameraOff aria-hidden className="size-[1.25em]" />
              <span className="leading-none">Apagar cámara</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              disabled={starting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 font-semibold text-midnight transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {starting ? (
                <Loader2 aria-hidden className="size-[1.25em] animate-spin" />
              ) : (
                <Camera aria-hidden className="size-[1.25em]" />
              )}
              <span className="leading-none">
                {result ? "Escanear el siguiente" : "Encender cámara"}
              </span>
            </button>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {problem && (
        <p className="card border-magenta/40 p-4 text-sm text-parchment">{problem}</p>
      )}

      {result && (
        <div
          className={`flex items-start gap-4 rounded-card border p-5 ${TONES[result.tone].box}`}
          aria-live="assertive"
        >
          {TONES[result.tone].icon}
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl leading-tight text-parchment">
              {result.title}
            </p>
            <p className="mt-1 text-base text-mist">{result.detail}</p>

            {result.token && (
              <button
                type="button"
                onClick={undo}
                disabled={undoing}
                className="mt-3 inline-flex items-center gap-2 text-sm text-mist underline underline-offset-4 transition-colors hover:text-parchment disabled:opacity-60"
              >
                {undoing ? (
                  <Loader2 aria-hidden className="size-[1.15em] animate-spin" />
                ) : (
                  <RotateCcw aria-hidden className="size-[1.15em]" />
                )}
                <span>Deshacer, me equivoqué de persona</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
