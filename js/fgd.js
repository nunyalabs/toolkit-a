// fgd.js - FGD specific logic
import { appState, saveToStorage } from './storage.js';
import { updateDashboard } from './dashboard.js';

export function loadParticipantsForFGD() {
  const select = document.getElementById('fgdParticipants');
  const typeSel = document.getElementById('fgdGroupType');
  if (!select) return;
  const filterType = typeSel?.value || '';
  select.innerHTML = '';
  appState.participants
    .filter(p => p.isEligible)
    .filter(p => !filterType || filterType === 'mixed' || p.type === filterType)
    .forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.id} - ${p.fullName} (${p.type})`;
      select.appendChild(opt);
    });
}

export function saveFGD() {
  const select = document.getElementById('fgdParticipants');
  const selected = Array.from(select?.selectedOptions || []).map(o => o.value);
  const notes = document.getElementById('fgdNotes')?.value || '';
  const groupType = document.getElementById('fgdGroupType')?.value || '';
  const groupName = document.getElementById('fgdGroupName')?.value || '';
  if (selected.length === 0) { alert('Please select at least one participant.'); return; }
  const interview = { id: `FGD_${Date.now()}`, participantId: selected.join('|'), type: 'fgd', groupType, groupName, notes, timestamp: new Date().toISOString(), completed: false };
  appState.interviews.push(interview);
  saveToStorage();
  updateDashboard();
  alert('FGD notes saved successfully!');
}

export function completeFGD() {
  saveFGD();
  alert('FGD completed successfully!');
  const notes = document.getElementById('fgdNotes'); if (notes) notes.value = '';
  const select = document.getElementById('fgdParticipants'); if (select) select.selectedIndex = -1;
}

export function populateFGDGuide() {
  const typeSel = document.getElementById('fgdGroupType');
  const container = document.getElementById('fgdGuideContent');
  if (!container) return;
  const guides = {
    patient: `<h6 class="text-white">FGD Guide: Hypertensive Patients</h6>
      <div class="mb-2"><strong>Icebreaker:</strong> <span class="small d-block">“Please introduce yourself and share one thing you do to keep your blood pressure under control.”</span></div>
      <div class="mb-2"><strong>Group Norms:</strong>
        <ul class="small mb-1"><li>Speak one at a time</li><li>Respect everyone’s views</li><li>You can skip any question</li><li>Everything stays confidential</li></ul>
      </div>
      <div class="mb-2"><strong>Discussion Prompts</strong>
        <ol class="small mb-1">
          <li><strong>Diagnosis and Treatment Journey</strong>
            <ul><li>How did you first learn you had high blood pressure?</li><li>What treatments have you tried (hospital, herbs, prayer, etc.)?</li></ul>
          </li>
          <li><strong>Perceptions and Beliefs</strong>
            <ul><li>What do you believe causes high BP?</li><li>What helps control it best in your experience?</li></ul>
          </li>
          <li><strong>Integration Thoughts</strong>
            <ul><li>Have you ever used both hospital medicine and herbs at the same time?</li><li>Would you be open to a care plan that combines both?</li></ul>
          </li>
          <li><strong>Personalisation</strong>
            <ul><li>Do you feel your current treatment is made just for you, or is it standard for everyone?</li><li>Would you want to track what works best for you with a mobile app?</li></ul>
          </li>
        </ol>
      </div>
      <div class="mb-2"><strong>Optional Activity:</strong> <span class="small d-block">Use cards: “hospital drugs,” “herbs,” “prayer,” “exercise,” “diet change.” Ask: “Which of these do you trust the most? Why?”</span></div>
      <div class="mb-2"><strong>Closing:</strong> <span class="small d-block">“Thank you for your time. What advice would you give us to make this study more helpful for people like you?”</span></div>`,
    clinician: `<h6 class="text-white">FGD Guide: Clinicians</h6>
      <div class="mb-2"><strong>Objective:</strong> <span class="small d-block">Explore professional insights on treatment practices, patient behaviours, and openness to integrative strategies.</span></div>
      <div class="mb-2"><strong>Opening:</strong>
        <ul class="small mb-1"><li><em>Icebreaker:</em> “Please introduce yourself and share how long you’ve worked with patients who have hypertension.”</li>
        <li><em>Group Norms:</em> “Speak one at a time, this is a confidential professional discussion, you can decline any question.”</li></ul>
      </div>
      <div class="mb-2"><strong>Discussion Prompts</strong>
        <ol class="small mb-1">
          <li><strong>Treatment Approaches & Patient Response</strong>
            <ul><li>Common treatment plans and patient responses.</li><li>Key factors influencing adherence/non-adherence.</li></ul>
          </li>
          <li><strong>Observations of Patient Practices</strong>
            <ul><li>Use of herbs, spiritual care, or alternatives alongside prescriptions; how you address it.</li></ul>
          </li>
          <li><strong>Views on Formal Integration</strong>
            <ul><li>Benefits and challenges of integrating traditional/herbal practices into care.</li></ul>
          </li>
          <li><strong>Personalized Care & Digital Tools</strong>
            <ul><li>Feasibility of N-of-1 digital tools; resources/support clinicians would need.</li></ul>
          </li>
        </ol>
      </div>
      <div class="mb-2"><strong>Optional Activity:</strong> <span class="small d-block">Role-play: addressing a patient’s disclosure of herbal remedy use.</span></div>
      <div class="mb-2"><strong>Closing:</strong> <span class="small d-block">“What policy/system changes would most help personalized and holistic care?”</span></div>`,
    herbalist: `<h6 class="text-white">FGD Guide: Herbal Practitioners</h6>
      <div class="mb-2"><strong>Objective:</strong> <span class="small d-block">Capture knowledge of herbal care practices, patient patterns, and attitudes to collaboration with biomedical care.</span></div>
      <div class="mb-2"><strong>Opening:</strong>
        <ul class="small mb-1"><li><em>Icebreaker:</em> “Please introduce yourself and share how many years you’ve treated people with hypertension.”</li>
        <li><em>Group Norms:</em> Respect each other’s practice; voluntary participation; confidentiality.</li></ul>
      </div>
      <div class="mb-2"><strong>Discussion Prompts</strong>
        <ol class="small mb-1">
          <li><strong>Herbal Practices</strong>
            <ul><li>Specific herbs/methods used; tailoring approaches for individuals.</li></ul>
          </li>
          <li><strong>Patient Experiences & Observations</strong>
            <ul><li>Clients using conventional medicine alongside; reported experiences.</li></ul>
          </li>
          <li><strong>Views on Integration</strong>
            <ul><li>Willingness to work with hospitals; hopes and concerns for collaboration.</li></ul>
          </li>
          <li><strong>Personalized Care & Tracking</strong>
            <ul><li>How effectiveness is determined; openness to digital tracking tools.</li></ul>
          </li>
        </ol>
      </div>
      <div class="mb-2"><strong>Optional Activity:</strong> <span class="small d-block">Card Sorting: e.g., “ginger,” “garlic,” “BP tablets,” “exercise.” Sort by “used most” vs “works best.”</span></div>
      <div class="mb-2"><strong>Closing:</strong> <span class="small d-block">“What single most important thing would make collaboration with hospitals easier?”</span></div>`,
    caregiver: `<h6 class="text-white">FGD Guide: Caregivers</h6>
      <div class="mb-2"><strong>Objective:</strong> <span class="small d-block">Understand caregivers’ support roles and beliefs about treatment.</span></div>
      <div class="mb-2"><strong>Opening:</strong>
        <ul class="small mb-1"><li><em>Icebreaker:</em> “Please introduce yourself and share how you support the person you care for.”</li>
        <li><em>Group Norms:</em> Safe, supportive, confidential; no right/wrong answers.</li></ul>
      </div>
      <div class="mb-2"><strong>Discussion Prompts</strong>
        <ol class="small mb-1">
          <li><strong>Caregiving Role</strong>
            <ul><li>Daily support to manage BP; involvement in treatment decisions.</li></ul>
          </li>
          <li><strong>Beliefs and Observations</strong>
            <ul><li>Treatments used (hospital, herbs, others); observed benefits/challenges.</li></ul>
          </li>
          <li><strong>Thoughts on Combined Care</strong>
            <ul><li>Support for combined hospital+herbal approach; concerns or positives.</li></ul>
          </li>
          <li><strong>Digital Support & Personalization</strong>
            <ul><li>Would mobile tracking help? What training/support would be needed?</li></ul>
          </li>
        </ol>
      </div>
      <div class="mb-2"><strong>Optional Activity:</strong> <span class="small d-block">Tool Icon Review: pill box, herbal tea, doctor, mobile app—point to most used and most needed support.</span></div>
      <div class="mb-2"><strong>Closing:</strong> <span class="small d-block">“What do caregivers need most to help relatives manage hypertension?”</span></div>`,
    policymaker: `<h6 class="text-white">Policymakers FGD Guide</h6>
      <p>Explore policy landscape for blending conventional and traditional care and digital health.</p>
      <ul><li>Regulatory frameworks</li><li>Quality/safety standards</li><li>Scale-up constraints</li><li>Data governance</li></ul>`,
    researcher: `<h6 class="text-white">Researchers FGD Guide</h6>
      <p>Discuss research operations and needs in studying integrated hypertension care.</p>
      <ul><li>Methodological challenges</li><li>Recruitment and ethics</li><li>Digital data collection</li><li>Collaboration needs</li></ul>`,
    mixed: `<h6 class="text-white">Mixed Group FGD Guide</h6>
      <p>Facilitate cross-stakeholder dialogue on integration, safety, and coordination.</p>
      <ul><li>Shared goals and tensions</li><li>Coordination protocols</li><li>Safety and monitoring</li><li>Data sharing and trust</li></ul>`
  };
  const key = typeSel?.value || 'mixed';
  container.innerHTML = guides[key] || guides['mixed'];
}
