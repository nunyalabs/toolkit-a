// main.js - bootstrap app and wire modules
import { appState, loadStoredData } from './storage.js';
import { setupParticipantTypeHandlers, attachScreeningFormHandler, saveParticipant, clearForm, setupFilters, renderParticipantsList } from './participants.js';
import { loadParticipantsForInterview, saveInterview, completeInterview, setupInterviewAutosave, setupInterviewShortcuts, showGuideModal, generateParticipantsCSV, generateInterviewsCSV } from './idi.js';
import { loadParticipantsForFGD, saveFGD, completeFGD, populateFGDGuide } from './fgd.js';
import { toggleRecording, startRecording, stopRecording, pauseRecording, downloadRecording } from './audio.js';
import { updateDashboard } from './dashboard.js';
import { registerServiceWorker, setupInstallPrompt } from './pwa.js';

// Theme handling
const THEME_KEY = 'toolkit.theme';
const MODE_KEY = 'toolkit.mode';
const THEMES = {
  'warm':        { start: '#f89b1b', end: '#d72c18', accent: '#e94435' },
  'medium-sky':  { start: '#0f82dc', end: '#026ac6', accent: '#0f82dc' },
  'deep-blue':   { start: '#026ac6', end: '#014b91', accent: '#026ac6' },
  'cyan':        { start: '#00dfd0', end: '#00bfb2', accent: '#00dfd0' },
  'leaf-green':  { start: '#73a538', end: '#004600', accent: '#73a538' }
};

function applyTheme(themeName) {
  const theme = THEMES[themeName] || THEMES['warm'];
  document.documentElement.style.setProperty('--bg-start', theme.start);
  document.documentElement.style.setProperty('--bg-end', theme.end);
  document.documentElement.style.setProperty('--accent-color', theme.accent || theme.start);
  localStorage.setItem(THEME_KEY, themeName);
  // Update meta theme-color for mobile status bar to match start color
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'theme-color'); document.head.appendChild(meta); }
  meta.setAttribute('content', theme.start);
}

function applyMode(mode) {
  const m = (mode === 'light' || mode === 'dark') ? mode : 'dark';
  document.body.setAttribute('data-mode', m);
  localStorage.setItem(MODE_KEY, m);
}

function setupThemeMenu() {
  // Theme items
  const themeItems = document.querySelectorAll('.dropdown-menu [data-theme]');
  themeItems.forEach(item => item.addEventListener('click', (e) => {
    e.preventDefault();
    const chosen = item.getAttribute('data-theme');
    applyTheme(chosen);
  }));
  // Mode items
  const modeItems = document.querySelectorAll('.dropdown-menu [data-mode]');
  modeItems.forEach(item => item.addEventListener('click', (e) => {
    e.preventDefault();
    const mode = item.getAttribute('data-mode');
    applyMode(mode);
  }));
  // Load persisted selections (defaults: HPI warm + dark)
  const savedTheme = localStorage.getItem(THEME_KEY) || 'warm';
  const savedMode = localStorage.getItem(MODE_KEY) || 'dark';
  applyTheme(savedTheme);
  applyMode(savedMode);
}

function initializeNavigation() {
  const navLinks = document.querySelectorAll('#mainNav .nav-link');
  const sections = document.querySelectorAll('.content-section');
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetSection = this.dataset.section;
      navLinks.forEach(nl => nl.classList.remove('active'));
      this.classList.add('active');
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetSection) section.classList.add('active');
      });
      if (targetSection === 'interview') {
        loadParticipantsForInterview();
        loadParticipantsForFGD();
      }
      else if (targetSection === 'participants') renderParticipantsList();
    });
  });
}

function adjustForMobile() {
  const isMobile = window.innerWidth < 768;
  if (isMobile) document.body.classList.add('mobile-view');
  else document.body.classList.remove('mobile-view');
}

