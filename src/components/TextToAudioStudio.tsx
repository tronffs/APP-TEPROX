import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Mic,
  Sparkles,
  Play,
  RotateCcw,
  Download,
  Wand2,
  Trash2,
  Volume2,
  Clock,
  FileText,
  AlertCircle,
  Languages,
  CheckCircle2,
  Check,
  X,
  Upload,
  Layers,
  Square,
  ShieldCheck,
  Copy,
  ClipboardPaste,
  Share2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BookOpen,
  Sparkle
} from 'lucide-react';
import { GEMINI_VOICES, VOICE_STYLES, SAMPLE_SCRIPTS } from '../utils/textSamples';
import { TTSEngine, AppLanguage, GeneratedAudioItem } from '../types/tts';
import { TRANSLATIONS } from '../utils/i18n';
import { splitTextIntoChunks, TextChunk, fastWordCount, generateMassiveSampleText } from '../utils/textChunker';
import { stitchWavBlobs } from '../utils/wavStitcher';
import {
  copyTextToClipboard,
  readTextFromClipboard,
  copyAudioDataUri,
  shareAudioFile,
  shareTextContent
} from '../utils/shareHelper';
import { AudioPlayer } from './AudioPlayer';
import { ShareModal } from './ShareModal';

interface TextToAudioStudioProps {
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
}

