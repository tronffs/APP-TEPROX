import { ScriptPreset, GeminiVoice } from '../types/tts';

export const GEMINI_VOICES: GeminiVoice[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: {
      es: 'Femenino',
      en: 'Female',
    },
    tone: {
      es: 'Cálida, empática, fluida y melódica',
      en: 'Warm, empathetic, fluid and melodic',
    },
    bestFor: {
      es: 'Audiolibros, cuentos, meditación y tutoriales',
      en: 'Audiobooks, storytelling, meditation and tutorials',
    },
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: {
      es: 'Masculino',
      en: 'Male',
    },
    tone: {
      es: 'Energético, entusiasta, moderno y amigable',
      en: 'Energetic, enthusiastic, modern and friendly',
    },
    bestFor: {
      es: 'Podcasts, videos de YouTube, redes sociales y apps',
      en: 'Podcasts, YouTube videos, social media and apps',
    },
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: {
      es: 'Masculino',
      en: 'Male',
    },
    tone: {
      es: 'Grave, sereno, autoritario y refinado',
      en: 'Deep, calm, authoritative and refined',
    },
    bestFor: {
      es: 'Documentales, noticias, presentaciones corporativas e historia',
      en: 'Documentaries, news, corporate presentations and history',
    },
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: {
      es: 'Masculino',
      en: 'Male',
    },
    tone: {
      es: 'Resonante, potente, dramático y cinematográfico',
      en: 'Resonant, powerful, dramatic and cinematic',
    },
    bestFor: {
      es: 'Trailers, videojuegos, narración épica y publicidad',
      en: 'Trailers, gaming, epic storytelling and commercials',
    },
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: {
      es: 'Femenino',
      en: 'Female',
    },
    tone: {
      es: 'Clara, brillante, pedagógica y neutral',
      en: 'Clear, bright, pedagogical and neutral',
    },
    bestFor: {
      es: 'Asistentes virtuales, lectura académica y noticias',
      en: 'Virtual assistants, academic narration and announcements',
    },
  },
];

export const VOICE_STYLES = [
  {
    id: 'natural',
    name: {
      es: 'Natural y Fluida',
      en: 'Natural & Fluent',
    },
    prompt: {
      es: 'Voz natural, expresiva, con cadencia humana y dicción perfecta en español',
      en: 'Natural, expressive voice with human cadence and pristine English diction',
    },
  },
  {
    id: 'podcast',
    name: {
      es: 'Locutor de Podcast',
      en: 'Podcast Host',
    },
    prompt: {
      es: 'Tono conversacional, dinámico, amigable y cercano, como en un podcast popular',
      en: 'Conversational, dynamic, friendly and engaging, like a top-tier podcast host',
    },
  },
  {
    id: 'audiobook',
    name: {
      es: 'Narrador de Audiolibro',
      en: 'Audiobook Narrator',
    },
    prompt: {
      es: 'Pausado, expresivo, cautivador, con matices emotivos y pausas reflexivas',
      en: 'Deliberate, expressive, captivating with emotional nuances and thoughtful pauses',
    },
  },
  {
    id: 'news',
    name: {
      es: 'Presentador de Noticias',
      en: 'News Anchor',
    },
    prompt: {
      es: 'Formal, objetivo, con excelente proyección vocal y ritmo ágil informativo',
      en: 'Formal, objective, with crisp vocal projection and authoritative news tempo',
    },
  },
  {
    id: 'meditation',
    name: {
      es: 'Meditación Guiada',
      en: 'Guided Meditation',
    },
    prompt: {
      es: 'Suave, susurrante, muy calmado, pausado y profundamente relajante',
      en: 'Soft, whispering, deeply calm, slow-paced and deeply soothing',
    },
  },
  {
    id: 'commercial',
    name: {
      es: 'Comercial & Publicidad',
      en: 'Commercial & Ad',
    },
    prompt: {
      es: 'Entusiasta, persuasivo, vibrante y lleno de energía positiva',
      en: 'Enthusiastic, persuasive, vibrant and bursting with positive energy',
    },
  },
  {
    id: 'epic',
    name: {
      es: 'Cinematográfico Épico',
      en: 'Epic Cinematic',
    },
    prompt: {
      es: 'Dramático, misterioso, imponente y con gran peso escénico',
      en: 'Dramatic, mysterious, imposing with theatrical cinematic presence',
    },
  },
];

