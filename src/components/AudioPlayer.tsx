import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Check,
  Copy
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { AppLanguage } from '../types/tts';
import { TRANSLATIONS } from '../utils/i18n';

interface AudioPlayerProps {
  audioUrl: string | null;
  title: string;
  voiceName: string;
  styleName: string;
  language?: AppLanguage;
  onDownload?: () => void;
  onShareAudio?: () => void;
  onCopyAudio?: () => void;
  // Fallback for browser speech synthesis playback
  isBrowserSpeech?: boolean;
  onPlayBrowserSpeech?: () => void;
  onPauseBrowserSpeech?: () => void;
  onStopBrowserSpeech?: () => void;
  isBrowserSpeaking?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  title,
  voiceName,
  styleName,
  language = 'es',
  onDownload,
  onShareAudio,
  onCopyAudio,
  isBrowserSpeech = false,
  onPlayBrowserSpeech,
  onPauseBrowserSpeech,
  onStopBrowserSpeech,
  isBrowserSpeaking = false,
}) => {
  const t = TRANSLATIONS[language];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Sync with browser speech state if running via SpeechSynthesis
  useEffect(() => {
    if (isBrowserSpeech) {
      setIsPlaying(isBrowserSpeaking);
    }
  }, [isBrowserSpeech, isBrowserSpeaking]);

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Auto-play when new audioUrl arrives
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (isBrowserSpeech) {
      if (isPlaying) {
        onPauseBrowserSpeech?.();
        setIsPlaying(false);
      } else {
        onPlayBrowserSpeech?.();
        setIsPlaying(true);
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Play error:', err));
    }
  };

  const handleRestart = () => {
    if (isBrowserSpeech) {
      onStopBrowserSpeech?.();
      onPlayBrowserSpeech?.();
      setIsPlaying(true);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
    setIsPlaying(true);
  };

  const handleSeek = (newProgress: number) => {
    if (isBrowserSpeech) return;
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = newProgress * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRateChange = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl space-y-4">
      {/* Hidden audio element for real audio streaming */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <span>{t.voiceLabel} {voiceName}</span>
            <span aria-hidden="true">·</span>
            <span>{t.styleLabel} {styleName}</span>
          </div>
          <h3 className="text-base font-bold text-white truncate max-w-md">
            {title || t.generatedAudio}
          </h3>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {audioUrl && (
            <>
              {onCopyAudio && (
                <button
                  onClick={onCopyAudio}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors shadow-sm"
                  title={t.btnCopyAudio}
                >
                  <Copy className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{t.btnCopyAudio}</span>
                </button>
              )}
              {onShareAudio && (
                <button
                  onClick={onShareAudio}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors shadow-sm"
                  title={t.btnShareAudio}
                >
                  <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{t.btnShareAudio}</span>
                </button>
              )}
              <button
                onClick={onDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm"
                title={`${t.downloadWav}`}
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t.downloadWav}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Waveform Visualizer */}
      <AudioWaveform
        isPlaying={isPlaying}
        progress={progress}
        onSeek={handleSeek}
      />

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRestart}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Reiniciar reproducción"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={togglePlay}
            className="h-12 w-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Time digits */}
          <div className="text-xs font-mono text-slate-400">
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
            <span className="mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed & Volume */}
        <div className="flex items-center gap-4">
          {/* Rate Button */}
          <button
            onClick={handleRateChange}
            className="px-2.5 py-1 text-xs font-mono font-bold text-slate-300 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-colors"
            title="Cambiar velocidad"
          >
            {playbackRate}x
          </button>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-white"
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
