// idi.js - IDI/FGD interviews, guides, notes
import { appState, saveToStorage } from './storage.js';
import { updateDashboard } from './dashboard.js';
import { toggleRecording } from './audio.js';

export function loadParticipantsForInterview() {
  const select = document.getElementById('idiParticipant');
  if (!select) return;
  select.innerHTML = '<option value="">Choose participant...</option>';
  appState.participants.filter(p => p.isEligible).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.id} - ${p.fullName} (${p.type})`;
    select.appendChild(opt);
  });
}

export function saveInterview(mode = 'idi') {
  const participantId = document.getElementById('idiParticipant')?.value;
  const interviewType = mode;
  const notes = document.getElementById('idiNotes')?.value || '';
  if (!participantId) { alert('Please select a participant first.'); return; }
  const interview = { id: `INT_${Date.now()}`, participantId, type: interviewType, notes, timestamp: new Date().toISOString(), completed: false };
  appState.interviews.push(interview);
  saveToStorage();
  updateDashboard();
  alert('IDI notes saved successfully!');
}

export function completeInterview(mode = 'idi') {
  const participantId = document.getElementById('idiParticipant')?.value;
  if (!participantId) { alert('Please select a participant first.'); return; }
  saveInterview(mode);
  const participant = appState.participants.find(p => p.id === participantId);
  if (participant) participant.interviewCompleted = true;
  const latestInterview = appState.interviews.filter(i => i.participantId === participantId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  if (latestInterview) latestInterview.completed = true;
  saveToStorage();
  updateDashboard();
  alert('IDI completed successfully!');
  const select = document.getElementById('idiParticipant'); if (select) select.value = '';
  const notes = document.getElementById('idiNotes'); if (notes) notes.value = '';
}

export function setupInterviewAutosave() {
  let autoSaveTimeout;
  const notesEl = document.getElementById('idiNotes');
  if (notesEl) {
    notesEl.addEventListener('input', function () {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        const participantId = document.getElementById('idiParticipant')?.value;
        if (participantId) localStorage.setItem(`draft_${participantId}`, this.value);
      }, 2000);
    });
  }
  const participantEl = document.getElementById('idiParticipant');
  if (participantEl) {
    participantEl.addEventListener('change', function () {
      const participantId = this.value;
      if (participantId) {
        const draft = localStorage.getItem(`draft_${participantId}`);
        if (draft) { const notes = document.getElementById('interviewNotes'); if (notes) notes.value = draft; }
        const p = appState.participants.find(pp => pp.id === participantId);
        if (p) showGuideModal(p.type);
      }
    });
  }
}

export function setupInterviewShortcuts() {
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const interviewSection = document.getElementById('interview');
      if (interviewSection?.classList.contains('active')) saveInterview('idi');
    }
    if (e.code === 'Space' && e.target && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      const interviewSection = document.getElementById('interview');
      if (interviewSection?.classList.contains('active')) { 
        e.preventDefault(); 
        const fgdPane = document.getElementById('fgdTab');
        const useFgd = fgdPane && fgdPane.classList.contains('active');
        toggleRecording(useFgd ? 'fgd' : 'idi'); 
      }
    }
  });
}

export function showGuideModal(type) {
  // Populate the IDI side panel guide instead of a modal
  const body = document.getElementById('idiGuideContent');
  const guides = {
    patient: { title: 'Patient Interview Guide', content: `
      <h6 class="text-white">Objective:</h6>
      <p>Understand patients' experiences, treatment behaviours, and perspectives on integrating conventional and herbal care.</p>
      <h6 class="text-white mt-3">Key Prompts:</h6>
      <div class="mb-3"><strong>Diagnosis Experience:</strong><ul class="small mt-1"><li>"Can you walk me through the story of how you were first diagnosed with high blood pressure?"</li><li>"How did you feel when you received the diagnosis?"</li></ul></div>
      <div class="mb-3"><strong>Treatment History & Daily Routines:</strong><ul class="small mt-1"><li>"Since your diagnosis, what different treatments have you tried?"</li><li>"Tell me about a typical day managing your medications."</li><li>"What kind of support have you received from family or health workers?"</li></ul></div>
      <div class="mb-3"><strong>Integration Perspectives:</strong><ul class="small mt-1"><li>"Have you ever thought about combining conventional medication with herbal remedies?"</li><li>"If a healthcare provider advised a combined approach, would you be open to it?"</li></ul></div>` },
    clinician: { title: 'Clinician Interview Guide', content: `
      <h6 class="text-white">Objective:</h6><p>Explore professional insights on treatment practices, patient behaviours, and openness to integrative strategies.</p>
      <h6 class="text-white mt-3">Key Prompts:</h6>
      <div class="mb-3"><strong>Current Practice:</strong><ul class="small mt-1"><li>"What are your most common treatment approaches for hypertension?"</li><li>"What have you noticed about patients' adherence to treatment plans?"</li></ul></div>
      <div class="mb-3"><strong>Alternative Therapies:</strong><ul class="small mt-1"><li>"What patterns have you observed in patients' use of herbal remedies?"</li></ul></div>
      <div class="mb-3"><strong>Integration Views:</strong><ul class="small mt-1"><li>"What are your professional views on integrating herbal interventions?"</li><li>"How open would you be to using digital tools for patient tracking?"</li></ul></div>` },
    herbalist: { title: 'Herbalist Interview Guide', content: `
      <h6 class="text-white">Objective:</h6><p>Capture knowledge of herbal care practices, patient patterns, and attitudes toward collaboration.</p>
      <h6 class="text-white mt-3">Key Prompts:</h6>
      <div class="mb-3"><strong>Common Treatments:</strong><ul class="small mt-1"><li>"Which specific herbs do you commonly use for managing high blood pressure?"</li><li>"Can you describe a typical client who comes to you for hypertension?"</li></ul></div>
      <div class="mb-3"><strong>Integration & Collaboration:</strong><ul class="small mt-1"><li>"What are your thoughts on conventional hospital-based hypertension treatment?"</li><li>"Would you be willing to collaborate with clinics in a shared-care model?"</li></ul></div>
      <div class="mb-3"><strong>Digital Tools:</strong><ul class="small mt-1"><li>"How would you feel about recording patient data digitally?"</li></ul></div>` },
    caregiver: { title: 'Caregiver Interview Guide', content: `
      <h6 class="text-white">Objective:</h6><p>Understand the role of caregivers in supporting hypertensive patients and their beliefs about treatment.</p>
      <h6 class="text-white mt-3">Key Prompts:</h6>
      <div class="mb-3"><strong>Care Role & Support:</strong><ul class="small mt-1"><li>"What kind of support do you provide to the person you care for who has hypertension?"</li><li>"Do you help with medication reminders or monitoring symptoms?"</li></ul></div>
      <div class="mb-3"><strong>Treatment Beliefs:</strong><ul class="small mt-1"><li>"What are your thoughts on using conventional medicines versus herbs?"</li><li>"Can you describe your interactions with health workers or herbalists?"</li></ul></div>
      <div class="mb-3"><strong>Integration Support:</strong><ul class="small mt-1"><li>"Would you support your relative in trying a combined treatment approach?"</li></ul></div>` },
    policymaker: { title: 'Policymaker Interview Guide', content: `
      <h6 class="text-white">Objective:</h6><p>Understand policy perspectives on integrating digital health solutions and traditional medicine in hypertension management.</p>
      <h6 class="text-white mt-3">Key Prompts:</h6>
      <div class="mb-3"><strong>Policy Environment:</strong><ul class="small mt-1"><li>"What are current policies regarding traditional medicine integration in Ghana's health system?"</li><li>"How familiar are you with digital health innovations for NCDs?"</li></ul></div>
      <div class="mb-3"><strong>Implementation Challenges:</strong><ul class="small mt-1"><li>"What challenges do you foresee in implementing personalized digital health solutions?"</li><li>"What regulatory changes would support safe integration of treatments?"</li></ul></div>
      <div class="mb-3"><strong>Digital Health Views:</strong><ul class="small mt-1"><li>"How do you view the role of digital platforms in healthcare delivery?"</li></ul></div>` },
    researcher: { title: 'Researcher Interview Guide', content: `
      <h6 class="text-white">Objective:</h6><p>Understand researchers' experiences, perspectives, and attitudes toward studying hypertension and treatment practices in Ghana.</p>
      <h6 class="text-white mt-3">Key Prompts:</h6>
      <div class="mb-3"><strong>Research Focus & Experience:</strong><ul class="small mt-1"><li>"Can you tell me about your research on hypertension or related health issues?"</li><li>"What motivated you to focus on hypertension research?"</li></ul></div>
      <div class="mb-3"><strong>Treatment Observations:</strong><ul class="small mt-1"><li>"What have you observed about how communities manage hypertension?"</li><li>"How do you view conventional medicines versus herbal remedies?"</li></ul></div>
      <div class="mb-3"><strong>Research Environment & Digital Tools:</strong><ul class="small mt-1"><li>"What challenges have you faced conducting hypertension research in Ghana?"</li><li>"What role can digital platforms play in collecting research data?"</li></ul></div>` }
  };
  const guide = guides[type];
  if (guide && body) { body.innerHTML = `<h6 class="text-white">${guide.title}</h6>` + guide.content; }
}

// Simple CSV helpers reused by buttons
export function generateParticipantsCSV() {
  const headers = ['Participant ID','Type','Study Site','Initials','Age Range','Gender','Contact Number','Preferred Contact','Eligible','Date Screened','Interview Completed'];
  let csv = headers.join(',') + '\n';
  appState.participants.forEach(p => {
    const row = [p.id,p.type,p.studySite||'',`"${p.fullName}"`,p.ageRange,p.gender,p.contactNumber||'',p.preferredContact||'',p.isEligible?'Yes':'No',new Date(p.dateScreened).toLocaleDateString(),p.interviewCompleted?'Yes':'No'];
    csv += row.join(',') + '\n';
  });
  return csv;
}

export function generateInterviewsCSV() {
  const headers = ['Interview ID','Participant ID','Type','Notes','Timestamp','Completed'];
  let csv = headers.join(',') + '\n';
  appState.interviews.forEach(i => {
    const row = [i.id,i.participantId,i.type,`"${(i.notes||'').replace(/"/g,'""')}"`,new Date(i.timestamp).toLocaleDateString(),i.completed?'Yes':'No'];
    csv += row.join(',') + '\n';
  });
  return csv;
}
