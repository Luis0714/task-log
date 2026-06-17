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
  } = opts;

  const Ctor = getCtor();
  const isSupported = Ctor !== null;

  const recRef = useRef<AnyRecognition | null>(null);
  const onFinalRef = useRef(onFinalTranscript);

  // Keep the callback ref current without rebuilding the recognition instance
  // when the consumer's callback identity changes.
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const lastErrorRef = useRef<string | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    rec.onresult = (e) => {
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

    rec.onerror = (e) => {
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
      }
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
  }, [Ctor, lang, continuous, interimResults]);

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
