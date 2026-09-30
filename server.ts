import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint: Generate Speech via Gemini TTS (with multi-model fallback: gemini-3.8-flash-tts -> gemini-3.8-flash-lite-tts)
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { text, voiceName = 'Kore', style = '', language = 'es' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        error: language === 'en' ? 'Text to convert is required.' : 'El texto a convertir es requerido.',
      });
    }

    if (!ai) {
      return res.status(503).json({
        error:
          language === 'en'
            ? 'AI service is not configured (missing GEMINI_API_KEY). Using local browser voices.'
            : 'El servicio de IA no está configurado (falta GEMINI_API_KEY). Usa la voz del navegador.',
        fallbackAvailable: true,
      });
    }

    const defaultStyle =
      language === 'en'
        ? 'Natural, expressive, clear and fluent in English'
        : 'Natural, expresiva y fluida en español';

    // Primary & Fallback TTS models from gemini-api skill
    const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
    let base64Audio: string | null = null;
    let mimeType = 'audio/wav';
    let lastError: any = null;
    let usedModel = '';

    for (const model of ttsModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text.trim(),
                  speechMetadata: {
                    style: style || defaultStyle,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
              },
            },
          },
        });

        const candidate = response.candidates?.[0];
        const audioPart = candidate?.content?.parts?.find((p) => p.inlineData?.data);
        if (audioPart?.inlineData?.data) {
          base64Audio = audioPart.inlineData.data;
          mimeType = audioPart.inlineData.mimeType || 'audio/wav';
          usedModel = model;
          break; // Successful generation!
        }
      } catch (err: any) {
        console.warn(`TTS generation with ${model} failed, attempting next model:`, err.message || err);
        lastError = err;
      }
    }

    if (!base64Audio) {
      const isQuota = lastError?.status === 429 || lastError?.message?.includes('quota') || lastError?.message?.includes('RESOURCE_EXHAUSTED');
      const errorMsg = isQuota
        ? (language === 'en'
            ? 'AI Voice quota temporarily reached. You can switch to Local Browser Voice for unlimited free reading.'
            : 'La cuota de la IA de Google está temporalmente ocupada. Puedes usar la Voz Local del Navegador para lectura ilimitada.')
        : (language === 'en'
            ? 'Unable to synthesize audio with AI. You can use the Local Browser Voice instead.'
            : 'No se pudo generar el audio con la IA. Puedes activar la Voz del Navegador.');

      return res.status(isQuota ? 429 : 500).json({
        error: errorMsg,
        fallbackAvailable: true,
        isQuotaError: isQuota,
      });
    }

    res.json({
      audioBase64: base64Audio,
      mimeType,
      voiceName,
      modelUsed: usedModel,
    });
  } catch (err: any) {
    console.error('Fatal error generating audio with Gemini TTS:', err);
    res.status(500).json({
      error: 'Error al procesar la síntesis de voz con IA.',
      fallbackAvailable: true,
    });
  }
});

// Endpoint: Translate text between Spanish and English (with reliable model fallback)
app.post('/api/tts/translate', async (req, res) => {
  try {
    const { text, targetLang = 'en' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }

    if (!ai) {
      return res.json({ translatedText: text });
    }

    const targetDesc = targetLang === 'en' ? 'English' : 'Spanish';
    const translationModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let translated = text;

    for (const model of translationModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: text,
          config: {
            systemInstruction: `You are a professional voice-over translator. Translate the given text into natural, spoken ${targetDesc} suitable for voice narration and audiobooks. Maintain formatting, tone and emotion. Return ONLY the translated text without explanations, brackets or notes.`,
            temperature: 0.3,
          },
        });

        if (response.text?.trim()) {
          translated = response.text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`Translation with ${model} failed, trying next:`, err.message?.slice(0, 80));
      }
    }

    res.json({ translatedText: translated });
  } catch (err: any) {
    console.error('Error translating text:', err);
    res.status(500).json({ error: 'Translation failed.' });
  }
});

// Endpoint: Enhance or optimize text for speech
app.post('/api/tts/enhance-text', async (req, res) => {
  try {
    const { text, mode = 'natural' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'El texto es requerido.' });
    }

    if (!ai) {
      return res.json({ enhancedText: text });
    }

    let instruction =
      'Mejora y optimiza la puntuación, ritmo y claridad del siguiente texto para que suene perfecto al ser leído en voz alta por un narrador. Mantén el significado original y el idioma. Devuelve únicamente el texto mejorado, sin introducciones ni comentarios adicionales.';
    if (mode === 'dramatic') {
      instruction =
        'Reescribe el texto con tono cinematográfico, pausas expresivas y puntuación dramática para lectura en voz alta. Devuelve únicamente el texto.';
    } else if (mode === 'professional') {
      instruction =
        'Optimiza el texto con tono corporativo, claro y dicción impecable para una presentación o audiolibro. Devuelve únicamente el texto.';
    }

    const enhancementModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let enhanced = text;

    for (const model of enhancementModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: text,
          config: {
            systemInstruction: instruction,
            temperature: 0.7,
          },
        });

        if (response.text?.trim()) {
          enhanced = response.text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`Enhance text with ${model} failed:`, err.message?.slice(0, 80));
      }
    }

    res.json({ enhancedText: enhanced });
  } catch (err: any) {
    console.error('Error enhancing text:', err);
    res.status(500).json({ error: 'No se pudo optimizar el texto.' });
  }
});

// Mount Vite or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
