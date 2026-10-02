import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause, Loader2 } from 'lucide-react';

interface Props {
  briefingText: string;
  storyTitle: string;
}

export const AudioPlayer: React.FC<Props> = ({ briefingText, storyTitle }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop any ongoing playback (AudioContext, HTMLAudio, or SpeechSynthesis)
  const stopAllPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // ignore already stopped
      }
      sourceNodeRef.current = null;
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    setIsPlaying(false);
  };

  const playViaSpeechSynthesis = (textToRead: string) => {
    if (!('speechSynthesis' in window)) {
      setStatusMessage('Voice playback not supported in this browser');
      setIsPlaying(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utter = new SpeechSynthesisUtterance(textToRead);
      utter.rate = 1.02;
      utter.pitch = 1.0;

      // Select a natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Alex'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utter.voice = preferredVoice;
      }

      utter.onstart = () => {
        setIsPlaying(true);
        setStatusMessage('Playing voice briefing...');
      };

      utter.onend = () => {
        setIsPlaying(false);
        setStatusMessage(null);
      };

      utter.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsPlaying(false);
        setStatusMessage(null);
      };

      window.speechSynthesis.speak(utter);
      setIsPlaying(true);
    } catch (err) {
      console.warn('SpeechSynthesis invocation failed:', err);
      setIsPlaying(false);
      setStatusMessage(null);
    }
  };

  const handleToggle = async () => {
    // If currently playing, stop
    if (isPlaying) {
      stopAllPlayback();
      return;
    }

    // 1. UNLOCK AudioContext synchronously within user click event
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      }
    } catch (e) {
      console.warn('AudioContext initialization warning:', e);
    }

    // If we already have the decoded audio buffer cached, play it immediately!
    if (audioBufferRef.current && audioContextRef.current) {
      try {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setIsPlaying(false);
          setStatusMessage(null);
        };
        sourceNodeRef.current = source;
        source.start(0);
        setIsPlaying(true);
        setStatusMessage('Playing 45s briefing...');
        return;
      } catch (err) {
        console.warn('Playing cached buffer failed, re-fetching:', err);
      }
    }

    setLoading(true);
    setStatusMessage('Generating voice briefing...');

    const promptText = `Here is your SerpNews 45-second flash briefing on ${storyTitle}. ${briefingText.slice(0, 320)}`;

    try {
      const res = await fetch('/api/audio-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: promptText }),
      });

      if (!res.ok) {
        throw new Error(`Audio API responded with ${res.status}`);
      }

      const data = await res.json();
      if (!data?.audioBase64) {
        throw new Error('No audio base64 payload returned');
      }

      // Convert base64 to ArrayBuffer
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Decode with AudioContext
      if (audioContextRef.current) {
        const decodedBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer.slice(0));
        audioBufferRef.current = decodedBuffer;

        const source = audioContextRef.current.createBufferSource();
        source.buffer = decodedBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setIsPlaying(false);
          setStatusMessage(null);
        };
        sourceNodeRef.current = source;
        source.start(0);
        setIsPlaying(true);
        setStatusMessage('Playing 45s briefing...');
        setLoading(false);
        return;
      }

      // Fallback: HTMLAudioElement with Blob URL
      const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
        setIsPlaying(true);
        setStatusMessage('Playing 45s briefing...');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('TTS server call failed or unavailable, using Web Speech fallback:', err);
      // Seamless browser speech synthesis fallback
      playViaSpeechSynthesis(`SerpNews 45-second flash briefing: ${storyTitle}. ${briefingText.slice(0, 320)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopAllPlayback();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-3 bg-[#ede3d4] border border-[#dfd0be] rounded-xl px-3 py-2 text-xs text-[#4a342a] shadow-xs">
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          setStatusMessage(null);
        }}
        onError={() => {
          setIsPlaying(false);
          setStatusMessage(null);
        }}
        className="hidden"
      />

      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#881326] hover:bg-[#6b0f1a] text-white transition disabled:opacity-60 cursor-pointer shadow-sm shrink-0"
        title={isPlaying ? 'Pause briefing' : 'Listen to 45s audio briefing'}
        aria-label={isPlaying ? 'Pause briefing' : 'Play 45s audio briefing'}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 font-bold text-[#2d1b15]">
          <Volume2 className="w-3.5 h-3.5 text-[#881326] shrink-0" />
          <span className="truncate">45-Sec Flash Briefing</span>
          {isPlaying && (
            <span className="flex items-center gap-0.5 ml-1 shrink-0">
              <span className="w-1 h-3 bg-[#881326] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-4 bg-[#881326] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-2 bg-[#881326] rounded-full animate-bounce"></span>
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#715c50] truncate">
          {statusMessage || (isPlaying ? 'Tap to pause audio' : 'Spoken narrative dispatch')}
        </span>
      </div>
    </div>
  );
};
