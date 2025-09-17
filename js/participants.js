// participants.js - screening, eligibility, list, filters
import { appState, saveToStorage } from './storage.js';
import { updateDashboard } from './dashboard.js';

export function setupParticipantTypeHandlers() {
  const participantTypeSelect = document.getElementById('participantType');
  if (!participantTypeSelect) return;
  participantTypeSelect.addEventListener('change', function () {
    updateEligibilityCriteria(this.value);
    generateParticipantId(this.value);
  });
}

export function generateParticipantId(type) {
  const prefixes = { patient: 'PAT', clinician: 'CLN', herbalist: 'HRB', caregiver: 'CG', policymaker: 'POL', researcher: 'RES' };
  const prefix = prefixes[type] || 'PAR';
  const count = appState.participants.filter(p => p.type === type).length + 1;
  const id = `${prefix}${count.toString().padStart(3, '0')}`;
  const pid = document.getElementById('participantId');
  if (pid) pid.value = id;
}

export function updateEligibilityCriteria(type) {
  const container = document.getElementById('eligibilityCriteria');
  if (!container) return;
  const criteria = {
    patient: [
      'Aged 18 years or older',
      'Clinically diagnosed with hypertension (≥6 months)',
      'Currently using conventional and/or herbal treatments',
      'Owns or has regular access to a smartphone',
      'Willing to participate in digital N-of-1 trial',
      'Able to provide informed consent'
    ],
    clinician: [
      'Aged 18 years or older',
      'Registered/licensed medical professional in Ghana',
      '≥6 months experience managing hypertensive patients',
      'Located in Eastern Region and currently practicing',
      'Comfortable with digital or mobile platforms',
      'Willing to participate in interviews/workshops',
      'Able to provide informed consent'
    ],
    herbalist: [
      'Aged 18 years or older',
      'Identifies as a traditional/herbal practitioner',
      '≥6 months experience treating hypertension',
      'Located in Eastern Region and serving local clients',
      'Open to discussing treatment practices in research setting',
      'Willing to engage in co-design or interviews',
      'Able to provide informed consent'
    ],
    caregiver: [
      'Aged 18 years or older',
      'Provides regular support to a person diagnosed with hypertension',
      'Has been involved in caregiving for ≥3 months',
      'Aware of the patient\'s treatment behaviours',
      'Located in Eastern Region and reachable for interview',
      'Comfortable speaking about caregiving experiences',
      'Able to provide informed consent'
    ],
    policymaker: [
      'Aged 18 years or older',
      'Holds a relevant role in policy, regulation, or planning',
      'Currently active in Ghana\'s health or NCD-related sectors',
      'Familiar with digital health, innovation, or NCD policy',
      'Willing to participate in stakeholder dialogue',
      'Able to provide informed consent'
    ],
    researcher: [
      'Aged 18 years or older',
      'Holds a degree in public health, social sciences, medicine, or related field',
      'Experience (≥6 months) conducting health-related research in Ghana',
      'Based in or actively conducting research in the Eastern Region',
      'Familiar with digital data collection or mobile platforms',
      'Willing to participate in interviews/workshops',
      'Able to provide informed consent'
    ]
  };
  if (criteria[type]) {
    let html = '<div class="d-flex justify-content-between align-items-center mb-2">\n      <h6 class="text-white mb-0">Eligibility Criteria</h6>\n      <button type="button" class="btn btn-sm btn-outline-light" id="criteriaSelectAll">Select All: Yes</button>\n    </div>';
    criteria[type].forEach((criterion, index) => {
      html += `
        <div class="row mb-2 align-items-center">
          <div class="col-8 col-md-9">
            <small class="text-white-50">${criterion}</small>
          </div>
          <div class="col-4 col-md-3">
            <div class="btn-group btn-group-sm w-100" role="group">
              <input type="radio" class="btn-check" name="criteria_${index}" id="yes_${index}" value="yes">
              <label class="btn btn-outline-success" for="yes_${index}">Yes</label>
              <input type="radio" class="btn-check" name="criteria_${index}" id="no_${index}" value="no">
              <label class="btn btn-outline-danger" for="no_${index}">No</label>
            </div>
          </div>
        </div>`;
    });
    container.innerHTML = html;
    const selectAll = document.getElementById('criteriaSelectAll');
    if (selectAll) {
      selectAll.addEventListener('click', () => {
        const yesRadios = container.querySelectorAll('input[type="radio"][value="yes"]');
        yesRadios.forEach(r => { r.checked = true; r.dispatchEvent(new Event('change')); });
      });
    }
  } else {
    container.innerHTML = '';
  }
}

