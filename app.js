// Application state
let appState = {
	participants: [],
	interviews: [],
	audioRecordings: [],
	currentRecording: null,
	mediaRecorder: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', function () {
	initializeNavigation();
	loadStoredData();
	updateDashboard();
	setupParticipantTypeHandlers();
	setupFilters();
	registerServiceWorker();
	setupInstallPrompt();
	adjustForMobile();
});

// Navigation handler
function initializeNavigation() {
	const navLinks = document.querySelectorAll('#mainNav .nav-link');
	const sections = document.querySelectorAll('.content-section');

	navLinks.forEach(link => {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			const targetSection = this.dataset.section;

			// Update nav active state
			navLinks.forEach(nl => nl.classList.remove('active'));
			this.classList.add('active');

			// Show target section
			sections.forEach(section => {
				section.classList.remove('active');
				if (section.id === targetSection) {
					section.classList.add('active');
				}
			});

			if (targetSection === 'interview') {
				loadParticipantsForInterview();
			} else if (targetSection === 'participants') {
				renderParticipantsList();
			}
		});
	});
}

// Participant type change handler
function setupParticipantTypeHandlers() {
	const participantTypeSelect = document.getElementById('participantType');
	if (!participantTypeSelect) return;
	participantTypeSelect.addEventListener('change', function () {
		updateEligibilityCriteria(this.value);
		generateParticipantId(this.value);
	});
}

// Generate participant ID
function generateParticipantId(type) {
	const prefixes = {
		'patient': 'PAT',
		'clinician': 'CLN',
		'herbalist': 'HRB',
		'caregiver': 'CG',
		'policymaker': 'POL',
		'researcher': 'RES'
	};
	const prefix = prefixes[type] || 'PAR';
	const count = appState.participants.filter(p => p.type === type).length + 1;
	const id = `${prefix}${count.toString().padStart(3, '0')}`;
	const pid = document.getElementById('participantId');
	if (pid) pid.value = id;
}

