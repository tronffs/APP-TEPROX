/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { TextToAudioStudio } from './components/TextToAudioStudio';
import { AppLanguage } from './types/tts';
import { TRANSLATIONS } from './utils/i18n';

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>('es');
  const t = TRANSLATIONS[language];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Responsive Navigation Header */}
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Main Studio Stage */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        <TextToAudioStudio
          language={language}
          onLanguageChange={setLanguage}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">{t.appName}</span>
            <span aria-hidden="true">·</span>
            <span>{t.footerDesc}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>{t.footerVoices}</span>
            <span aria-hidden="true">·</span>
            <span>{t.footerQuality}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
