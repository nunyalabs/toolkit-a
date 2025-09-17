// dashboard.js - dashboard metrics and DOM updates
import { appState } from './storage.js';

export function updateDashboard() {
  const totalParticipants = appState.participants.length;
  const eligibleCount = appState.participants.filter(p => p.isEligible).length;
  const notEligibleCount = appState.participants.filter(p => !p.isEligible).length;
  const interviewsCompleted = appState.participants.filter(p => p.interviewCompleted).length;
  const countBy = type => appState.participants.filter(p => p.type === type).length;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('totalParticipants', totalParticipants);
  setText('eligibleCount', eligibleCount);
  setText('interviewsCompleted', interviewsCompleted);
  setText('notEligibleCount', notEligibleCount);
  setText('patientCount', countBy('patient'));
  setText('clinicianCount', countBy('clinician'));
  setText('herbalistCount', countBy('herbalist'));
  setText('caregiverCount', countBy('caregiver'));
  setText('policymakerCount', countBy('policymaker'));
  setText('researcherCount', countBy('researcher'));
}
