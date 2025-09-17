// audio.js - audio recording logic
import { appState, saveToStorage } from './storage.js';
import { updateDashboard } from './dashboard.js';

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let isPaused = false;
const lastBlobByMode = { idi: null, fgd: null };
const lastFilenameByMode = { idi: null, fgd: null };
let audioCtx;

function getSupportedMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4' // Safari iOS may not support MediaRecorder well; we still fallback to default
  ];
  for (const c of candidates) { if (MediaRecorder.isTypeSupported?.(c)) return c; }
  return '';
}

function getSelectors(mode='idi') {
  if (mode === 'fgd') {
    return {
      recordBtn: 'fgdRecordBtn',
      recordingStatus: 'fgdRecordingStatus',
      audioPlayback: 'fgdAudioPlayback',
      participantInput: 'fgdParticipants'
    };
  }
  return {
    recordBtn: 'idiRecordBtn',
    recordingStatus: 'idiRecordingStatus',
    audioPlayback: 'idiAudioPlayback',
    participantInput: 'idiParticipant'
  };
}

export function toggleRecording(mode) { if (!isRecording) startRecording(mode); else stopRecording(mode); }

export function startRecording(mode='idi') {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      const mimeType = getSupportedMimeType();
      mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordedChunks = [];
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
      mediaRecorder.onstop = () => {
        const type = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(recordedChunks, { type });
        const audioUrl = URL.createObjectURL(blob);
        const sels = getSelectors(mode);
        const playback = document.getElementById(sels.audioPlayback);
        if (playback) { const audio = playback.querySelector('audio'); if (audio) audio.src = audioUrl; playback.style.display = 'block'; }
        let participantId = '';
        if (mode === 'fgd') {
          const sel = document.getElementById(sels.participantInput);
          participantId = Array.from(sel?.selectedOptions || []).map(o => o.value).join('|');
        } else {
          participantId = document.getElementById(sels.participantInput)?.value || '';
        }
        const interviewType = mode;
        appState.audioRecordings.push({ id: `REC_${Date.now()}`, participantId, type: interviewType, blob, url: audioUrl, timestamp: new Date().toISOString(), duration: 0 });
  saveToStorage();
  updateDashboard();
        lastBlobByMode[mode] = blob;
        lastFilenameByMode[mode] = buildRecordingFilename(mode, participantId, blob.type);
        const dlBtn = document.getElementById(mode === 'fgd' ? 'fgdDownloadBtn' : 'idiDownloadBtn');
        if (dlBtn) dlBtn.disabled = false;
      };
      mediaRecorder.start();
      isRecording = true;
      const sels = getSelectors(mode);
      const btn = document.getElementById(sels.recordBtn);
      if (btn) { btn.innerHTML = '<i class="bi bi-stop-circle"></i> Stop Recording'; btn.classList.remove('btn-danger'); btn.classList.add('btn-success'); }
      const rs = document.getElementById(sels.recordingStatus);
      if (rs) rs.innerHTML = '<span class="recording-indicator"><i class="bi bi-record-circle me-2"></i>Recording in progress...</span>';
      const pauseBtn = document.getElementById(mode === 'fgd' ? 'fgdPauseBtn' : 'idiPauseBtn');
      if (pauseBtn) { pauseBtn.disabled = false; pauseBtn.innerHTML = '<i class="bi bi-pause-circle"></i> Pause'; }
    })
    .catch(err => { console.error('Mic error:', err); alert('Unable to access microphone. Check permissions.'); });
}

export function stopRecording(mode='idi') {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    const sels = getSelectors(mode);
    const btn = document.getElementById(sels.recordBtn);
    if (btn) { btn.innerHTML = '<i class="bi bi-record-circle"></i> Start Recording'; btn.classList.remove('btn-success'); btn.classList.add('btn-danger'); }
    const rs = document.getElementById(sels.recordingStatus);
    if (rs) rs.innerHTML = '<small class="text-success"><i class="bi bi-check-circle me-1"></i>Recording completed</small>';
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
    const pauseBtn = document.getElementById(mode === 'fgd' ? 'fgdPauseBtn' : 'idiPauseBtn');
    if (pauseBtn) { pauseBtn.disabled = true; pauseBtn.innerHTML = '<i class="bi bi-pause-circle"></i> Pause'; }
    isPaused = false;
  }
}

