"use client";

/**
 * Small animated audio-spectrum visualization shown inside the textarea
 * while the user is dictating. Pure CSS — no actual audio analysis — but
 * the staggered bar animations read as a real-time waveform (matches what
 * ChatGPT shows in its input bar during voice dictation).
 *
 * Rendered as 5 vertical bars at different scales and animation delays.
 */
export function VoiceSpectrum({
  className,
}: Readonly<{ className?: string }>) {
  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none flex h-full items-center gap-1",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <style>{`
        @keyframes neosia-spectrum-bar {
          0%, 100% { transform: scaleY(0.35); opacity: 0.65; }
          50%      { transform: scaleY(1);    opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes neosia-spectrum-bar {
            0%, 100% { transform: scaleY(0.55); opacity: 0.85; }
          }
        }
        .neosia-spectrum-bar {
          transform-origin: center;
          animation: neosia-spectrum-bar 1100ms ease-in-out infinite;
          will-change: transform, opacity;
        }
      `}</style>
      <span
        className="neosia-spectrum-bar bg-primary block h-3 w-[3px] rounded-full"
        style={{ animationDelay: "0ms", animationDuration: "900ms" }}
      />
      <span
        className="neosia-spectrum-bar bg-primary block h-4 w-[3px] rounded-full"
        style={{ animationDelay: "120ms", animationDuration: "1100ms" }}
      />
      <span
        className="neosia-spectrum-bar bg-primary block h-5 w-[3px] rounded-full"
        style={{ animationDelay: "240ms", animationDuration: "850ms" }}
      />
      <span
        className="neosia-spectrum-bar bg-primary block h-4 w-[3px] rounded-full"
        style={{ animationDelay: "360ms", animationDuration: "1200ms" }}
      />
      <span
        className="neosia-spectrum-bar bg-primary block h-3 w-[3px] rounded-full"
        style={{ animationDelay: "480ms", animationDuration: "950ms" }}
      />
    </div>
  );
}
