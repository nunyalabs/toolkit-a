// storage.js - central app state and persistence helpers
export const appState = {
  participants: [],
  interviews: [],
  audioRecordings: []
};

export function saveToStorage() {
  const dataToSave = {
    participants: appState.participants,
    interviews: appState.interviews,
    audioCount: appState.audioRecordings.length
  };
  localStorage.setItem('hypertensionResearchData', JSON.stringify(dataToSave));
}

export function loadStoredData() {
  const stored = localStorage.getItem('hypertensionResearchData');
  if (stored) {
    const data = JSON.parse(stored);
    appState.participants = data.participants || [];
    appState.interviews = data.interviews || [];
  }
}