export function pauseRecording(mode='idi') {
  if (!mediaRecorder) return;
  const pauseBtn = document.getElementById(mode === 'fgd' ? 'fgdPauseBtn' : 'idiPauseBtn');
  if (mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    isPaused = true;
    if (pauseBtn) pauseBtn.innerHTML = '<i class="bi bi-play-circle"></i> Resume';
    const rs = document.getElementById(getSelectors(mode).recordingStatus);
    if (rs) rs.innerHTML = '<small class="text-warning"><i class="bi bi-pause-circle me-1"></i>Paused</small>';
  } else if (mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    isPaused = false;
    if (pauseBtn) pauseBtn.innerHTML = '<i class="bi bi-pause-circle"></i> Pause';
    const rs = document.getElementById(getSelectors(mode).recordingStatus);
    if (rs) rs.innerHTML = '<span class="recording-indicator"><i class="bi bi-record-circle me-2"></i>Recording in progress...</span>';
  }
}

export async function downloadRecording(mode='idi') {
  let blob = lastBlobByMode[mode];
  if (!blob) { alert('No recording available to download.'); return; }
  let converted = false;
  // Convert to WAV if necessary
  if (!/wav/i.test(blob.type)) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      blob = audioBufferToWavBlob(audioBuffer);
      converted = true;
    } catch (e) {
      console.warn('WAV conversion failed, downloading original format:', e);
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const base = lastFilenameByMode[mode] || `recording_${new Date().toISOString().replace(/[:.]/g,'-')}.wav`;
  const defaultExt = (blob.type.includes('ogg') && 'ogg') || (blob.type.includes('mp4') && 'm4a') || (blob.type.includes('wav') && 'wav') || 'webm';
  const suggested = converted ? base.replace(/\.[A-Za-z0-9]+$/, '.wav') : base.replace(/\.[A-Za-z0-9]+$/, `.${defaultExt}`);
  a.href = url;
  a.download = suggested;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildRecordingFilename(mode, participantIdJoined, mime) {
  const date = new Date();
  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
  const ext = 'wav';
  const sanitize = s => (s||'').toString().trim().replace(/\s+/g,'_').replace(/[^A-Za-z0-9_\-]/g,'');
  if (mode === 'idi') {
    const pid = participantIdJoined || 'UNKNOWN';
    const p = appState.participants.find(pp => pp.id === pid);
    const loc = sanitize(p?.studySite || 'Unknown');
    return `${pid}_${yyyymmdd}_${loc}.${ext}`;
  }
  // FGD
  const ids = (participantIdJoined||'').split('|').filter(Boolean);
  const participants = appState.participants.filter(p => ids.includes(p.id));
  const sites = Array.from(new Set(participants.map(p => p.studySite).filter(Boolean)));
  const loc = sanitize(sites.length === 1 ? sites[0] : 'Mixed');
  const fgdCount = appState.interviews.filter(i => i.type === 'fgd').length + 1;
  const fgdId = `FGD${String(fgdCount).padStart(3,'0')}`;
  return `${fgdId}_${yyyymmdd}_${loc}.${ext}`;
}

function audioBufferToWavBlob(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  // interleave channels
  const length = buffer.length * numOfChan * 2;
  const result = new ArrayBuffer(44 + length);
  const view = new DataView(result);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numOfChan, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true); // ByteRate
  view.setUint16(32, numOfChan * (bitDepth / 8), true); // BlockAlign
  view.setUint16(36, bitDepth, true); // BitsPerSample
  // data sub-chunk
  writeString(view, 38, 'data');
  view.setUint32(42, length, true);

  // write PCM samples
  let offset = 44;
  const channels = [];
  for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));
  const interleaved = interleave(channels);
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
}

function interleave(channels) {
  const length = channels[0].length;
  const numChannels = channels.length;
  const result = new Float32Array(length * numChannels);
  let index = 0;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      result[index++] = channels[c][i];
    }
  }
  return result;
}
