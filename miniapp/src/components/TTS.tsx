import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { PlayCircle, PauseCircle } from "lucide-react";

interface TTSProps {
  message: {
    text: string;
    translation: string;
    isUser: boolean;
    id: number;
    audio?: string;
  };
  className?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onAudioUrlGenerated?: (url: string) => void;
}

interface AudioCacheItem {
  url: string;
  loading: boolean;
  error: boolean;
}

interface TTSResponse {
  url: string;
  size: number;
  fileName: string;
  verified: boolean;
}

export const globalAudioCache: Record<string, AudioCacheItem> = {};

const TTS: React.FC<TTSProps> = ({
  message,
  className = "",
  onAudioUrlGenerated,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localAudioCache, setLocalAudioCache] = useState<AudioCacheItem | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout>();

  // Update cache key to include message ID to ensure uniqueness
  const cacheKey = `${message.id}-${message.text}-th-female`;

  const handleTimeUpdate = () => {
    if (audioRef.current?.duration) {
      setProgress(
        (audioRef.current.currentTime / audioRef.current.duration) * 100
      );
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    clearInterval(progressInterval.current);
    setProgress(0);
  };

  const cleanup = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener("ended", handleAudioEnded);
      audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
      audioRef.current = null;
    }
    clearInterval(progressInterval.current);
  };

  useEffect(() => {
    if (message.audio) {
      audioRef.current = new Audio(message.audio);
      setupAudioEventListeners();
    } else {
      generateTTS();
    }

    return () => cleanup();
  }, [message.id, message.audio]);

  const setupAudioEventListeners = () => {
    if (!audioRef.current) return;

    audioRef.current.addEventListener("ended", handleAudioEnded);
    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
    audioRef.current.addEventListener("loadedmetadata", () => {
      console.log("Audio loaded and ready to play");
    });
    audioRef.current.addEventListener("error", (e) => {
      console.error("Audio loading error:", e);
    });
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      clearInterval(progressInterval.current);
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
      setIsPlaying(true);
    }
  };

  const generateTTS = useCallback(async () => {
    // Check if this specific message already has audio
    if (message.audio) {
      setLocalAudioCache({ url: message.audio, loading: false, error: false });
      return;
    }

    // Check if we're already generating TTS for this specific message
    if (globalAudioCache[cacheKey]?.loading) {
      return;
    }

    // Check if we already have cached audio for this message
    if (globalAudioCache[cacheKey]?.url) {
      setLocalAudioCache(globalAudioCache[cacheKey]);
      return;
    }

    console.log("Generating TTS for message:", message.id, message.text);

    const loadingState = { url: "", loading: true, error: false };
    globalAudioCache[cacheKey] = loadingState;
    setLocalAudioCache(loadingState);

    try {
      const payload = {
        text: message.text,
        language: "th",
        gender: "female",
      };

      const response = await axios.post<TTSResponse>(
        // "https://yapper-server-chi.vercel.app/api/tts",
        "https://dott-delta.vercel.app/",
        payload
      );

      if (response.data?.url) {
        console.log(
          "TTS URL received for message:",
          message.id,
          response.data.url
        );
        const newCacheItem = {
          url: response.data.url,
          loading: false,
          error: false,
        };
        globalAudioCache[cacheKey] = newCacheItem;
        setLocalAudioCache(newCacheItem);
        onAudioUrlGenerated?.(response.data.url);
        return response.data.url;
      }
    } catch (err) {
      console.error("TTS generation error for message:", message.id, err);
      const errorState = { url: "", loading: false, error: true };
      globalAudioCache[cacheKey] = errorState;
      setLocalAudioCache(errorState);
    }
  }, [message.id, message.text, message.audio, cacheKey, onAudioUrlGenerated]);

  // Generate TTS when component mounts or message changes
  useEffect(() => {
    generateTTS();
  }, [generateTTS, message.id]);

  useEffect(() => {
    if (localAudioCache?.url && !audioRef.current) {
      console.log("Creating new Audio element with URL:", localAudioCache.url);
      const audio = new Audio(localAudioCache.url);

      audio.addEventListener("ended", handleAudioEnded);
      audio.addEventListener("timeupdate", handleTimeUpdate);

      audioRef.current = audio;
    }

    return () => cleanup();
  }, [localAudioCache?.url]);

  return (
    <article
      className={`flex relative gap-2.5 justify-center items-start px-2 py-1.5 max-w-full rounded-xl w-[234px] ${className}`}
    >
      <div className="flex z-0 flex-col my-auto max-w-[310px] w-[220px]">
        {!className.includes("bg-transparent") && (
          <>
            <h2
              className={`text-base font-semibold ${
                message.isUser ? "text-white" : "text-emerald-800"
              }`}
            >
              {message.text}
            </h2>
            <p className="mt-1 text-base font-semibold text-neutral-400">
              {message.translation}
            </p>
          </>
        )}

        <div className="flex gap-2.5 items-center p-2 mt-1 w-full">
          <button
            onClick={handlePlayPause}
            disabled={!localAudioCache?.url}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
              localAudioCache?.url
                ? "hover:bg-black/10 cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            {isPlaying ? (
              <PauseCircle
                className={`h-6 w-6 ${
                  message.isUser ? "text-white" : "text-emerald-800"
                }`}
              />
            ) : (
              <PlayCircle
                className={`h-6 w-6 ${
                  message.isUser ? "text-white" : "text-emerald-800"
                }`}
              />
            )}
          </button>
          <div
            className={`flex-1 h-1.5 ${
              message.isUser ? "bg-black/20" : "bg-emerald-800/20"
            } rounded-full overflow-hidden`}
          >
            <div
              className={`h-full ${
                message.isUser ? "bg-white" : "bg-emerald-800"
              } 
              transition-transform duration-75 ease-linear rounded-full`}
              style={{ transform: `translateX(${progress - 100}%)` }}
            />
          </div>
        </div>
      </div>
      {!className.includes("bg-transparent") && (
        <div
          className={`flex absolute ${
            message.isUser ? "-right-0.5" : "-left-0.5"
          } -bottom-0.5 z-0 shrink-0 self-start w-2.5 h-2.5 ${
            message.isUser ? "bg-emerald-900" : "bg-emerald-100"
          } rounded-full`}
          aria-hidden="true"
        />
      )}
    </article>
  );
};

export default TTS;
