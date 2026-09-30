import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  FileText,
  Music,
  Send,
  Mail,
  ExternalLink
} from 'lucide-react';
import { AppLanguage } from '../types/tts';
import { TRANSLATIONS } from '../utils/i18n';
import {
  copyTextToClipboard,
  copyAudioDataUri,
  shareAudioFile,
  shareTextContent,
  shareViaWhatsApp,
  shareViaTelegram,
  shareViaEmail,
  exportTextAsFile,
  downloadAudioFile
} from '../utils/shareHelper';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
  text: string;
  audioUrl: string | null;
  voiceName: string;
  wordCount: number;
  onToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  language,
  text,
  audioUrl,
  voiceName,
  wordCount,
  onToast,
}) => {
  const t = TRANSLATIONS[language];
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedAudio, setCopiedAudio] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedText(true);
      onToast(t.textCopiedNotification);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const handleCopyAudio = async () => {
    if (!audioUrl) return;
    const ok = await copyAudioDataUri(audioUrl);
    if (ok) {
      setCopiedAudio(true);
      onToast(t.audioCopiedNotification);
      setTimeout(() => setCopiedAudio(false), 2500);
    }
  };

  const handleDirectShareAudio = async () => {
    if (!audioUrl) return;
    const ok = await shareAudioFile(
      `VozAudio - ${voiceName}`,
      audioUrl,
      `VozAudio_${voiceName}_${Date.now()}.wav`,
      text.slice(0, 300)
    );
    if (ok) {
      onToast(t.audioSharedNotification);
    }
  };

  const handleDirectShareText = async () => {
    const ok = await shareTextContent(`VozAudio (${wordCount} palabras)`, text);
    if (ok) {
      onToast(language === 'es' ? '¡Texto compartido con éxito!' : 'Text shared successfully!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 sm:space-y-6 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.shareModalTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.shareModalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section 1: Audio Sharing (if audio exists) */}
        {audioUrl && (
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-indigo-950/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5" />
                <span>Audio Generado ({voiceName})</span>
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                WAV 24kHz · Sin Límites
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Native File Share */}
              <button
                onClick={handleDirectShareAudio}
                className="flex items-center gap-2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/20 text-left"
              >
                <Share2 className="h-4 w-4 shrink-0" />
                <div>
                  <span className="block">{t.shareDirectAudio}</span>
                  <span className="text-[10px] text-indigo-200 font-normal">WhatsApp, Telegram, etc.</span>
                </div>
              </button>

              {/* Direct WAV Download */}
              <button
                onClick={() => downloadAudioFile(audioUrl, `VozAudio_${voiceName}_${Date.now()}.wav`)}
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors text-left"
              >
                <Download className="h-4 w-4 shrink-0 text-emerald-400" />
                <div>
                  <span className="block">{t.downloadWav}</span>
                  <span className="text-[10px] text-slate-400 font-normal">Archivo WAV sin comprimir</span>
                </div>
              </button>

              {/* Copy Audio Data URI / Base64 */}
              <button
                onClick={handleCopyAudio}
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition-colors text-left sm:col-span-2"
              >
                {copiedAudio ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 shrink-0 text-indigo-400" />
                )}
                <div>
                  <span className="block">{copiedAudio ? '¡Audio copiado!' : t.copyAudioUri}</span>
                  <span className="text-[10px] text-slate-400 font-normal">Para embeber en HTML o transferir sin límites</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Section 2: Text Sharing & Export */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>Texto / Guion ({wordCount.toLocaleString()} {t.words})</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              {text.length.toLocaleString()} caracteres
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* WhatsApp */}
            <button
              onClick={() => shareViaWhatsApp(text)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-600/50 text-slate-200 transition-colors text-center gap-1"
            >
              <Send className="h-4 w-4 text-emerald-400" />
              <span className="text-[11px] font-semibold">{t.shareViaWhatsapp}</span>
            </button>

            {/* Telegram */}
            <button
              onClick={() => shareViaTelegram(text)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 hover:bg-sky-950/60 border border-slate-800 hover:border-sky-600/50 text-slate-200 transition-colors text-center gap-1"
            >
              <Send className="h-4 w-4 text-sky-400" />
              <span className="text-[11px] font-semibold">{t.shareViaTelegram}</span>
            </button>

            {/* Email */}
            <button
              onClick={() => shareViaEmail('Guion de VozAudio Studio', text)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-600/50 text-slate-200 transition-colors text-center gap-1"
            >
              <Mail className="h-4 w-4 text-purple-400" />
              <span className="text-[11px] font-semibold">{t.shareViaEmail}</span>
            </button>

            {/* Download TXT */}
            <button
              onClick={() => exportTextAsFile(text, `Guion_VozAudio_${Date.now()}.txt`)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-600/50 text-slate-200 transition-colors text-center gap-1"
            >
              <Download className="h-4 w-4 text-indigo-400" />
              <span className="text-[11px] font-semibold">{t.exportTxt}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopyText}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              {copiedText ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-indigo-400" />
              )}
              <span>{copiedText ? (language === 'es' ? '¡Texto copiado!' : 'Text copied!') : t.btnCopyText}</span>
            </button>

            <button
              onClick={handleDirectShareText}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
              <span>{t.btnShareText}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
