/**
 * Universal Share, Copy & Paste Helper for Unlimited Text and Audio
 * Features Web Share API, Clipboard API with textarea fallback, WhatsApp, Telegram, Email, and File Export.
 */

/**
 * Copies text to clipboard with automatic fallback if Clipboard API is restricted
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Method 1: Modern navigator.clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to Method 2
    }
  }

  // Method 2: Fallback using temporary textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}

/**
 * Reads text from clipboard with graceful error handling
 */
export async function readTextFromClipboard(): Promise<string | null> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
    try {
      const text = await navigator.clipboard.readText();
      return text || null;
    } catch (err) {
      console.warn('Clipboard read permission denied or unavailable:', err);
      return null;
    }
  }
  return null;
}

/**
 * Shares text via Web Share API or falls back to copy/WhatsApp
 */
export async function shareTextContent(title: string, text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: title || 'Texto de VozAudio Studio',
        text: text,
      });
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return false;
      }
      console.warn('Web Share failed, falling back to clipboard:', err);
    }
  }

  // Fallback: Copy to clipboard
  return await copyTextToClipboard(text);
}

/**
 * Shares audio file directly using Web Share API (WhatsApp, Telegram, AirDrop, Drive, etc.)
 * Falls back to triggering immediate .wav download
 */
export async function shareAudioFile(
  title: string,
  audioUrlOrBlob: string | Blob,
  fileName: string = 'VozAudio.wav',
  accompanyingText?: string
): Promise<boolean> {
  try {
    let blob: Blob;

    if (typeof audioUrlOrBlob === 'string') {
      const response = await fetch(audioUrlOrBlob);
      blob = await response.blob();
    } else {
      blob = audioUrlOrBlob;
    }

    const file = new File([blob], fileName, { type: 'audio/wav' });

    // Check if browser supports sharing files via Web Share API
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] }) &&
      navigator.share
    ) {
      await navigator.share({
        title: title || 'Audio de VozAudio Studio',
        text: accompanyingText ? accompanyingText.slice(0, 200) + '...' : 'Audio generado con VozAudio Studio',
        files: [file],
      });
      return true;
    }

    // Fallback: Trigger direct download
    downloadAudioFile(blob, fileName);
    return true;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return false;
    }
    console.error('Error sharing audio file:', err);
    return false;
  }
}

/**
 * Downloads audio file to device
 */
export function downloadAudioFile(audioUrlOrBlob: string | Blob, fileName: string = 'VozAudio.wav') {
  let downloadUrl: string;
  let shouldRevoke = false;

  if (typeof audioUrlOrBlob === 'string') {
    downloadUrl = audioUrlOrBlob;
  } else {
    downloadUrl = URL.createObjectURL(audioUrlOrBlob);
    shouldRevoke = true;
  }

  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  if (shouldRevoke) {
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
  }
}

/**
 * Copies audio file as Base64 Data URL or Blob to clipboard
 */
export async function copyAudioDataUri(audioUrlOrBlob: string | Blob): Promise<boolean> {
  try {
    let blob: Blob;
    if (typeof audioUrlOrBlob === 'string') {
      const response = await fetch(audioUrlOrBlob);
      blob = await response.blob();
    } else {
      blob = audioUrlOrBlob;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const copied = await copyTextToClipboard(base64Data);
        resolve(copied);
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Failed to copy audio data URI:', err);
    return false;
  }
}

/**
 * Shares text via WhatsApp Web / App
 */
export function shareViaWhatsApp(text: string) {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text.slice(0, 3000))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Shares text via Telegram Web / App
 */
export function shareViaTelegram(text: string) {
  const url = `https://t.me/share/url?text=${encodeURIComponent(text.slice(0, 3000))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Shares text via Email client
 */
export function shareViaEmail(subject: string, body: string) {
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 4000))}`;
  window.location.href = mailto;
}

/**
 * Exports text as a downloadable .txt file without limits
 */
export function exportTextAsFile(text: string, fileName: string = 'guion_vozaudio.txt') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
