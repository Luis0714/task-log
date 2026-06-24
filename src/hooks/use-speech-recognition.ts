"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { appToast } from "@/lib/toast/app-toast";

// Minimal browser types — kept local so the hook doesn't depend on lib.dom
// globals and stays safe to import from client components.
type AnyRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};

type AnyRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<AnyRecognitionResult>;
};

type AnyRecognitionErrorEvent = {
  error: string;
  message?: string;
};

type AnyRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: AnyRecognitionEvent) => void) | null;
  onerror: ((e: AnyRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

const DEFAULT_LANG = "es-ES";

function getCtor(): (new () => AnyRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => AnyRecognition;
    webkitSpeechRecognition?: new () => AnyRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type UseSpeechRecognitionOptions = {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onFinalTranscript?: (text: string) => void;
  /**
   * Called once every time the browser's speech session ends — whether the
   * user stopped it manually, an error closed it, or it timed out. Use this
   * to trigger downstream actions (e.g. auto-send the transcript when the
   * user has that preference enabled).
   */
  onEnd?: () => void;
};

export type UseSpeechRecognitionResult = {
  isSupported: boolean;
  isListening: boolean;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
};

export function useSpeechRecognition(
  opts: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionResult {
  const {
    lang = DEFAULT_LANG,
    continuous = true,
    interimResults = true,
    onFinalTranscript,
    onEnd,
  } = opts;

  // SSR-safe: start as false (server + first client render agree) and flip to
  // true on mount if the browser exposes the SpeechRecognition constructor.
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(getCtor() !== null);
  }, []);

  const recRef = useRef<AnyRecognition | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  const onEndRef = useRef(onEnd);

  // Keep the callback refs current without rebuilding the recognition
  // instance when the consumer's callback identity changes.
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const lastErrorRef = useRef<string | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupported) return;
    const w = globalThis as unknown as {
      SpeechRecognition?: new () => AnyRecognition;
      webkitSpeechRecognition?: new () => AnyRecognition;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();

    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = interimResults;

    rec.onstart = () => {
      lastErrorRef.current = null;
      setError(null);
      setIsListening(true);
    };

    rec.onresult = (e: AnyRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0].transcript;
        if (r.isFinal) {
          const cleaned = t.trim();
          if (cleaned) onFinalRef.current?.(cleaned);
        } else {
          interim += t;
        }
      }
      setInterim(interim);
    };

    rec.onerror = (e: AnyRecognitionErrorEvent) => {
      lastErrorRef.current = e.error;
      setError(e.error);
      switch (e.error) {
        case "not-allowed":
        case "service-not-allowed":
          appToast.error("Permite el acceso al micrófono para usar el dictado por voz.");
          setIsListening(false);
          break;
        case "network":
          appToast.error("Sin conexión para reconocimiento de voz.");
          setIsListening(false);
          break;
        case "no-speech":
        case "aborted":
          // Silent: no-speech is a common false positive (auto-restarted in onend);
          // aborted is triggered by our own stop().
          break;
        default:
          // Surface unknown errors but keep the session alive when possible.
          break;
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setInterim("");
      // Auto-restart on no-speech so the user can keep dictating.
      if (recRef.current === rec && lastErrorRef.current === "no-speech") {
        lastErrorRef.current = null;
        try {
          rec.start();
        } catch {
          // Already started or not allowed — ignore.
        }
        // Don't fire onEnd for the auto-restart — the session is continuing.
        return;
      }
      onEndRef.current?.();
    };

    recRef.current = rec;
    return () => {
      rec.abort();
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onstart = null;
      if (recRef.current === rec) {
        recRef.current = null;
      }
    };
  }, [isSupported, lang, continuous, interimResults]);

  const start = useCallback(() => {
    const rec = recRef.current;
    if (!rec || isListening) return;
    setError(null);
    try {
      rec.start();
    } catch {
      // Already started — ignore.
    }
  }, [isListening]);

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // Not started — ignore.
    }
  }, []);

  // Safety: tear down on unmount even if the main effect's cleanup was skipped.
  useEffect(() => {
    return () => {
      recRef.current?.abort();
      recRef.current = null;
    };
  }, []);

  return { isSupported, isListening, interimTranscript, error, start, stop };
}
