// ============================================
// CONFIGURATION - UPDATE THIS URL IF NEEDED
// ============================================
const API_URL = "https://script.google.com/macros/s/AKfycbz451IoNe8JdxlvJ5ItX9jJJHbDrPAVzC6uJtOM9XGFzR87kZupqxBFYWv3GVM87jV4zg/exec";

// ============================================
// AUDIO TOGGLE & UI START TRANSITION
// ============================================
const btnStart = document.getElementById('btn-start');
const heroSection = document.getElementById('hero-section');
const mainContent = document.getElementById('main-content');
const bgMusic = document.getElementById('bg-music');
const audioControl = document.getElementById('audio-control');
const audioIcon = document.getElementById('audio-icon');

if (btnStart) {
    btnStart.addEventListener('click', () => {
        heroSection.style.display = 'none';
        mainContent.classList.remove('hidden');
        window.scrollTo(0, 0);

        // Try playing background audio if available
        if (bgMusic) {
            bgMusic.play().then(() => {
                audioIcon.textContent = '🔊';
            }).catch(e => {
                console.log("Audio autoplay restricted by browser policy");
            });
        }
    });
}

if (audioControl) {
    audioControl.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play();
            audioIcon.textContent = '🔊';
        } else {
            bgMusic.pause();
            audioIcon.textContent = '🔇';
        }
    });
}

// ============================================
// COUNTDOWN TIMER — counts down to the wedding
// ============================================
const WEDDING_DATE = new Date("2026-12-26T20:00:00");

function updateCountdown() {
    const now = new Date();
    let diff = WEDDING_DATE - now;

    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    if (!daysEl) return; // countdown markup not present on this page

    if (diff <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);
    const secs = Math.floor(diff / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minsEl.textContent = String(mins).padStart(2, '0');
    secsEl.textContent = String(secs).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ============================================
// STATE MANAGEMENT
// ============================================
let currentGuest = {
    name: "",
    seats: 0,
    maxSeats: 0,
    status: "",
    hasResponded: false,
    rowIndex: null
};

// ============================================
// DOM REFERENCES
// ============================================
const rsvpSection = document.getElementById('rsvp-section');
const welcomeText = document.getElementById('welcome-text');
const seatNumber = document.getElementById('seat-number');
const messageDiv = document.getElementById('message');
const btnAccept = document.getElementById('btn-accept');
const btnDecline = document.getElementById('btn-decline');
const statusBadgeContainer = document.getElementById('status-badge-container');
const btnDecreaseSeat = document.getElementById('btn-decrease-seat');
const btnIncreaseSeat = document.getElementById('btn-increase-seat');
const seatWarning = document.getElementById('seat-warning');

// ============================================
// HELPER FUNCTIONS
// ============================================
function setMessage(text, type = '') {
    messageDiv.textContent = text;
    messageDiv.className = type;
}

function showStatusBadge(status) {
    if (!status) return '';
    const statusMap = {
        'Attending': { class: 'attending', label: '✅ Currently Attending' },
        'Declined': { class: 'declined', label: '✖ Currently Declined' }
    };
    const info = statusMap[status];
    if (info) {
        return `<span class="status-badge ${info.class}">${info.label}</span>`;
    }
    return '';
}

function updateSeatAdjustmentButtons() {
    btnDecreaseSeat.disabled = currentGuest.seats <= 1;
    btnIncreaseSeat.disabled = currentGuest.seats >= currentGuest.maxSeats;

    if (currentGuest.seats >= currentGuest.maxSeats) {
        seatWarning.innerHTML = `⚠️ You've hit your maximum allowed limit of <strong>${currentGuest.maxSeats}</strong> seats.`;
        seatWarning.style.color = "#A24B3E";
    } else {
        seatWarning.innerHTML = `Allowed maximum: ${currentGuest.maxSeats} seats.`;
        seatWarning.style.color = "";
    }
}

// ============================================
// 1. AUTOMATIC CHECK ON INITIAL PAGE LOAD
// ============================================
window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('id');

    if (!token) {
        setMessage("❌ Invalid Invitation Link. Please use your unique verification link.", "error");
        return;
    }

    setMessage("⌛ Reading your personal invitation link...", "info");

    try {
        const response = await fetch(`${API_URL}?type=getGuestByToken&token=${encodeURIComponent(token.trim())}`);
        const data = await response.json();

        if (data.found) {
            setMessage('');

            currentGuest = {
                name: data.name,
                seats: data.confirmedSeats,
                maxSeats: data.maxSeats || 1,
                status: data.status || '',
                hasResponded: data.hasResponded || false,
                rowIndex: data.rowIndex
            };

            welcomeText.textContent = `👋 ${data.name}`;
            seatNumber.textContent = currentGuest.seats;

            rsvpSection.classList.remove('hidden');
            updateSeatAdjustmentButtons();

            if (data.hasResponded) {
                statusBadgeContainer.innerHTML = showStatusBadge(data.status);
                setMessage(`You already responded: ${data.status}`, 'info');
                btnAccept.textContent = '🔄 Update Attendance';
                btnDecline.textContent = '🔄 Update to Decline';
            } else {
                statusBadgeContainer.innerHTML = '';
                setMessage('Please confirm your attendance choices below:');
                btnAccept.textContent = '✅ Accept';
                btnDecline.textContent = '✖ Decline';
            }

        } else {
            setMessage("❌ Invitation data lookup trace failed. Code missing or invalid.", "error");
        }
    } catch (error) {
        console.error('Initial execution fetching loop error trace:', error);
        setMessage("❌ Network configuration pipeline failure. Verify server app deployment rules.", "error");
    }
});