export const SAMPLE_SCRIPTS: ScriptPreset[] = [
  {
    id: 'podcast-intro',
    category: {
      es: 'Podcast',
      en: 'Podcast',
    },
    title: {
      es: 'Introducción de Podcast',
      en: 'Podcast Introduction',
    },
    text: {
      es: '¡Hola a todos y bienvenidos a una nueva edición de Mentes Curiosas! Hoy exploraremos los avances más fascinantes de la inteligencia artificial y cómo la voz humana se transforma en el mundo digital. Preparen sus auriculares, porque lo que viene les va a sorprender.',
      en: 'Hello everyone and welcome back to another episode of Curious Minds! Today, we explore the most fascinating breakthroughs in artificial intelligence and how human voice synthesis is evolving in the digital age. Put on your headphones, because what you are about to hear will blow your mind.',
    },
    recommendedVoice: 'Puck',
    recommendedStyle: 'podcast',
  },
  {
    id: 'tech-news',
    category: {
      es: 'Noticias',
      en: 'News',
    },
    title: {
      es: 'Resumen Tecnológico',
      en: 'Technology News',
    },
    text: {
      es: 'En las noticias de hoy: investigadores logran un hito histórico en la síntesis de audio neural. El nuevo modelo es capaz de emular inflexiones respiratorias y entonaciones sutiles con una fidelidad indistinguible de una locución profesional en estudio.',
      en: 'In today’s tech headlines: researchers have reached an unprecedented milestone in neural audio synthesis. The latest model accurately emulates subtle breath inflections and nuanced intonations, virtually indistinguishable from a studio-recorded human voiceover.',
    },
    recommendedVoice: 'Charon',
    recommendedStyle: 'news',
  },
  {
    id: 'story',
    category: {
      es: 'Cuento',
      en: 'Story',
    },
    title: {
      es: 'El Susurro de las Estrellas',
      en: 'Whisper of the Stars',
    },
    text: {
      es: 'En lo alto de la colina nevada, el viejo faro no alumbraba el mar, sino el cielo. Cada noche de invierno, cuando el viento amainaba, emitía destellos dorados que despertaban los recuerdos dormidos de la montaña.',
      en: 'High atop the snow-covered hill, the ancient lighthouse cast its beam not over the sea, but into the vast night sky. Every winter evening, as the wind subsided, it emitted golden ripples that awakened the mountain’s deepest slumbering memories.',
    },
    recommendedVoice: 'Kore',
    recommendedStyle: 'audiobook',
  },
  {
    id: 'meditation',
    category: {
      es: 'Relajación',
      en: 'Relaxation',
    },
    title: {
      es: 'Meditación Guiada',
      en: 'Guided Meditation',
    },
    text: {
      es: 'Cierra los ojos lentamente. Inhala profundo por la nariz, sintiendo cómo el aire fresco llena tu pecho... y exhala suavemente por la boca, liberando cualquier tensión acumulada en tus hombros.',
      en: 'Gently close your eyes. Take a slow, deep breath in through your nose, feeling the cool air gently expand your chest... and exhale softly through your mouth, letting go of any tension carried in your shoulders.',
    },
    recommendedVoice: 'Kore',
    recommendedStyle: 'meditation',
  },
  {
    id: 'commercial',
    category: {
      es: 'Publicidad',
      en: 'Commercial',
    },
    title: {
      es: 'Anuncio Publicitario',
      en: 'Product Spotlight',
    },
    text: {
      es: '¿Listo para llevar tu creatividad al siguiente nivel? Descubre la nueva generación de herramientas de audio donde cada palabra cobra vida en segundos. ¡Pruébalo gratis hoy mismo!',
      en: 'Ready to elevate your creativity to the next level? Discover the next generation of voice-over tools where every word comes alive in seconds. Experience it for free today!',
    },
    recommendedVoice: 'Puck',
    recommendedStyle: 'commercial',
  },
];