export const TextToAudioStudio: React.FC<TextToAudioStudioProps> = ({
  language,
  onLanguageChange,
}) => {
  const t = TRANSLATIONS[language];

  // Input text
  const [text, setText] = useState<string>(SAMPLE_SCRIPTS[0].text[language]);
  const [engine, setEngine] = useState<TTSEngine>('gemini');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [selectedStyle, setSelectedStyle] = useState<string>('podcast');
  const [customStylePrompt, setCustomStylePrompt] = useState<string>('');

  // Target audio language states
  const [audioTargetLanguage, setAudioTargetLanguage] = useState<AppLanguage>(language);
  const [autoTranslateIfDifferent, setAutoTranslateIfDifferent] = useState<boolean>(true);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [alwaysAskBeforeGenerate, setAlwaysAskBeforeGenerate] = useState<boolean>(true);

  // Generation status & Long-form Batch progress
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasCopiedText, setHasCopiedText] = useState<boolean>(false);

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Long-Form Batch Progress (for Gemini)
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    percent: number;
    statusText: string;
  } | null>(null);

  // Cancellation ref for batch processing
  const abortBatchRef = useRef<boolean>(false);

  // Active audio
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentAudioTitle, setCurrentAudioTitle] = useState<string>('');

  // History
  const [history, setHistory] = useState<GeneratedAudioItem[]>([]);

  // Browser Web Speech API state
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<string>('');
  const [browserRate, setBrowserRate] = useState<number>(1);
  const [browserPitch, setBrowserPitch] = useState<number>(1);
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState<boolean>(false);
  const [browserActiveChunkIndex, setBrowserActiveChunkIndex] = useState<number>(0);
  const [isBrowserPaused, setIsBrowserPaused] = useState<boolean>(false);

  // File input ref & textarea ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Calculate word count fast (O(N) with 0 allocations for 1,000,000 words)
  const wordCount = useMemo(() => fastWordCount(text), [text]);
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 140) * 60));

  // Chunk calculation: efficient splitting for unlimited lengths
  const chunks = useMemo(() => {
    return splitTextIntoChunks(text, 180);
  }, [text]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // Sync target language when app language changes
  useEffect(() => {
    setAudioTargetLanguage(language);
  }, [language]);

  // Update sample text when language changes IF current text matches a sample
  useEffect(() => {
    const matchingSample = SAMPLE_SCRIPTS.find(
      (s) => s.text.es === text || s.text.en === text
    );
    if (matchingSample) {
      setText(matchingSample.text[language]);
    }
  }, [language]);

  // Load browser voices & filter by target audio language
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setBrowserVoices(available);

        const langPrefix = audioTargetLanguage === 'es' ? 'es' : 'en';
        const matching = available.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
        if (matching) {
          setSelectedBrowserVoice(matching.name);
        } else if (available.length > 0) {
          setSelectedBrowserVoice(available[0].name);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [audioTargetLanguage]);

  // Chrome/Safari speech synthesis keep-alive heartbeat for reading unlimited words
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBrowserSpeaking && !isBrowserPaused && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      interval = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 7000);
    }
    return () => clearInterval(interval);
  }, [isBrowserSpeaking, isBrowserPaused]);

  const relevantBrowserVoices = useMemo(() => {
    const langPrefix = audioTargetLanguage === 'es' ? 'es' : 'en';
    const primary = browserVoices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
    const secondary = browserVoices.filter((v) => !v.lang.toLowerCase().startsWith(langPrefix));
    return [...primary, ...secondary];
  }, [browserVoices, audioTargetLanguage]);

  // Copy text to clipboard without limits
  const handleCopyText = async () => {
    if (!text.trim()) return;
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setHasCopiedText(true);
      showToast(t.textCopiedNotification);
      setTimeout(() => setHasCopiedText(false), 2000);
    }
  };

  // Paste text from clipboard without limits
  const handlePasteText = async () => {
    try {
      const clipboardText = await readTextFromClipboard();
      if (clipboardText) {
        setText((prev) => (prev && prev.trim() ? `${prev}\n\n${clipboardText}` : clipboardText));
        const words = fastWordCount(clipboardText);
        showToast(
          language === 'es'
            ? `¡Texto pegado sin límites! (${words.toLocaleString()} palabras)`
            : `Text pasted without limits! (${words.toLocaleString()} words)`
        );
      } else {
        // Fallback: focus textarea for user gesture
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
        showToast(t.clipboardReadError);
      }
    } catch {
      showToast(t.clipboardReadError);
    }
  };

  // Drag and drop text/markdown files onto the textarea
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setText(content);
        const count = fastWordCount(content);
        showToast(
          language === 'es'
            ? `¡Documento cargado: ${file.name} (${count.toLocaleString()} palabras)!`
            : `Document loaded: ${file.name} (${count.toLocaleString()} words)!`
        );
      }
    };
    reader.readAsText(file);
  };

  // Copy active audio data URI
  const handleCopyAudio = async () => {
    if (!currentAudioUrl) return;
    const ok = await copyAudioDataUri(currentAudioUrl);
    if (ok) {
      showToast(t.audioCopiedNotification);
    }
  };

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const found = SAMPLE_SCRIPTS.find((s) => s.id === templateId);
    if (found) {
      setText(found.text[language]);
      setSelectedVoice(found.recommendedVoice);
      setSelectedStyle(found.recommendedStyle);
    }
  };

  // Load High-Capacity Test Text (e.g. 1,000, 10,000 or 1,000,000 words simulation)
  const handleLoadTestWords = (targetCount: number) => {
    const generated = generateMassiveSampleText(targetCount, language);
    setText(generated);
    const count = fastWordCount(generated);
    showToast(
      language === 'es'
        ? `¡Cargado texto de prueba con ${count.toLocaleString()} palabras!`
        : `Loaded test script with ${count.toLocaleString()} words!`
    );
  };

  // Handle uploading file (.txt, .md, .text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setText(content);
        const count = fastWordCount(content);
        showToast(
          language === 'es'
            ? `¡Archivo cargado: ${file.name} (${count.toLocaleString()} palabras)!`
            : `File loaded: ${file.name} (${count.toLocaleString()} words)!`
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Pre-generation check: initiates the "ask language" modal
  const handleInitiateGenerate = () => {
    if (!text.trim()) return;

    if (alwaysAskBeforeGenerate) {
      setIsConfirmModalOpen(true);
    } else {
      executeGenerateAudio(audioTargetLanguage);
    }
  };

  // Stop batch generation or reading
  const handleStopBatch = () => {
    abortBatchRef.current = true;
    setIsGenerating(false);
    setBatchProgress(null);
    if (engine === 'browser') {
      handleStopBrowserSpeech();
    }
  };

  // Perform actual audio generation / reading
  const executeGenerateAudio = async (targetLang: AppLanguage) => {
    setIsConfirmModalOpen(false);
    setGenerationError(null);
    abortBatchRef.current = false;

    let textToSpeak = text.trim();

    // Auto-translate if text appears to be in the other language and option is checked
    if (autoTranslateIfDifferent && targetLang !== language) {
      try {
        setBatchProgress({
          current: 0,
          total: chunks.length,
          percent: 5,
          statusText: language === 'es' ? 'Traduciendo texto al idioma del audio...' : 'Translating text to audio language...',
        });

        const transRes = await fetch('/api/tts/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToSpeak, targetLang }),
        });
        const transData = await transRes.json();
        if (transData.translatedText) {
          textToSpeak = transData.translatedText;
          setText(textToSpeak);
        }
      } catch (e) {
        console.warn('Auto translation before TTS skipped due to error:', e);
      }
    }

    const activeChunks = splitTextIntoChunks(textToSpeak, 380);

    // Browser Speech Synthesis Queue (unlimited, zero-lag, no API quotas)
    if (engine === 'browser') {
      setIsGenerating(false);
      startBrowserContinuousSpeech(activeChunks, targetLang, 0);
      return;
    }

    // Gemini Neural TTS
    setIsGenerating(true);
    const styleObj = VOICE_STYLES.find((s) => s.id === selectedStyle);
    const stylePrompt =
      customStylePrompt.trim() ||
      styleObj?.prompt[targetLang] ||
      (targetLang === 'en' ? 'Natural and fluent English' : 'Natural y fluida en español');

    const audioBlobs: Blob[] = [];

    try {
      for (let i = 0; i < activeChunks.length; i++) {
        if (abortBatchRef.current) {
          break;
        }

        const chunk = activeChunks[i];
        const percent = Math.round(((i + 1) / activeChunks.length) * 100);

        setBatchProgress({
          current: i + 1,
          total: activeChunks.length,
          percent,
          statusText:
            language === 'es'
              ? `Procesando fragmento ${i + 1} de ${activeChunks.length} (${chunk.wordCount} palabras)...`
              : `Processing chunk ${i + 1} of ${activeChunks.length} (${chunk.wordCount} words)...`,
        });

        // Delay between chunks to prevent rate-limit 429 errors on long batches
        if (i > 0) {
          await new Promise((r) => setTimeout(r, 400));
        }

        const response = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chunk.text,
            voiceName: selectedVoice,
            style: stylePrompt,
            language: targetLang,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.audioBase64) {
          // If server reports quota or error, gracefully auto-fallback to browser speech synthesis
          console.warn('AI Voice endpoint returned error, switching to browser speech synthesis:', data.error);
          setEngine('browser');
          setGenerationError(null);
          showToast(
            targetLang === 'en'
              ? 'AI voice limit reached. Switched to Browser Voice for unlimited speech.'
              : 'Cuota de IA completada. Activando la Voz del Navegador sin límites...'
          );
          startBrowserContinuousSpeech(activeChunks, targetLang, i);
          return;
        }

        const binaryString = atob(data.audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        const chunkBlob = new Blob([bytes], { type: 'audio/wav' });
        audioBlobs.push(chunkBlob);

        // Immediate preview after first chunk
        if (i === 0 && activeChunks.length > 1) {
          const firstChunkUrl = URL.createObjectURL(chunkBlob);
          setCurrentAudioUrl(firstChunkUrl);
          setCurrentAudioTitle(
            (targetLang === 'es' ? 'Reproduciendo fragmento 1...' : 'Playing chunk 1...') +
              ` (${chunk.wordCount} palabras)`
          );
        }
      }

      if (abortBatchRef.current) {
        setBatchProgress(null);
        return;
      }

      // Stitch all WAV blobs into single master continuous file
      setBatchProgress({
        current: activeChunks.length,
        total: activeChunks.length,
        percent: 100,
        statusText: t.stitchingAudio,
      });

      const masterBlob = await stitchWavBlobs(audioBlobs);
      const masterBlobUrl = URL.createObjectURL(masterBlob);

      setCurrentAudioUrl(masterBlobUrl);
      const title = textToSpeak.slice(0, 45) + (textToSpeak.length > 45 ? '...' : '');
      setCurrentAudioTitle(`${title} (${wordCount.toLocaleString()} palabras · Completo)`);

      const newHistoryItem: GeneratedAudioItem = {
        id: `tts-${Date.now()}`,
        text: textToSpeak,
        title: `${title} [${wordCount.toLocaleString()} palabras]`,
        timestamp: new Date().toLocaleTimeString(),
        engine: 'gemini',
        voiceName: selectedVoice,
        styleName: styleObj?.name[targetLang] || 'Custom',
        language: targetLang,
        audioUrl: masterBlobUrl,
        durationSec: estimatedSeconds,
      };

      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 24)]);
    } catch (err: any) {
      console.warn('AI Speech fallback triggered on error:', err);
      // Seamless auto-recovery: switch to browser speech synthesis so the user always hears their text!
      setEngine('browser');
      setGenerationError(null);
      showToast(
        targetLang === 'en'
          ? 'Switched to Browser Voice for instant playback.'
          : 'Reproduciendo con el motor de Voz del Navegador...'
      );
      startBrowserContinuousSpeech(activeChunks, targetLang, 0);
    } finally {
      setIsGenerating(false);
      setBatchProgress(null);
    }
  };

  // Browser Continuous Speech Engine: reads unlimited words, books & chapters without crash
  const startBrowserContinuousSpeech = (
    activeChunks: TextChunk[],
    targetLang: AppLanguage,
    startIndex: number = 0
  ) => {
    if (!('speechSynthesis' in window)) {
      alert(
        language === 'en'
          ? 'Your browser does not support Speech Synthesis.'
          : 'Tu navegador no soporta síntesis de voz nativa.'
      );
      return;
    }

    window.speechSynthesis.cancel();
    setBrowserActiveChunkIndex(startIndex);
    setIsBrowserSpeaking(true);
    setIsBrowserPaused(false);

    const voice = browserVoices.find((v) => v.name === selectedBrowserVoice);

    const speakChunk = (index: number) => {
      if (index >= activeChunks.length || abortBatchRef.current) {
        setIsBrowserSpeaking(false);
        setIsBrowserPaused(false);
        setBrowserActiveChunkIndex(0);
        return;
      }

      setBrowserActiveChunkIndex(index);
      setCurrentAudioTitle(
        `[Parte ${index + 1}/${activeChunks.length}] ${activeChunks[index].text.slice(0, 50)}...`
      );

      const utterance = new SpeechSynthesisUtterance(activeChunks[index].text);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = targetLang === 'es' ? 'es-ES' : 'en-US';
      }
      utterance.rate = browserRate;
      utterance.pitch = browserPitch;

      utterance.onend = () => {
        if (!abortBatchRef.current) {
          speakChunk(index + 1);
        }
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error on chunk, skipping to next:', e);
        if (!abortBatchRef.current) {
          speakChunk(index + 1);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakChunk(startIndex);
  };

  const handlePauseBrowserSpeech = () => {
    if (window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsBrowserPaused(false);
        setIsBrowserSpeaking(true);
      } else {
        window.speechSynthesis.pause();
        setIsBrowserPaused(true);
      }
    }
  };

  const handleStopBrowserSpeech = () => {
    abortBatchRef.current = true;
    window.speechSynthesis.cancel();
    setIsBrowserSpeaking(false);
    setIsBrowserPaused(false);
    setBrowserActiveChunkIndex(0);
  };

  const handleJumpToChunk = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= chunks.length) return;
    setBrowserActiveChunkIndex(targetIndex);
    if (isBrowserSpeaking) {
      window.speechSynthesis.cancel();
      startBrowserContinuousSpeech(chunks, audioTargetLanguage, targetIndex);
    }
  };

  // Enhance text using Gemini
  const handleEnhanceText = async (mode: 'natural' | 'dramatic' | 'professional') => {
    if (!text.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/tts/enhance-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode }),
      });

      const data = await response.json();
      if (data.enhancedText) {
        setText(data.enhancedText);
        showToast(language === 'es' ? '¡Ritmo y pausas optimizadas!' : 'Rhythm & pauses optimized!');
      }
    } catch (err) {
      console.error('Error enhancing text:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Translate between Spanish and English
  const handleTranslateText = async () => {
    if (!text.trim() || isTranslating) return;

    const targetLang = language === 'es' ? 'en' : 'es';
    setIsTranslating(true);

    try {
      const response = await fetch('/api/tts/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      });

      const data = await response.json();
      if (data.translatedText) {
        setText(data.translatedText);
        onLanguageChange(targetLang);
        setAudioTargetLanguage(targetLang);
        showToast(targetLang === 'en' ? 'Translated to English!' : '¡Traducido al español!');
      }
    } catch (err) {
      console.error('Error translating:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Download active WAV file
  const handleDownloadWav = (item?: GeneratedAudioItem) => {
    const url = item?.audioUrl || currentAudioUrl;
    if (!url) return;

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `VozAudio_${item?.voiceName || selectedVoice}_${Date.now()}.wav`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".txt,.md,.text"
        className="hidden"
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-xs shadow-2xl shadow-indigo-950/80 border border-indigo-400/40 animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        language={language}
        text={text}
        audioUrl={currentAudioUrl}
        voiceName={engine === 'gemini' ? selectedVoice : selectedBrowserVoice || 'Sistema'}
        wordCount={wordCount}
        onToast={showToast}
      />

      {/* Hero Banner with High-Capacity Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{t.unlimitedBadge}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>{t.heroModel}</span>
            <span aria-hidden="true">·</span>
            <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              Audio: {audioTargetLanguage === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {t.heroTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            {t.heroSubtitle}
          </p>
        </div>

        {/* Engine switcher toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setEngine('gemini')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              engine === 'gemini'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.engineGemini}</span>
          </button>
          <button
            onClick={() => setEngine('browser')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              engine === 'browser'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>{t.engineBrowser}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Zone Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Text Input, Copy/Paste/Share Toolbar & Audio (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl space-y-5">
            {/* Header with script templates & File Upload Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">{t.scriptTitle}</h3>
              </div>

              {/* Presets and Upload */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 transition-colors cursor-pointer"
                  title="Cargar libro o documento de texto completo sin límites (.txt, .md)"
                >
                  <Upload className="h-3 w-3" />
                  <span>{t.uploadFileBtn}</span>
                </button>

                {SAMPLE_SCRIPTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectTemplate(s.id)}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                  >
                    {s.title[language]}
                  </button>
                ))}
              </div>
            </div>

            {/* High-Capacity Reading Presets (1,000, 10,000 and 1,000,000 words simulation) */}
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mr-1 shrink-0">
                <BookOpen className="h-3 w-3 text-indigo-400" />
                <span>Pruebas:</span>
              </span>
              <button
                type="button"
                onClick={() => handleLoadTestWords(1000)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-indigo-950 hover:text-indigo-300 text-slate-300 border border-slate-800 transition-colors cursor-pointer shrink-0 min-h-[36px]"
              >
                {t.testThousandWords}
              </button>
              <button
                type="button"
                onClick={() => handleLoadTestWords(10000)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-indigo-950 hover:text-indigo-300 text-slate-300 border border-slate-800 transition-colors cursor-pointer shrink-0 min-h-[36px]"
              >
                {t.testTenThousandWords}
              </button>
              <button
                type="button"
                onClick={() => handleLoadTestWords(25000)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/70 transition-colors cursor-pointer flex items-center gap-1 shrink-0 min-h-[36px]"
                title="Genera texto de alta densidad para probar la lectura continua de un libro completo"
              >
                <Sparkle className="h-3 w-3 text-emerald-400" />
                <span>{t.testMillionWords}</span>
              </button>
            </div>

            {/* Top Toolbar: Pegar, Copiar, Compartir Texto y Audio Sin Límites */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800/80 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Paste Button */}
                <button
                  type="button"
                  onClick={handlePasteText}
                  className="flex items-center gap-1.5 px-3 py-2 font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors hover:text-white cursor-pointer min-h-[40px]"
                  title="Pegar texto desde el portapapeles sin límites de longitud"
                >
                  <ClipboardPaste className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{t.btnPasteText}</span>
                </button>

                {/* Copy Text Button */}
                <button
                  type="button"
                  onClick={handleCopyText}
                  disabled={!text.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors hover:text-white disabled:opacity-40 cursor-pointer min-h-[40px]"
                  title="Copiar texto completo al portapapeles sin límites"
                >
                  {hasCopiedText ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-indigo-400" />
                  )}
                  <span>{hasCopiedText ? (language === 'es' ? '¡Copiado!' : 'Copied!') : t.btnCopyText}</span>
                </button>

                {/* Share Options Button (opens multi-channel share modal) */}
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  disabled={!text.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors hover:text-white disabled:opacity-40 cursor-pointer min-h-[40px]"
                  title="Compartir texto y audio por WhatsApp, Telegram, Email, .TXT o Enlace"
                >
                  <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{t.btnShareModal}</span>
                </button>
              </div>

              {/* Instant Clear */}
              <button
                type="button"
                onClick={() => setText('')}
                className="p-2 text-slate-500 hover:text-rose-400 rounded-xl transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                title={t.clearText}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Textarea with Drag & Drop & Desktop Shortcut */}
            <div
              className="relative"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleInitiateGenerate();
                  }
                }}
                placeholder={t.textareaPlaceholder}
                rows={8}
                className="w-full bg-slate-950 border border-slate-800/90 focus:border-indigo-500 rounded-2xl p-4 text-base text-slate-100 placeholder-slate-600 outline-none resize-none leading-relaxed font-sans"
              />

              {/* Character Count & Quick AI Tools */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span className="font-bold text-slate-200">{wordCount.toLocaleString()} {t.words}</span>
                  <span aria-hidden="true">·</span>
                  <span>{text.length.toLocaleString()} {t.characters}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-400">{t.audioEstimated.replace('{sec}', String(estimatedSeconds))}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Instant Translate Button */}
                  <button
                    type="button"
                    onClick={handleTranslateText}
                    disabled={isTranslating || !text.trim()}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Languages className="h-3 w-3" />
                    <span>{isTranslating ? t.translating : t.btnTranslate}</span>
                  </button>

                  {/* Pauses Polish */}
                  <button
                    type="button"
                    onClick={() => handleEnhanceText('natural')}
                    disabled={isEnhancing}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>{isEnhancing ? t.optimizing : t.naturalPauses}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Long-form Chunking Status Banner */}
            {chunks.length > 1 && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="text-indigo-200">
                    {t.chunkInfoBanner
                      .replace('{words}', wordCount.toLocaleString())
                      .replace('{chunks}', String(chunks.length))}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-300 font-mono text-[11px] font-bold shrink-0">
                  {chunks.length} partes
                </span>
              </div>
            )}

            {/* Continuous Book Reader Deck (When Browser Engine is active and speaking or navigating) */}
            {engine === 'browser' && chunks.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {t.continuousReader}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    Parte {browserActiveChunkIndex + 1} de {chunks.length} ({Math.round(((browserActiveChunkIndex + 1) / chunks.length) * 100)}%)
                  </span>
                </div>

                {/* Scrubber slider to jump across 1,000,000 words smoothly */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, chunks.length - 1)}
                    value={browserActiveChunkIndex}
                    onChange={(e) => handleJumpToChunk(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Inicio (Pág. 1)</span>
                    <span>Capítulo actual</span>
                    <span>Final (Parte {chunks.length})</span>
                  </div>
                </div>

                {/* Nav buttons: Jump previous / next */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleJumpToChunk(Math.max(0, browserActiveChunkIndex - 10))}
                      disabled={browserActiveChunkIndex === 0}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40"
                      title="Retroceder 10 fragmentos"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJumpToChunk(Math.max(0, browserActiveChunkIndex - 1))}
                      disabled={browserActiveChunkIndex === 0}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>{t.prevChunk}</span>
                    </button>
                  </div>

                  {/* Active chunk highlight preview */}
                  <div className="hidden sm:block text-[11px] text-slate-400 truncate max-w-xs italic text-center">
                    "{chunks[browserActiveChunkIndex]?.text.slice(0, 45)}..."
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleJumpToChunk(Math.min(chunks.length - 1, browserActiveChunkIndex + 1))}
                      disabled={browserActiveChunkIndex >= chunks.length - 1}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs disabled:opacity-40"
                    >
                      <span>{t.nextChunk}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJumpToChunk(Math.min(chunks.length - 1, browserActiveChunkIndex + 10))}
                      disabled={browserActiveChunkIndex >= chunks.length - 1}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40"
                      title="Avanzar 10 fragmentos"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PREGUNTA PRINCIPAL: ¿A qué idioma va el audio? */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Languages className="h-4 w-4 text-indigo-400" />
                    <span>{t.askLanguageTitle}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t.askLanguageSubtitle}
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                  {audioTargetLanguage === 'es' ? 'ESPAÑOL' : 'ENGLISH'}
                </span>
              </div>

              {/* 2 Big Choice Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Spanish Option */}
                <button
                  type="button"
                  onClick={() => setAudioTargetLanguage('es')}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                    audioTargetLanguage === 'es'
                      ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{t.targetLangSpanishTitle}</span>
                    </span>
                    {audioTargetLanguage === 'es' && (
                      <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {t.targetLangSpanishDesc}
                  </p>
                </button>

                {/* English Option */}
                <button
                  type="button"
                  onClick={() => setAudioTargetLanguage('en')}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                    audioTargetLanguage === 'en'
                      ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{t.targetLangEnglishTitle}</span>
                    </span>
                    {audioTargetLanguage === 'en' && (
                      <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {t.targetLangEnglishDesc}
                  </p>
                </button>
              </div>

              {/* Auto-Translate Option Toggle */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoTranslateIfDifferent}
                    onChange={(e) => setAutoTranslateIfDifferent(e.target.checked)}
                    className="rounded accent-indigo-600 h-4 w-4"
                  />
                  <span>{t.autoTranslateOption}</span>
                </label>
              </div>
            </div>

            {/* Batch Progress Bar during Long-form processing */}
            {batchProgress && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/50 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-indigo-500 animate-ping" />
                    {batchProgress.statusText}
                  </span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {batchProgress.percent}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                    style={{ width: `${batchProgress.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {batchProgress.current} / {batchProgress.total} fragmentos
                  </span>
                  <button
                    type="button"
                    onClick={handleStopBatch}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    <span>{t.btnStopProcess}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {generationError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <strong className="block font-semibold">{t.errorTitle}</strong>
                  <span>{generationError}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEngine('browser');
                      setGenerationError(null);
                    }}
                    className="block mt-1 text-indigo-300 underline font-medium cursor-pointer"
                  >
                    {t.errorFallbackBtn}
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <div>
              {engine === 'gemini' ? (
                <button
                  type="button"
                  onClick={handleInitiateGenerate}
                  disabled={isGenerating || !text.trim()}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{batchProgress?.statusText || t.btnGenerating}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 fill-current" />
                      <span>{t.btnGenerateGemini}</span>
                      <span className="text-xs bg-indigo-700/80 px-2 py-0.5 rounded-md font-mono ml-1">
                        [{audioTargetLanguage === 'es' ? 'ES' : 'EN'}]
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleInitiateGenerate}
                  disabled={!text.trim()}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-600/30 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isBrowserSpeaking ? (
                    <>
                      <Square className="h-5 w-5 fill-current text-white" />
                      <span>{t.btnStopProcess} (Leyendo parte {browserActiveChunkIndex + 1}/{chunks.length})</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 fill-current" />
                      <span>{t.btnPlayBrowser}</span>
                      <span className="text-xs bg-emerald-700/80 px-2 py-0.5 rounded-md font-mono ml-1">
                        [{audioTargetLanguage === 'es' ? 'ES' : 'EN'}]
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Active Audio Player with Copy & Share Audio Support */}
          {(currentAudioUrl || engine === 'browser') && (
            <AudioPlayer
              audioUrl={engine === 'gemini' ? currentAudioUrl : null}
              title={currentAudioTitle || t.generatedAudio}
              voiceName={engine === 'gemini' ? selectedVoice : selectedBrowserVoice}
              styleName={
                engine === 'gemini'
                  ? VOICE_STYLES.find((s) => s.id === selectedStyle)?.name[audioTargetLanguage] || selectedStyle
                  : 'Velocidad ' + browserRate + 'x'
              }
              language={audioTargetLanguage}
              onDownload={() => handleDownloadWav()}
              onShareAudio={() => setIsShareModalOpen(true)}
              onCopyAudio={handleCopyAudio}
              isBrowserSpeech={engine === 'browser'}
              onPlayBrowserSpeech={() => executeGenerateAudio(audioTargetLanguage)}
              onPauseBrowserSpeech={handlePauseBrowserSpeech}
              onStopBrowserSpeech={handleStopBrowserSpeech}
              isBrowserSpeaking={isBrowserSpeaking}
            />
          )}
        </div>

        {/* Right Column: Voice & Style Deck (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {engine === 'gemini' ? (
            /* Gemini Neural Voices & Styles */
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mic className="h-4 w-4 text-indigo-400" />
                  {t.voicesTitle}
                </h3>
                <span className="text-[11px] text-emerald-400 font-mono">24kHz WAV</span>
              </div>

              {/* Voice Cards */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                  {t.chooseVoice}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {GEMINI_VOICES.map((v) => {
                    const isSelected = selectedVoice === v.id;
                    const genderLabel = v.gender[audioTargetLanguage];
                    const toneLabel = v.tone[audioTargetLanguage];
                    const bestForLabel = v.bestFor[audioTargetLanguage];

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVoice(v.id)}
                        className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-600/20'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {v.name}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              genderLabel.toLowerCase().includes('fem')
                                ? 'bg-pink-950/60 text-pink-300 border border-pink-800/50'
                                : 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                            }`}
                          >
                            {genderLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{toneLabel}</p>
                        <span className="text-[11px] text-indigo-400/90 block mt-1">
                          {t.idealFor} {bestForLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Styles */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                  {t.expressionStyle}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VOICE_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setSelectedStyle(st.id);
                        setCustomStylePrompt('');
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-medium text-left truncate transition-colors cursor-pointer ${
                        selectedStyle === st.id && !customStylePrompt
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {st.name[audioTargetLanguage]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Browser Web Speech Settings */
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-emerald-400" />
                  {t.browserTitle}
                </h3>
                <span className="text-[11px] text-slate-400">{t.browserSubtitle}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">{t.systemVoice}</label>
                  <select
                    value={selectedBrowserVoice}
                    onChange={(e) => setSelectedBrowserVoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {relevantBrowserVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{t.readingSpeed}</span>
                    <strong className="text-white font-mono">{browserRate}x</strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={browserRate}
                    onChange={(e) => setBrowserRate(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{t.pitch}</span>
                    <strong className="text-white font-mono">{browserPitch}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={browserPitch}
                    onChange={(e) => setBrowserPitch(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* History of Generated Audios with Share and Copy buttons */}
          {history.length > 0 && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  {t.recentAudios}
                </h4>
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-[11px] text-slate-500 hover:text-rose-400 cursor-pointer"
                >
                  {t.clearHistory}
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="truncate flex-1">
                      <span className="font-semibold text-white block truncate">{item.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {item.voiceName} · {item.styleName} · {item.timestamp} · {item.language.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.audioUrl) {
                            setCurrentAudioUrl(item.audioUrl);
                            setCurrentAudioTitle(item.title);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                        title={t.playAudio}
                      >
                        <Play className="h-3 w-3 fill-current" />
                      </button>

                      {/* Share Audio in History */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (item.audioUrl) {
                            setCurrentAudioUrl(item.audioUrl);
                            setCurrentAudioTitle(item.title);
                            setIsShareModalOpen(true);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 cursor-pointer"
                        title={t.btnShareAudio}
                      >
                        <Share2 className="h-3 w-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadWav(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title={t.downloadWav}
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DIALOGO MODAL EXPLÍCITO: "¿A qué idioma va el audio?" */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Languages className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {t.askLanguageTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t.askLanguageSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Language Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Spanish */}
              <button
                type="button"
                onClick={() => setAudioTargetLanguage('es')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  audioTargetLanguage === 'es'
                    ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">
                    {t.targetLangSpanishTitle}
                  </span>
                  {audioTargetLanguage === 'es' && (
                    <Check className="h-4 w-4 text-indigo-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {t.targetLangSpanishDesc}
                </p>
              </button>

              {/* English */}
              <button
                type="button"
                onClick={() => setAudioTargetLanguage('en')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  audioTargetLanguage === 'en'
                    ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">
                    {t.targetLangEnglishTitle}
                  </span>
                  {audioTargetLanguage === 'en' && (
                    <Check className="h-4 w-4 text-indigo-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {t.targetLangEnglishDesc}
                </p>
              </button>
            </div>

            {/* Script preview & Auto-translate toggle */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Texto a sintetizar:</span>
                <span className="text-indigo-400 font-bold">{wordCount.toLocaleString()} palabras ({chunks.length} partes)</span>
              </div>
              <p className="text-slate-300 line-clamp-2 italic">
                "{text}"
              </p>

              <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-slate-900 text-slate-300">
                <input
                  type="checkbox"
                  checked={autoTranslateIfDifferent}
                  onChange={(e) => setAutoTranslateIfDifferent(e.target.checked)}
                  className="rounded accent-indigo-600 h-4 w-4"
                />
                <span>{t.autoTranslateOption}</span>
              </label>
            </div>

            {/* Checkbox: remember asking */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alwaysAskBeforeGenerate}
                  onChange={(e) => setAlwaysAskBeforeGenerate(e.target.checked)}
                  className="rounded accent-indigo-600 h-3.5 w-3.5"
                />
                <span className="text-[11px]">{t.alwaysAskBeforeGenerate}</span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => executeGenerateAudio(audioTargetLanguage)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 fill-current" />
                <span>{t.btnConfirmAndGenerate} ({audioTargetLanguage.toUpperCase()})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
