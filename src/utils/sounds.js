import { Audio } from 'expo-av';

// Pre-create reusable sound objects
let correctSound = null;
let wrongSound = null;
let tapSound = null;
let swooshSound = null;
let tickSound = null;
let completeSound = null;

// Generate a WAV buffer for a sine wave tone
function generateToneWAV(frequency, duration, volume = 0.3, fadeOut = true) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Audio data
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = Math.sin(2 * Math.PI * frequency * t) * volume;
    if (fadeOut) {
      const fadeStart = 0.7;
      const progress = i / numSamples;
      if (progress > fadeStart) {
        sample *= 1 - (progress - fadeStart) / (1 - fadeStart);
      }
    }
    const val = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, val * 32767, true);
  }

  return buffer;
}

// Two-tone ascending for correct
function generateCorrectWAV() {
  const sampleRate = 22050;
  const duration = 0.25;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  writeWAVHeader(view, bufferSize, sampleRate, numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const freq = progress < 0.5 ? 523 : 659; // C5 → E5
    let sample = Math.sin(2 * Math.PI * freq * t) * 0.25;
    if (progress > 0.8) sample *= (1 - progress) / 0.2;
    view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, sample * 32767)), true);
  }
  return buffer;
}

// Descending buzz for wrong
function generateWrongWAV() {
  const sampleRate = 22050;
  const duration = 0.3;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  writeWAVHeader(view, bufferSize, sampleRate, numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const freq = 300 - progress * 150; // descending
    // Square-ish wave for buzzy feel
    const sine = Math.sin(2 * Math.PI * freq * t);
    let sample = (sine > 0 ? 0.2 : -0.2) * 0.6 + sine * 0.15;
    if (progress > 0.7) sample *= (1 - progress) / 0.3;
    view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, sample * 32767)), true);
  }
  return buffer;
}

// Short click/tap
function generateTapWAV() {
  return generateToneWAV(800, 0.05, 0.15, true);
}

// Swoosh for swipe
function generateSwooshWAV() {
  const sampleRate = 22050;
  const duration = 0.15;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  writeWAVHeader(view, bufferSize, sampleRate, numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    // White noise with envelope
    let sample = (Math.random() * 2 - 1) * 0.12;
    sample *= progress < 0.3 ? progress / 0.3 : (1 - progress) / 0.7;
    view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, sample * 32767)), true);
  }
  return buffer;
}

// Rising arpeggio for level complete
function generateCompleteWAV() {
  const sampleRate = 22050;
  const duration = 0.5;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  writeWAVHeader(view, bufferSize, sampleRate, numSamples);

  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const noteIdx = Math.min(Math.floor(progress * notes.length), notes.length - 1);
    const freq = notes[noteIdx];
    let sample = Math.sin(2 * Math.PI * freq * t) * 0.2;
    // Add a harmonic
    sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.05;
    if (progress > 0.8) sample *= (1 - progress) / 0.2;
    view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, sample * 32767)), true);
  }
  return buffer;
}

// Tick for timers
function generateTickWAV() {
  return generateToneWAV(1200, 0.03, 0.1, true);
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function writeWAVHeader(view, bufferSize, sampleRate, numSamples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function createSoundFromBuffer(buffer) {
  const base64 = arrayBufferToBase64(buffer);
  const { sound } = await Audio.Sound.createAsync(
    { uri: `data:audio/wav;base64,${base64}` },
    { shouldPlay: false }
  );
  return sound;
}

let initialized = false;

export async function initSounds() {
  if (initialized) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    correctSound = await createSoundFromBuffer(generateCorrectWAV());
    wrongSound = await createSoundFromBuffer(generateWrongWAV());
    tapSound = await createSoundFromBuffer(generateTapWAV());
    swooshSound = await createSoundFromBuffer(generateSwooshWAV());
    tickSound = await createSoundFromBuffer(generateTickWAV());
    completeSound = await createSoundFromBuffer(generateCompleteWAV());

    initialized = true;
  } catch (e) {
    console.warn('Sound init failed:', e);
  }
}

async function playSound(sound) {
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (e) {
    // Ignore playback errors
  }
}

export function playCorrect() { playSound(correctSound); }
export function playWrong() { playSound(wrongSound); }
export function playTap() { playSound(tapSound); }
export function playSwoosh() { playSound(swooshSound); }
export function playTick() { playSound(tickSound); }
export function playComplete() { playSound(completeSound); }