function setupTouchNav() {
  let touchStartX, touchStartY;
  document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; });
  document.addEventListener('touchend', e => {
    if (!touchStartX || !touchStartY) return;
    const touchEndX = e.changedTouches[0].clientX; const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX; const diffY = touchStartY - touchEndY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
      const currentNav = document.querySelector('#mainNav .nav-link.active');
      const navLinks = Array.from(document.querySelectorAll('#mainNav .nav-link'));
      const currentIndex = navLinks.indexOf(currentNav);
      if (diffX > 0 && currentIndex < navLinks.length - 1) navLinks[currentIndex + 1].click();
      else if (diffX < 0 && currentIndex > 0) navLinks[currentIndex - 1].click();
    }
    touchStartX = null; touchStartY = null;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  setupThemeMenu();
  loadStoredData();
  updateDashboard();
  setupParticipantTypeHandlers();
  attachScreeningFormHandler();
  setupFilters();
  setupInterviewAutosave();
  setupInterviewShortcuts();
  registerServiceWorker();
  setupInstallPrompt();
  adjustForMobile();
  window.addEventListener('resize', adjustForMobile);

  // Show/hide study site "Other" input
  const siteSelect = document.getElementById('studySite');
  const siteOther = document.getElementById('studySiteOther');
  if (siteSelect && siteOther) {
    const toggleOther = () => {
      if (siteSelect.value === 'other') {
        siteOther.classList.remove('d-none');
        siteOther.focus();
      } else {
        siteOther.classList.add('d-none');
        siteOther.value = '';
      }
    };
    siteSelect.addEventListener('change', toggleOther);
    toggleOther();
  }

  // Refresh tab-specific data when switching between IDI and FGD tabs
  const idiTabBtn = document.getElementById('idi-tab');
  const fgdTabBtn = document.getElementById('fgd-tab');
  if (idiTabBtn) {
    idiTabBtn.addEventListener('shown.bs.tab', () => {
      loadParticipantsForInterview();
    });
  }
  if (fgdTabBtn) {
    fgdTabBtn.addEventListener('shown.bs.tab', () => {
      loadParticipantsForFGD();
      populateFGDGuide();
    });
  }

  // Change handlers for FGD group type
  const fgdType = document.getElementById('fgdGroupType');
  if (fgdType) {
    fgdType.addEventListener('change', () => {
      populateFGDGuide();
      loadParticipantsForFGD();
    });
  }
});

// Expose minimal API for onclick attributes in HTML
window.toggleRecording = toggleRecording;
window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.pauseRecording = pauseRecording;
window.downloadRecording = downloadRecording;
window.saveInterview = (mode) => mode === 'fgd' ? saveFGD() : saveInterview('idi');
window.completeInterview = (mode) => mode === 'fgd' ? completeFGD() : completeInterview('idi');
window.showGuideModal = showGuideModal;
window.clearForm = clearForm;
window.downloadData = function (type) {
  if (type === 'participants') {
    const csv = generateParticipantsCSV();
    downloadCSV(csv, `participants_${new Date().toISOString().split('T')[0]}.csv`);
  } else if (type === 'interviews') {
    const csv = generateInterviewsCSV();
    downloadCSV(csv, `interviews_${new Date().toISOString().split('T')[0]}.csv`);
  } else if (type === 'audio') {
    alert('Audio files are stored locally for this demo.');
  }
};

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.href = url; link.download = filename; link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
}

// Optional: expose clearAllData
window.HypertensionResearchApp = {
  getParticipants: () => appState.participants,
  getInterviews: () => appState.interviews,
  exportData: (type) => window.downloadData(type),
  clearAllData: () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      appState.participants = [];
      appState.interviews = [];
      appState.audioRecordings = [];
      localStorage.removeItem('hypertensionResearchData');
      updateDashboard();
      renderParticipantsList();
      alert('All data has been cleared.');
    }
  }
};

console.log('Hypertension Research Toolkit initialized (modular)');