// Update eligibility criteria based on participant type
function updateEligibilityCriteria(type) {
	const criteriaContainer = document.getElementById('eligibilityCriteria');
	if (!criteriaContainer) return;

	const criteriaData = {
		'patient': [
			'Aged 18 years or older',
			'Clinically diagnosed with hypertension (≥6 months)',
			'Currently using conventional and/or herbal treatments',
			'Owns or has regular access to a smartphone',
			'Willing to participate in digital N-of-1 trial',
			'Able to provide informed consent'
		],
		'clinician': [
			'Aged 18 years or older',
			'Registered/licensed medical professional in Ghana',
			'≥6 months experience managing hypertensive patients',
			'Located in Eastern Region and currently practicing',
			'Comfortable with digital or mobile platforms',
			'Willing to participate in interviews/workshops',
			'Able to provide informed consent'
		],
		'herbalist': [
			'Aged 18 years or older',
			'Identifies as a traditional/herbal practitioner',
			'≥6 months experience treating hypertension',
			'Located in Eastern Region and serving local clients',
			'Open to discussing treatment practices in research setting',
			'Willing to engage in co-design or interviews',
			'Able to provide informed consent'
		],
		'caregiver': [
			'Aged 18 years or older',
			'Provides regular support to a person diagnosed with hypertension',
			'Has been involved in caregiving for ≥3 months',
			'Aware of the patient\'s treatment behaviours',
			'Located in Eastern Region and reachable for interview',
			'Comfortable speaking about caregiving experiences',
			'Able to provide informed consent'
		],
		'policymaker': [
			'Aged 18 years or older',
			'Holds a relevant role in policy, regulation, or planning',
			'Currently active in Ghana\'s health or NCD-related sectors',
			'Familiar with digital health, innovation, or NCD policy',
			'Willing to participate in stakeholder dialogue',
			'Able to provide informed consent'
		],
		'researcher': [
			'Aged 18 years or older',
			'Holds a degree in public health, social sciences, medicine, or related field',
			'Experience (≥6 months) conducting health-related research in Ghana',
			'Based in or actively conducting research in the Eastern Region',
			'Familiar with digital data collection or mobile platforms',
			'Willing to participate in interviews/workshops',
			'Able to provide informed consent'
		]
	};

	if (criteriaData[type]) {
		let html = '<h6 class="text-white mb-3">Eligibility Criteria</h6>';
		criteriaData[type].forEach((criterion, index) => {
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
		criteriaContainer.innerHTML = html;
	} else {
		criteriaContainer.innerHTML = '';
	}
}

// Handle screening form submission
const screeningForm = document.getElementById('screeningForm');
if (screeningForm) {
	screeningForm.addEventListener('submit', function (e) {
		e.preventDefault();
		saveParticipant();
	});
}

// Save participant data
function saveParticipant() {
	// Collect eligibility criteria responses
	const eligibilityCriteria = [];
	const criteriaInputs = document.querySelectorAll('#eligibilityCriteria input[type="radio"]:checked');
	criteriaInputs.forEach(input => {
		eligibilityCriteria.push({ question: input.name, answer: input.value });
	});

	const isEligible = criteriaInputs.length > 0 && Array.from(criteriaInputs).every(input => input.value === 'yes');

	const participant = {
		id: document.getElementById('participantId')?.value || '',
		type: document.getElementById('participantType')?.value || '',
		studySite: document.getElementById('studySite')?.value || '',
		fullName: document.getElementById('fullName')?.value || '',
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

function clearForm() {
	document.getElementById('screeningForm')?.reset();
	const ec = document.getElementById('eligibilityCriteria');
	if (ec) ec.innerHTML = '';
	const pid = document.getElementById('participantId');
	if (pid) pid.value = '';
}

// Audio recording
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

function toggleRecording() {
	if (!isRecording) startRecording(); else stopRecording();
}

function startRecording() {
	navigator.mediaDevices.getUserMedia({ audio: true })
		.then(stream => {
			mediaRecorder = new MediaRecorder(stream);
			recordedChunks = [];

			mediaRecorder.ondataavailable = event => { if (event.data.size > 0) recordedChunks.push(event.data); };
			mediaRecorder.onstop = () => {
				const blob = new Blob(recordedChunks, { type: 'audio/webm' });
				const audioUrl = URL.createObjectURL(blob);
				const audioPlayback = document.getElementById('audioPlayback');
				if (audioPlayback) {
					const audio = audioPlayback.querySelector('audio');
					if (audio) audio.src = audioUrl;
					audioPlayback.style.display = 'block';
				}

				const participantId = document.getElementById('interviewParticipant')?.value || '';
				const interviewType = document.getElementById('interviewType')?.value || 'idi';
				appState.audioRecordings.push({ id: `REC_${Date.now()}`, participantId, type: interviewType, blob, url: audioUrl, timestamp: new Date().toISOString(), duration: 0 });
				saveToStorage();
				updateDashboard();
			};

			mediaRecorder.start();
			isRecording = true;
			const recordBtn = document.getElementById('recordBtn');
			if (recordBtn) {
				recordBtn.innerHTML = '<i class="bi bi-stop-circle"></i> Stop Recording';
				recordBtn.classList.remove('btn-danger');
				recordBtn.classList.add('btn-success');
			}
			const rs = document.getElementById('recordingStatus');
			if (rs) rs.innerHTML = '<span class="recording-indicator"><i class="bi bi-record-circle me-2"></i>Recording in progress...</span>';
		})
		.catch(err => { console.error('Error accessing microphone:', err); alert('Unable to access microphone. Please check permissions.'); });
}

function stopRecording() {
	if (mediaRecorder && isRecording) {
		mediaRecorder.stop();
		isRecording = false;
		const recordBtn = document.getElementById('recordBtn');
		if (recordBtn) {
			recordBtn.innerHTML = '<i class="bi bi-record-circle"></i> Start Recording';
			recordBtn.classList.remove('btn-success');
			recordBtn.classList.add('btn-danger');
		}
		const rs = document.getElementById('recordingStatus');
		if (rs) rs.innerHTML = '<small class="text-success"><i class="bi bi-check-circle me-1"></i>Recording completed</small>';
		mediaRecorder.stream.getTracks().forEach(track => track.stop());
	}
}

// Load participants for interview selection
function loadParticipantsForInterview() {
	const select = document.getElementById('interviewParticipant');
	if (!select) return;
	select.innerHTML = '<option value="">Choose participant...</option>';
	appState.participants.filter(p => p.isEligible).forEach(participant => {
		const option = document.createElement('option');
		option.value = participant.id;
		option.textContent = `${participant.id} - ${participant.fullName} (${participant.type})`;
		select.appendChild(option);
	});
}

// Save interview data
function saveInterview() {
	const participantId = document.getElementById('interviewParticipant')?.value;
	const interviewType = document.getElementById('interviewType')?.value || 'idi';
	const notes = document.getElementById('interviewNotes')?.value || '';
	if (!participantId) { alert('Please select a participant first.'); return; }
	const interview = { id: `INT_${Date.now()}`, participantId, type: interviewType, notes, timestamp: new Date().toISOString(), completed: false };
	appState.interviews.push(interview);
	saveToStorage();
	updateDashboard();
	alert('Interview notes saved successfully!');
}

function completeInterview() {
	const participantId = document.getElementById('interviewParticipant')?.value;
	if (!participantId) { alert('Please select a participant first.'); return; }
	saveInterview();
	const participant = appState.participants.find(p => p.id === participantId);
	if (participant) participant.interviewCompleted = true;
	const latestInterview = appState.interviews.filter(i => i.participantId === participantId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
	if (latestInterview) latestInterview.completed = true;
	saveToStorage();
	updateDashboard();
	alert('Interview completed successfully!');
	const select = document.getElementById('interviewParticipant'); if (select) select.value = '';
	const notes = document.getElementById('interviewNotes'); if (notes) notes.value = '';
}

// Guide modal
function showGuideModal(type) {
	const modalEl = document.getElementById('guideModal');
	if (!modalEl) return;
	const modal = new bootstrap.Modal(modalEl);
	const title = document.getElementById('guideModalTitle');
	const body = document.getElementById('guideModalBody');
	const guides = {
		'patient': {
			title: 'Patient Interview Guide',
			content: `
				<h6 class="text-white">Objective:</h6>
				<p>Understand patients' experiences, treatment behaviours, and perspectives on integrating conventional and herbal care.</p>
				<h6 class="text-white mt-3">Key Prompts:</h6>
				<div class="mb-3">
					<strong>Diagnosis Experience:</strong>
					<ul class="small mt-1">
						<li>"Can you walk me through the story of how you were first diagnosed with high blood pressure?"</li>
						<li>"How did you feel when you received the diagnosis?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Treatment History & Daily Routines:</strong>
					<ul class="small mt-1">
						<li>"Since your diagnosis, what different treatments have you tried?"</li>
						<li>"Tell me about a typical day managing your medications."</li>
						<li>"What kind of support have you received from family or health workers?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Integration Perspectives:</strong>
					<ul class="small mt-1">
						<li>"Have you ever thought about combining conventional medication with herbal remedies?"</li>
						<li>"If a healthcare provider advised a combined approach, would you be open to it?"</li>
					</ul>
				</div>`
		},
		'clinician': {
			title: 'Clinician Interview Guide',
			content: `
				<h6 class="text-white">Objective:</h6>
				<p>Explore professional insights on treatment practices, patient behaviours, and openness to integrative strategies.</p>
				<h6 class="text-white mt-3">Key Prompts:</h6>
				<div class="mb-3">
					<strong>Current Practice:</strong>
					<ul class="small mt-1">
						<li>"What are your most common treatment approaches for hypertension?"</li>
						<li>"What have you noticed about patients' adherence to treatment plans?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Alternative Therapies:</strong>
					<ul class="small mt-1">
						<li>"What patterns have you observed in patients' use of herbal remedies?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Integration Views:</strong>
					<ul class="small mt-1">
						<li>"What are your professional views on integrating herbal interventions?"</li>
						<li>"How open would you be to using digital tools for patient tracking?"</li>
					</ul>
				</div>`
		},
		'herbalist': {
			title: 'Herbalist Interview Guide',
			content: `
				<h6 class="text-white">Objective:</h6>
				<p>Capture knowledge of herbal care practices, patient patterns, and attitudes toward collaboration.</p>
				<h6 class="text-white mt-3">Key Prompts:</h6>
				<div class="mb-3">
					<strong>Common Treatments:</strong>
					<ul class="small mt-1">
						<li>"Which specific herbs do you commonly use for managing high blood pressure?"</li>
						<li>"Can you describe a typical client who comes to you for hypertension?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Integration & Collaboration:</strong>
					<ul class="small mt-1">
						<li>"What are your thoughts on conventional hospital-based hypertension treatment?"</li>
						<li>"Would you be willing to collaborate with clinics in a shared-care model?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Digital Tools:</strong>
					<ul class="small mt-1">
						<li>"How would you feel about recording patient data digitally?"</li>
					</ul>
				</div>`
		},
		'caregiver': {
			title: 'Caregiver Interview Guide',
			content: `
				<h6 class="text-white">Objective:</h6>
				<p>Understand the role of caregivers in supporting hypertensive patients and their beliefs about treatment.</p>
				<h6 class="text-white mt-3">Key Prompts:</h6>
				<div class="mb-3">
					<strong>Care Role & Support:</strong>
					<ul class="small mt-1">
						<li>"What kind of support do you provide to the person you care for who has hypertension?"</li>
						<li>"Do you help with medication reminders or monitoring symptoms?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Treatment Beliefs:</strong>
					<ul class="small mt-1">
						<li>"What are your thoughts on using conventional medicines versus herbs?"</li>
						<li>"Can you describe your interactions with health workers or herbalists?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Integration Support:</strong>
					<ul class="small mt-1">
						<li>"Would you support your relative in trying a combined treatment approach?"</li>
					</ul>
				</div>`
		},
		'policymaker': {
			title: 'Policymaker Interview Guide',
			content: `
				<h6 class="text-white">Objective:</h6>
				<p>Understand policy perspectives on integrating digital health solutions and traditional medicine in hypertension management.</p>
				<h6 class="text-white mt-3">Key Prompts:</h6>
				<div class="mb-3">
					<strong>Policy Environment:</strong>
					<ul class="small mt-1">
						<li>"What are current policies regarding traditional medicine integration in Ghana's health system?"</li>
						<li>"How familiar are you with digital health innovations for NCDs?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Implementation Challenges:</strong>
					<ul class="small mt-1">
						<li>"What challenges do you foresee in implementing personalized digital health solutions?"</li>
						<li>"What regulatory changes would support safe integration of treatments?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Digital Health Views:</strong>
					<ul class="small mt-1">
						<li>"How do you view the role of digital platforms in healthcare delivery?"</li>
					</ul>
				</div>`
		},
		'researcher': {
			title: 'Researcher Interview Guide',
			content: `
				<h6 class="text-white">Objective:</h6>
				<p>Understand researchers' experiences, perspectives, and attitudes toward studying hypertension and treatment practices in Ghana.</p>
				<h6 class="text-white mt-3">Key Prompts:</h6>
				<div class="mb-3">
					<strong>Research Focus & Experience:</strong>
					<ul class="small mt-1">
						<li>"Can you tell me about your research on hypertension or related health issues?"</li>
						<li>"What motivated you to focus on hypertension research?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Treatment Observations:</strong>
					<ul class="small mt-1">
						<li>"What have you observed about how communities manage hypertension?"</li>
						<li>"How do you view conventional medicines versus herbal remedies?"</li>
					</ul>
				</div>
				<div class="mb-3">
					<strong>Research Environment & Digital Tools:</strong>
					<ul class="small mt-1">
						<li>"What challenges have you faced conducting hypertension research in Ghana?"</li>
						<li>"What role can digital platforms play in collecting research data?"</li>
					</ul>
				</div>`
		}
	};

	const guide = guides[type];
	if (guide && title && body) {
		title.textContent = guide.title;
		body.innerHTML = guide.content;
		modal.show();
	}
}

// Filters
function setupFilters() {
	const filterType = document.getElementById('filterType');
	const filterStatus = document.getElementById('filterStatus');
	const searchInput = document.getElementById('searchParticipants');
	[filterType, filterStatus, searchInput].forEach(element => {
		if (element) {
			element.addEventListener('change', renderParticipantsList);
			element.addEventListener('input', renderParticipantsList);
		}
	});
}

function renderParticipantsList() {
	const container = document.getElementById('participantsList');
	if (!container) return;
	const filterType = document.getElementById('filterType')?.value || '';
	const filterStatus = document.getElementById('filterStatus')?.value || '';
	const searchTerm = (document.getElementById('searchParticipants')?.value || '').toLowerCase();

	const filteredParticipants = appState.participants.filter(participant => {
		const matchesType = !filterType || participant.type === filterType;
		const matchesStatus = !filterStatus || (filterStatus === 'eligible' && participant.isEligible) || (filterStatus === 'not-eligible' && !participant.isEligible);
		const matchesSearch = !searchTerm || participant.fullName.toLowerCase().includes(searchTerm) || participant.id.toLowerCase().includes(searchTerm);
		return matchesType && matchesStatus && matchesSearch;
	});

	if (filteredParticipants.length === 0) {
		container.innerHTML = `
			<div class="text-center text-white-50 py-5">
				<i class="bi bi-search fs-1 mb-3 d-block"></i>
				<p>No participants found matching your criteria.</p>
			</div>`;
		return;
	}

	let html = '';
	filteredParticipants.forEach(participant => {
		const statusClass = participant.isEligible ? 'status-eligible' : 'status-not-eligible';
		const statusText = participant.isEligible ? 'Eligible' : 'Not Eligible';
		const interviewStatus = participant.interviewCompleted ? '<i class="bi bi-check-circle text-success ms-2"></i>' : '<i class="bi bi-clock text-warning ms-2"></i>';
		html += `
			<div class="participant-item">
				<div class="row align-items-center">
					<div class="col-12 col-md-8">
						<div class="d-flex align-items-center">
							<div>
								<h6 class="text-white mb-1">${participant.fullName}</h6>
								<small class="text-white-50">
									${participant.id} • ${participant.type.charAt(0).toUpperCase() + participant.type.slice(1)} • ${participant.ageRange} • ${participant.gender}
								</small>
							</div>
							${interviewStatus}
						</div>
					</div>
					<div class="col-12 col-md-4 text-md-end mt-2 mt-md-0">
						<span class="status-badge ${statusClass}">${statusText}</span>
						<div class="mt-1"><small class="text-white-50">Screened: ${new Date(participant.dateScreened).toLocaleDateString()}</small></div>
					</div>
				</div>
			</div>`;
	});
	container.innerHTML = html;
}

// Dashboard
function updateDashboard() {
	const totalParticipants = appState.participants.length;
	const eligibleCount = appState.participants.filter(p => p.isEligible).length;
	const interviewsCompleted = appState.participants.filter(p => p.interviewCompleted).length;
	const audioFilesCount = appState.audioRecordings.length;
	const countsByType = type => appState.participants.filter(p => p.type === type).length;
	const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
	setText('totalParticipants', totalParticipants);
	setText('eligibleCount', eligibleCount);
	setText('interviewsCompleted', interviewsCompleted);
	setText('audioFiles', audioFilesCount);
	setText('patientCount', countsByType('patient'));
	setText('clinicianCount', countsByType('clinician'));
	setText('herbalistCount', countsByType('herbalist'));
	setText('caregiverCount', countsByType('caregiver'));
	setText('policymakerCount', countsByType('policymaker'));
	setText('researcherCount', countsByType('researcher'));
}

// Data export
function downloadData(type) {
	let data, filename;
	switch (type) {
		case 'participants':
			data = generateParticipantsCSV();
			filename = `participants_${new Date().toISOString().split('T')[0]}.csv`;
			break;
		case 'interviews':
			data = generateInterviewsCSV();
			filename = `interviews_${new Date().toISOString().split('T')[0]}.csv`;
			break;
		case 'audio':
			downloadAudioFiles();
			return;
		default:
			return;
	}
	downloadCSV(data, filename);
}

function generateParticipantsCSV() {
	const headers = ['Participant ID', 'Type', 'Study Site', 'Full Name', 'Age Range', 'Gender', 'Contact Number', 'Preferred Contact', 'Eligible', 'Date Screened', 'Interview Completed'];
	let csv = headers.join(',') + '\n';
	appState.participants.forEach(participant => {
		const row = [
			participant.id,
			participant.type,
			participant.studySite || '',
			`"${participant.fullName}"`,
			participant.ageRange,
			participant.gender,
			participant.contactNumber || '',
			participant.preferredContact || '',
			participant.isEligible ? 'Yes' : 'No',
			new Date(participant.dateScreened).toLocaleDateString(),
			participant.interviewCompleted ? 'Yes' : 'No'
		];
		csv += row.join(',') + '\n';
	});
	return csv;
}

function generateInterviewsCSV() {
	const headers = ['Interview ID', 'Participant ID', 'Type', 'Notes', 'Timestamp', 'Completed'];
	let csv = headers.join(',') + '\n';
	appState.interviews.forEach(interview => {
		const row = [
			interview.id,
			interview.participantId,
			interview.type,
			`"${(interview.notes || '').replace(/"/g, '""')}"`,
			new Date(interview.timestamp).toLocaleDateString(),
			interview.completed ? 'Yes' : 'No'
		];
		csv += row.join(',') + '\n';
	});
	return csv;
}

function downloadCSV(csvContent, filename) {
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	if (link.download !== undefined) {
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', filename);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
}

function downloadAudioFiles() {
	if (appState.audioRecordings.length === 0) { alert('No audio recordings available to download.'); return; }
	let list = 'Available Audio Recordings:\n\n';
	appState.audioRecordings.forEach((rec, i) => {
		list += `${i + 1}. ${rec.id} - Participant: ${rec.participantId}\n   Type: ${rec.type} - Date: ${new Date(rec.timestamp).toLocaleDateString()}\n\n`;
	});
	alert(list + 'Audio files are stored in the browser for this demo.');
}

// Storage
function saveToStorage() {
	const dataToSave = { participants: appState.participants, interviews: appState.interviews, audioCount: appState.audioRecordings.length };
	localStorage.setItem('hypertensionResearchData', JSON.stringify(dataToSave));
}
function loadStoredData() {
	const stored = localStorage.getItem('hypertensionResearchData');
	if (stored) {
		const data = JSON.parse(stored);
		appState.participants = data.participants || [];
		appState.interviews = data.interviews || [];
	}
}

// PWA registration
function registerServiceWorker() {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('./sw.js').then(reg => console.log('SW registered', reg)).catch(err => console.log('SW registration failed', err));
		});
	}
}

// Install prompt
let deferredPrompt;
function setupInstallPrompt() {
	const installButton = document.createElement('button');
	installButton.textContent = 'Install App';
	installButton.className = 'btn btn-gradient btn-primary position-fixed bottom-0 end-0 m-3';
	installButton.style.display = 'none';
	document.body.appendChild(installButton);
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		deferredPrompt = e;
		installButton.style.display = 'block';
		installButton.addEventListener('click', () => {
			installButton.style.display = 'none';
			deferredPrompt.prompt();
			deferredPrompt.userChoice.finally(() => { deferredPrompt = null; });
		}, { once: true });
	});
}

// Auto-save notes
let autoSaveTimeout;
const notesEl = document.getElementById('interviewNotes');
if (notesEl) {
	notesEl.addEventListener('input', function () {
		clearTimeout(autoSaveTimeout);
		autoSaveTimeout = setTimeout(() => {
			const participantId = document.getElementById('interviewParticipant')?.value;
			if (participantId) localStorage.setItem(`draft_${participantId}`, this.value);
		}, 2000);
	});
}

const interviewParticipantEl = document.getElementById('interviewParticipant');
if (interviewParticipantEl) {
	interviewParticipantEl.addEventListener('change', function () {
		const participantId = this.value;
		if (participantId) {
			const draft = localStorage.getItem(`draft_${participantId}`);
			if (draft) { const notes = document.getElementById('interviewNotes'); if (notes) notes.value = draft; }
		}
	});
}

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
	if ((e.ctrlKey || e.metaKey) && e.key === 's') {
		e.preventDefault();
		const interviewSection = document.getElementById('interview');
		if (interviewSection?.classList.contains('active')) saveInterview();
	}
	if (e.code === 'Space' && e.target && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
		const interviewSection = document.getElementById('interview');
		if (interviewSection?.classList.contains('active')) { e.preventDefault(); toggleRecording(); }
	}
});