export function attachScreeningFormHandler() {
  const form = document.getElementById('screeningForm');
  if (!form) return;
  form.addEventListener('submit', e => { e.preventDefault(); saveParticipant(); });
}

export function saveParticipant() {
  const eligibilityCriteria = [];
  document.querySelectorAll('#eligibilityCriteria input[type="radio"]:checked').forEach(input => {
    eligibilityCriteria.push({ question: input.name, answer: input.value });
  });

  const isEligible = eligibilityCriteria.length > 0 && eligibilityCriteria.every(i => i.answer === 'yes');
  const participant = {
    id: document.getElementById('participantId')?.value || '',
    type: document.getElementById('participantType')?.value || '',
    studySite: (() => { const v = document.getElementById('studySite')?.value || ''; if (v === 'other') { return document.getElementById('studySiteOther')?.value || 'Other'; } return v; })(),
    fullName: document.getElementById('initials')?.value || '',
    ageRange: document.getElementById('ageRange')?.value || '',
    gender: document.getElementById('gender')?.value || '',
    contactNumber: document.getElementById('contactNumber')?.value || '',
    preferredContact: document.getElementById('preferredContact')?.value || '',
    eligibilityCriteria,
    isEligible,
    dateScreened: new Date().toISOString(),
    interviewCompleted: false
  };
  appState.participants.push(participant);
  saveToStorage();
  updateDashboard();
  alert(`Participant ${participant.id} has been ${isEligible ? 'enrolled as eligible' : 'marked as not eligible'}.`);
  clearForm();
}

export function clearForm() {
  document.getElementById('screeningForm')?.reset();
  const ec = document.getElementById('eligibilityCriteria');
  if (ec) ec.innerHTML = '';
  const pid = document.getElementById('participantId');
  if (pid) pid.value = '';
}

export function setupFilters() {
  const filterType = document.getElementById('filterType');
  const filterStatus = document.getElementById('filterStatus');
  const searchInput = document.getElementById('searchParticipants');
  [filterType, filterStatus, searchInput].forEach(el => {
    if (el) {
      el.addEventListener('change', renderParticipantsList);
      el.addEventListener('input', renderParticipantsList);
    }
  });
}

export function renderParticipantsList() {
  const container = document.getElementById('participantsList');
  if (!container) return;
  const filterType = document.getElementById('filterType')?.value || '';
  const filterStatus = document.getElementById('filterStatus')?.value || '';
  const searchTerm = (document.getElementById('searchParticipants')?.value || '').toLowerCase();

  const filtered = appState.participants.filter(p => {
    const matchesType = !filterType || p.type === filterType;
    const matchesStatus = !filterStatus || (filterStatus === 'eligible' && p.isEligible) || (filterStatus === 'not-eligible' && !p.isEligible);
    const matchesSearch = !searchTerm || p.fullName.toLowerCase().includes(searchTerm) || p.id.toLowerCase().includes(searchTerm);
    return matchesType && matchesStatus && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center text-white-50 py-5">
        <i class="bi bi-search fs-1 mb-3 d-block"></i>
        <p>No participants found matching your criteria.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const statusClass = p.isEligible ? 'status-eligible' : 'status-not-eligible';
    const statusText = p.isEligible ? 'Eligible' : 'Not Eligible';
    const interviewStatus = p.interviewCompleted ? '<i class="bi bi-check-circle text-success ms-2"></i>' : '<i class="bi bi-clock text-warning ms-2"></i>';
    return `
      <div class="participant-item">
        <div class="row align-items-center">
          <div class="col-12 col-md-8">
            <div class="d-flex align-items-center">
              <div>
                <h6 class="text-white mb-1">${p.fullName}</h6>
                <small class="text-white-50">${p.id} • ${p.type.charAt(0).toUpperCase() + p.type.slice(1)} • ${p.ageRange} • ${p.gender}</small>
              </div>
              ${interviewStatus}
            </div>
          </div>
          <div class="col-12 col-md-4 text-md-end mt-2 mt-md-0">
            <span class="status-badge ${statusClass}">${statusText}</span>
            <div class="mt-1"><small class="text-white-50">Screened: ${new Date(p.dateScreened).toLocaleDateString()}</small></div>
          </div>
        </div>
      </div>`;
  }).join('');
}