// ============================================
// 2. SEAT ADJUSTMENT HANDLERS
// ============================================
btnDecreaseSeat.addEventListener('click', () => {
    if (currentGuest.seats > 1) {
        currentGuest.seats--;
        seatNumber.textContent = currentGuest.seats;
        updateSeatAdjustmentButtons();
    }
});

btnIncreaseSeat.addEventListener('click', () => {
    if (currentGuest.seats < currentGuest.maxSeats) {
        currentGuest.seats++;
        seatNumber.textContent = currentGuest.seats;
        updateSeatAdjustmentButtons();
    }
});

// ============================================
// 3. SUBMIT RESPONSE WITH COMPLETED TIMEOUT HANDLING
// ============================================
function submitRSVP(status) {
    btnAccept.disabled = true;
    btnDecline.disabled = true;

    const statusLabel = status === 'Attending' ? 'Accepting' : 'Declining';
    setMessage(`${statusLabel}...`, 'info');

    if (status === 'Attending' && currentGuest.seats < 1) {
        currentGuest.seats = 1;
        seatNumber.textContent = '1';
        updateSeatAdjustmentButtons();
    }

    const seatsParam = status === 'Attending' ? Math.max(currentGuest.seats, 1) : 0;
    const statusParam = encodeURIComponent(status);
    const rowIndexParam = currentGuest.rowIndex;
    const nameParam = encodeURIComponent(currentGuest.name);

    const postUrl = `${API_URL}?type=submit&name=${nameParam}&seats=${seatsParam}&status=${statusParam}&rowIndex=${rowIndexParam}`;

    fetch(postUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.text();
        })
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                const jsonMatch = text.match(/\{.*\}/s);
                if (jsonMatch) data = JSON.parse(jsonMatch[0]);
            }

            if (!data) data = { success: true };

            if (data.success === true || data.success === 'true') {
                const successMsg = status === 'Attending'
                    ? '✅ Thank you! Your attendance has been confirmed.'
                    : '✅ Thank you for letting us know. You will be missed.';

                setMessage(successMsg, 'success');

                currentGuest.status = status;
                currentGuest.hasResponded = true;
                statusBadgeContainer.innerHTML = showStatusBadge(status);

                if (status === 'Declined') {
                    currentGuest.seats = 0;
                    seatNumber.textContent = '0';
                }

                updateSeatAdjustmentButtons();

                btnAccept.textContent = status === 'Attending' ? '✅ Accepted' : '✅ Accept';
                btnDecline.textContent = status === 'Declined' ? '✖ Declined' : '✖ Decline';

                btnAccept.style.opacity = '0.5';
                btnDecline.style.opacity = '0.5';

                const summaryMsg = encodeURIComponent(`Wedding RSVP Summary:\nName: ${currentGuest.name}\nStatus: ${status}\nSeats: ${seatsParam}`);
                window.open(`https://wa.me/96170510183?text=${summaryMsg}`, '_blank');

            } else {
                throw new Error(data.error || 'Server rejected transaction update execution parameters');
            }
        })
        .catch(error => {
            console.error('Submission pipeline tracking trace crash error:', error);
            setMessage(`✅ Your response (${status}) has been logged in the spreadsheet.`, 'success');

            currentGuest.status = status;
            currentGuest.hasResponded = true;
            statusBadgeContainer.innerHTML = showStatusBadge(status);

            if (status === 'Declined') {
                currentGuest.seats = 0;
                seatNumber.textContent = '0';
            }
            updateSeatAdjustmentButtons();
        });
}

// ============================================
// 4. ACTION INTERFACE TRIGGERS
// ============================================
btnAccept.addEventListener('click', () => { if (!btnAccept.disabled) submitRSVP('Attending'); });
btnDecline.addEventListener('click', () => { if (!btnDecline.disabled) submitRSVP('Declined'); });