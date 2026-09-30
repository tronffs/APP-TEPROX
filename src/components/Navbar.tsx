import React from 'react';
import { Volume2, Sparkles, Globe } from 'lucide-react';
import { AppLanguage } from '../types/tts';
import { TRANSLATIONS } from '../utils/i18n';

interface NavbarProps {
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0 shadow-lg shadow-indigo-950/40">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
              {t.appName}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {language === 'es' ? 'Texto a Audio & Síntesis de Voz Neuronal' : 'Text-to-Audio & Neural Speech Studio'}
            </p>
          </div>
        </div>

        {/* Right side: Language Toggle (ES / EN) & Studio Badge */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-indigo-300 bg-indigo-950/50 border border-indigo-800/40 px-3 py-1.5 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>24 kHz Studio Audio</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => onLanguageChange('es')}
              className={`flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg transition-all min-h-[36px] min-w-[38px] cursor-pointer ${
                language === 'es'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Cambiar a Español"
            >
              <span>ES</span>
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg transition-all min-h-[36px] min-w-[38px] cursor-pointer ${
                language === 'en'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to English"
            >
              <span>EN</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
