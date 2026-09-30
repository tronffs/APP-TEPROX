export type TTSEngine = 'gemini' | 'browser';
export type AppLanguage = 'es' | 'en';

export interface GeminiVoice {
  id: string;
  name: string;
  gender: {
    es: string;
    en: string;
  };
  tone: {
    es: string;
    en: string;
  };
  bestFor: {
    es: string;
    en: string;
  };
}

export interface GeneratedAudioItem {
  id: string;
  text: string;
  title: string;
  timestamp: string;
  engine: TTSEngine;
  voiceName: string;
  styleName: string;
  language: AppLanguage;
  audioUrl?: string; // Blob or Data URI for playback
  audioBase64?: string;
  durationSec?: number;
}

export interface ScriptPreset {
  id: string;
  category: {
    es: string;
    en: string;
  };
  title: {
    es: string;
    en: string;
  };
  text: {
    es: string;
    en: string;
  };
  recommendedVoice: string;
  recommendedStyle: string;
}
