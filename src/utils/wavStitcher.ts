/**
 * Seamless WAV Audio Buffer Stitcher using Web Audio API
 * Concatenates multiple audio chunks into a single continuous master WAV file
 */

export async function stitchWavBlobs(blobs: Blob[]): Promise<Blob> {
  if (blobs.length === 0) {
    throw new Error('No audio blobs to stitch.');
  }
  if (blobs.length === 1) {
    return blobs[0];
  }

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioCtx();

  try {
    // 1. Decode all Blobs into AudioBuffers
    const audioBuffers: AudioBuffer[] = [];
    for (const blob of blobs) {
      const arrayBuffer = await blob.arrayBuffer();
      // decodeAudioData handles WAV, MP3, OGG, AAC automatically
      const decoded = await audioContext.decodeAudioData(arrayBuffer);
      audioBuffers.push(decoded);
    }

    // 2. Calculate total sample length
    const sampleRate = audioBuffers[0].sampleRate;
    const numberOfChannels = audioBuffers[0].numberOfChannels;
    const totalLength = audioBuffers.reduce((sum, b) => sum + b.length, 0);

    // 3. Create master combined AudioBuffer
    const masterBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = masterBuffer.getChannelData(channel);
      let offset = 0;
      for (const buffer of audioBuffers) {
        channelData.set(buffer.getChannelData(channel), offset);
        offset += buffer.length;
      }
    }

    // 4. Encode masterBuffer into a 16-bit PCM WAV Blob
    const masterWavBlob = audioBufferToWavBlob(masterBuffer);
    return masterWavBlob;
  } finally {
    audioContext.close();
  }
}

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numOfChannels * 2; // 16-bit = 2 bytes per sample
  const bufferArray = new ArrayBuffer(44 + length);
  const view = new DataView(bufferArray);

  // Write RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');

  // Write FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk1 size (16 for PCM)
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChannels * 2, true); // byte rate
  view.setUint16(32, numOfChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // Write DATA sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Interleave channel samples and convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
  const channels: Float32Array[] = [];
  for (let i = 0; i < numOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      // Convert to 16-bit PCM integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([bufferArray], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
