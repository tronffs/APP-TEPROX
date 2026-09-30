import { AppLanguage } from '../types/tts';

export const TRANSLATIONS = {
  es: {
    // Navigation
    appName: 'VozAudio Studio',
    tabTTS: 'Texto a Audio',
    tabCalc: 'Calculadora',
    tabSim: 'Simulador Python',
    tabTests: 'Pruebas',
    btnCreateAudio: 'Crear Audio',

    // Hero
    heroBadge: 'Síntesis de Voz Neuronal & Audio Studio',
    heroModel: 'Gemini 3.8 Flash Lite TTS',
    heroTitle: 'Transforma Texto en Audio Realista',
    heroSubtitle: 'Capaz de leer hasta 1.000.000 de palabras sin errores mediante segmentación semántica inteligente y unión de audio.',

    // Unlimited Capacity (1,000,000 words)
    unlimitedBadge: 'Capacidad Ilimitada (1.000.000+ Palabras)',
    uploadFileBtn: 'Subir archivo (.txt, .md)',
    readingProgressTitle: 'Procesamiento por Lotes en Progreso',
    processingChunk: 'Procesando fragmento {current} de {total} ({pct}%)',
    stitchingAudio: 'Uniendo fragmentos en un solo archivo WAV maestro...',
    btnStopProcess: 'Detener Proceso',
    chunkInfoBanner: '{words} palabras detectadas · Dividido en {chunks} fragmentos continuos sin riesgo de error ni corte.',
    listenAsItGenerates: 'Escuchar en vivo mientras se procesa',
    liveChunkIndicator: 'Leyendo fragmento {current} de {total}...',
    continuousReader: 'Lector Continuo de Libros y Textos Gigantes',
    jumpToChunk: 'Ir a fragmento',
    prevChunk: 'Anterior',
    nextChunk: 'Siguiente',
    currentlyReading: 'Leyendo actualmente:',
    testMillionWords: 'Prueba 1.000.000 palabras (Simulación)',
    testTenThousandWords: 'Prueba 10.000 palabras',
    testThousandWords: 'Prueba 1.000 palabras',

    // Copy, Paste & Share Actions Without Limits
    btnCopyText: 'Copiar Texto',
    btnPasteText: 'Pegar Texto',
    btnShareText: 'Compartir Texto',
    btnShareAudio: 'Compartir Audio',
    btnCopyAudio: 'Copiar Audio',
    btnShareModal: 'Opciones de Compartir',
    shareModalTitle: 'Compartir Texto y Audio Sin Límites',
    shareModalSubtitle: 'Exporta o envía tu texto y audio generado a cualquier plataforma sin restricciones.',
    shareDirectAudio: 'Compartir Archivo de Audio Directo',
    shareDirectAudioDesc: 'Envía el archivo .WAV directamente a WhatsApp, Telegram, Google Drive o AirDrop.',
    shareViaWhatsapp: 'Compartir en WhatsApp',
    shareViaTelegram: 'Compartir en Telegram',
    shareViaEmail: 'Enviar por Correo',
    exportTxt: 'Descargar Texto (.TXT)',
    copyAudioUri: 'Copiar Audio en Base64 / Data URI',
    copyAudioLink: 'Copiar Enlace de Descarga',
    textCopiedNotification: '¡Texto copiado sin límites al portapapeles!',
    audioCopiedNotification: '¡Audio copiado al portapapeles sin límites!',
    audioSharedNotification: '¡Audio preparado para compartir!',
    clipboardReadError: 'No se pudo acceder al portapapeles automáticamente. Usa el atajo de tu teclado.',

    // Engines
    engineGemini: 'Voz IA Gemini',
    engineBrowser: 'Voz Local del Navegador',

    // Editor
    scriptTitle: 'Guion de Locución / Texto Extenso',
    examplesLabel: 'Ejemplos:',
    textareaPlaceholder: 'Pega aquí libros, artículos o guiones de cualquier extensión (hasta 1.000.000+ de palabras)...',
    characters: 'caracteres',
    words: 'palabras',
    audioEstimated: '~{sec}s de audio',
    optimizeCadence: 'Optimizar ritmo:',
    naturalPauses: 'Pausas Naturales',
    optimizing: 'Optimizando...',
    clearText: 'Borrar texto',
    btnTranslate: 'Traducir al Inglés (EN)',
    translating: 'Traduciendo...',

    // Audio Language Question Section
    askLanguageTitle: '¿A qué idioma va el audio?',
    askLanguageSubtitle: 'Selecciona el idioma en el que deseas escuchar la locución:',
    targetLangSpanishTitle: 'Español 🇪🇸',
    targetLangSpanishDesc: 'Locución nativa en español con acento y cadencia fluida',
    targetLangEnglishTitle: 'Inglés / English 🇺🇸',
    targetLangEnglishDesc: 'Native English voiceover with natural pace and clear diction',
    audioLanguageLabel: 'Idioma de Salida del Audio:',
    autoTranslateOption: 'Traducir automáticamente el texto a este idioma antes de generar',
    alwaysAskBeforeGenerate: 'Preguntar siempre a qué idioma va el audio antes de generar',
    modalTitle: 'Confirmar Idioma de la Locución',
    btnConfirmAndGenerate: 'Confirmar y Generar Audio',
    cancel: 'Cancelar',

    // Errors
    errorTitle: 'Error al sintetizar con IA:',
    errorFallbackBtn: 'Usar síntesis local del navegador en su lugar',

    // Primary buttons
    btnGenerateGemini: 'Generar Audio Completo (.WAV)',
    btnGenerating: 'Sintetizando Voz Neuronal con Gemini...',
    btnPlayBrowser: 'Lectura Continua en Vivo (Sin Límite)',

    // Voice & Style Panel
    voicesTitle: 'Voces Neuronales Gemini',
    chooseVoice: 'Elige la Voz',
    idealFor: 'Ideal para:',
    expressionStyle: 'Estilo de Expresión & Tono',

    // Browser settings
    browserTitle: 'Voces del Navegador',
    browserSubtitle: 'Síntesis Continua Local',
    systemVoice: 'Voz del Sistema',
    readingSpeed: 'Velocidad de Lectura (Rate):',
    pitch: 'Tono (Pitch):',

    // History
    recentAudios: 'Audios Recientes',
    clearHistory: 'Limpiar',
    downloadWav: 'Descargar .WAV',
    playAudio: 'Reproducir',

    // Audio Player
    voiceLabel: 'Voz:',
    styleLabel: 'Estilo:',
    generatedAudio: 'Audio Generado',
    speed: 'Velocidad',
    mute: 'Silenciar',
    unmute: 'Activar sonido',
    restart: 'Reiniciar',
    pause: 'Pausar',
    play: 'Reproducir',

    // Footer
    footerDesc: 'Generador de Texto a Audio con IA & Síntesis de Voz',
    footerVoices: 'Voces Neuronales: Kore, Puck, Charon, Fenrir, Zephyr',
    footerQuality: 'Formato WAV 24kHz · Long-Form Audio Engine',

    // Language Toggle
    langSwitch: 'Idioma de la Interfaz',
    esFlag: 'Español',
    enFlag: 'English',
  },
  en: {
    // Navigation
    appName: 'VozAudio Studio',
    tabTTS: 'Text to Audio',
    tabCalc: 'Calculator',
    tabSim: 'Python Simulator',
    tabTests: 'Tests',
    btnCreateAudio: 'Create Audio',

    // Hero
    heroBadge: 'Neural Speech Synthesis & Audio Studio',
    heroModel: 'Gemini 3.8 Flash Lite TTS',
    heroTitle: 'Transform Text into Realistic Audio',
    heroSubtitle: 'Engineered to voice up to 1,000,000 words error-free through smart semantic chunking and WAV stitching.',

    // Unlimited Capacity (1,000,000 words)
    unlimitedBadge: 'Unlimited Capacity (1,000,000+ Words)',
    uploadFileBtn: 'Upload file (.txt, .md)',
    readingProgressTitle: 'Batch Audio Processing in Progress',
    processingChunk: 'Processing chunk {current} of {total} ({pct}%)',
    stitchingAudio: 'Stitching chunks into a single master WAV file...',
    btnStopProcess: 'Stop Process',
    chunkInfoBanner: '{words} words detected · Partitioned into {chunks} continuous chunks with zero timeouts.',
    listenAsItGenerates: 'Listen live while generating',
    liveChunkIndicator: 'Reading chunk {current} of {total}...',
    continuousReader: 'Continuous Book & Massive Text Reader',
    jumpToChunk: 'Go to chunk',
    prevChunk: 'Previous',
    nextChunk: 'Next',
    currentlyReading: 'Currently reading:',
    testMillionWords: 'Test 1,000,000 Words (Simulation)',
    testTenThousandWords: 'Test 10,000 Words',
    testThousandWords: 'Test 1,000 Words',

    // Copy, Paste & Share Actions Without Limits
    btnCopyText: 'Copy Text',
    btnPasteText: 'Paste Text',
    btnShareText: 'Share Text',
    btnShareAudio: 'Share Audio',
    btnCopyAudio: 'Copy Audio',
    btnShareModal: 'Share Options',
    shareModalTitle: 'Share Text & Audio Without Limits',
    shareModalSubtitle: 'Export or send your generated text and audio to any platform without restrictions.',
    shareDirectAudio: 'Share Audio File Directly',
    shareDirectAudioDesc: 'Send the .WAV file directly to WhatsApp, Telegram, Google Drive or AirDrop.',
    shareViaWhatsapp: 'Share via WhatsApp',
    shareViaTelegram: 'Share via Telegram',
    shareViaEmail: 'Send via Email',
    exportTxt: 'Download Text (.TXT)',
    copyAudioUri: 'Copy Audio as Base64 / Data URI',
    copyAudioLink: 'Copy Download Link',
    textCopiedNotification: 'Text copied to clipboard without limits!',
    audioCopiedNotification: 'Audio copied to clipboard without limits!',
    audioSharedNotification: 'Audio prepared to share!',
    clipboardReadError: 'Could not access clipboard automatically. Use your keyboard shortcut.',

    // Engines
    engineGemini: 'Gemini AI Voice',
    engineBrowser: 'Local Browser Voice',

    // Editor
    scriptTitle: 'Voiceover Script / Long-Form Text',
    examplesLabel: 'Samples:',
    textareaPlaceholder: 'Paste books, articles, or scripts of any length (up to 1,000,000+ words)...',
    characters: 'characters',
    words: 'words',
    audioEstimated: '~{sec}s of audio',
    optimizeCadence: 'Optimize rhythm:',
    naturalPauses: 'Natural Pauses',
    optimizing: 'Optimizing...',
    clearText: 'Clear text',
    btnTranslate: 'Translate to Spanish (ES)',
    translating: 'Translating...',

    // Audio Language Question Section
    askLanguageTitle: 'What language should the audio be in?',
    askLanguageSubtitle: 'Select the language you want the voiceover to be spoken in:',
    targetLangSpanishTitle: 'Spanish / Español 🇪🇸',
    targetLangSpanishDesc: 'Native Spanish voiceover with fluid cadence and accent',
    targetLangEnglishTitle: 'English 🇺🇸',
    targetLangEnglishDesc: 'Native English voiceover with natural pace and clear diction',
    audioLanguageLabel: 'Target Audio Language:',
    autoTranslateOption: 'Automatically translate text into this language before generating',
    alwaysAskBeforeGenerate: 'Always ask which language the audio should be in before generating',
    modalTitle: 'Confirm Voiceover Language',
    btnConfirmAndGenerate: 'Confirm and Generate Audio',
    cancel: 'Cancel',

    // Errors
    errorTitle: 'Error synthesizing with AI:',
    errorFallbackBtn: 'Use local browser voice instead',

    // Primary buttons
    btnGenerateGemini: 'Generate Full Audio (.WAV)',
    btnGenerating: 'Synthesizing Neural Speech with Gemini...',
    btnPlayBrowser: 'Live Continuous Reading (Unlimited)',

    // Voice & Style Panel
    voicesTitle: 'Gemini Neural Voices',
    chooseVoice: 'Choose Voice',
    idealFor: 'Best for:',
    expressionStyle: 'Expression Style & Tone',

    // Browser settings
    browserTitle: 'Browser Voices',
    browserSubtitle: 'Continuous Local Synthesis',
    systemVoice: 'System Voice',
    readingSpeed: 'Reading Speed (Rate):',
    pitch: 'Pitch:',

    // History
    recentAudios: 'Recent Audios',
    clearHistory: 'Clear',
    downloadWav: 'Download .WAV',
    playAudio: 'Play',

    // Audio Player
    voiceLabel: 'Voice:',
    styleLabel: 'Style:',
    generatedAudio: 'Generated Audio',
    speed: 'Speed',
    mute: 'Mute',
    unmute: 'Unmute',
    restart: 'Restart',
    pause: 'Pause',
    play: 'Play',

    // Footer
    footerDesc: 'AI Text-to-Speech Generator & Voice Studio',
    footerVoices: 'Neural Voices: Kore, Puck, Charon, Fenrir, Zephyr',
    footerQuality: '24kHz WAV Format · Long-Form Audio Engine',

    // Language Toggle
    langSwitch: 'Interface Language',
    esFlag: 'Español',
    enFlag: 'English',
  },
};