// Touch gestures
let touchStartX, touchStartY;
document.addEventListener('touchstart', function (e) {
	touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
});
document.addEventListener('touchend', function (e) {
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

// Responsive helpers
function adjustForMobile() {
	const isMobile = window.innerWidth < 768;
	if (isMobile) document.body.classList.add('mobile-view');
	else document.body.classList.remove('mobile-view');
}
window.addEventListener('resize', adjustForMobile);

// Validation helpers
function validateParticipantData(participant) {
	const errors = [];
	if (!participant.fullName?.trim()) errors.push('Full name is required');
	if (!participant.type) errors.push('Participant type is required');
	if (!participant.ageRange) errors.push('Age range is required');
	if (!participant.gender) errors.push('Gender is required');
	return errors;
}

// Expose helpers for console/manual use
window.HypertensionResearchApp = {
	getParticipants: () => appState.participants,
	getInterviews: () => appState.interviews,
	exportData: (type) => downloadData(type),
	clearAllData: () => {
		if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
			appState = { participants: [], interviews: [], audioRecordings: [] };
			localStorage.removeItem('hypertensionResearchData');
			updateDashboard();
			renderParticipantsList();
			alert('All data has been cleared.');
		}
	}
};

console.log('Hypertension Research PWA initialized successfully');
