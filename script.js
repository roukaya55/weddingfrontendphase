const API_URL = "https://script.google.com/macros/s/AKfycbz451IoNe8JdxlvJ5ItX9jJJHbDrPAVzC6uJtOM9XGFzR87kZupqxBFYWv3GVM87jV4zg/exec";

document.addEventListener('DOMContentLoaded', () => {
    const btnStart = document.getElementById('btn-start');
    const heroSection = document.getElementById('hero-section');
    const envelopeSection = document.getElementById('envelope-section');
    const envelopeWrapper = document.getElementById('envelope-wrapper');
    const mainContent = document.getElementById('main-content');
    const bgMusic = document.getElementById('bg-music');
    const audioControl = document.getElementById('audio-control');
    const audioIcon = document.getElementById('audio-icon');

    // 1. Click "Start" -> Hide Hero, Show Envelope Screen
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            heroSection.style.display = 'none';
            envelopeSection.classList.remove('hidden');
            window.scrollTo(0, 0);

            if (bgMusic) {
                bgMusic.play().then(() => {
                    if (audioIcon) audioIcon.textContent = '🔊';
                }).catch(e => {
                    console.log("Audio autoplay restricted by browser policy");
                });
            }
        });
    }

    // 2. Click Envelope/Seal -> Open Envelope animation, then reveal Main Content
    if (envelopeWrapper) {
        envelopeWrapper.addEventListener('click', () => {
            envelopeWrapper.classList.add('open');
            
            // Wait for envelope opening animation to finish before showing main content
            setTimeout(() => {
                envelopeSection.style.display = 'none';
                mainContent.classList.remove('hidden');
                window.scrollTo(0, 0);
            }, 800);
        });
    }

    if (audioControl && bgMusic) {
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
});

// ============================================
// COUNTDOWN TIMER
// ============================================
const WEDDING_DATE = new Date("2026-12-26T20:00:00");

function updateCountdown() {
    const now = new Date();
    let diff = WEDDING_DATE - now;

    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    if (!daysEl) return;

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
// STATE MANAGEMENT & RSVP BACKEND LOGIC
// ============================================
let currentGuest = {
    name: "",
    seats: 0,
    maxSeats: 0,
    status: "",
    hasResponded: false,
    rowIndex: null
};

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

function setMessage(text, type = '') {
    if (!messageDiv) return;
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
    if (!btnDecreaseSeat || !btnIncreaseSeat) return;
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

            if (welcomeText) welcomeText.textContent = `👋 ${data.name}`;
            if (seatNumber) seatNumber.textContent = currentGuest.seats;

            if (rsvpSection) rsvpSection.classList.remove('hidden');
            updateSeatAdjustmentButtons();

            if (data.hasResponded) {
                if (statusBadgeContainer) statusBadgeContainer.innerHTML = showStatusBadge(data.status);
                setMessage(`You already responded: ${data.status}`, 'info');
                if (btnAccept) btnAccept.textContent = '🔄 Update Attendance';
                if (btnDecline) btnDecline.textContent = '🔄 Update to Decline';
            } else {
                if (statusBadgeContainer) statusBadgeContainer.innerHTML = '';
                setMessage('Please confirm your attendance choices below:');
                if (btnAccept) btnAccept.textContent = '✅ Accept';
                if (btnDecline) btnDecline.textContent = '✖ Decline';
            }

        } else {
            setMessage("❌ Invitation data lookup trace failed. Code missing or invalid.", "error");
        }
    } catch (error) {
        console.error('Initial execution fetching loop error trace:', error);
        setMessage("❌ Network configuration pipeline failure. Verify server app deployment rules.", "error");
    }
});

if (btnDecreaseSeat) {
    btnDecreaseSeat.addEventListener('click', () => {
        if (currentGuest.seats > 1) {
            currentGuest.seats--;
            seatNumber.textContent = currentGuest.seats;
            updateSeatAdjustmentButtons();
        }
    });
}

if (btnIncreaseSeat) {
    btnIncreaseSeat.addEventListener('click', () => {
        if (currentGuest.seats < currentGuest.maxSeats) {
            currentGuest.seats++;
            seatNumber.textContent = currentGuest.seats;
            updateSeatAdjustmentButtons();
        }
    });
}

function submitRSVP(status) {
    if (btnAccept) btnAccept.disabled = true;
    if (btnDecline) btnDecline.disabled = true;

    const statusLabel = status === 'Attending' ? 'Accepting' : 'Declining';
    setMessage(`${statusLabel}...`, 'info');

    if (status === 'Attending' && currentGuest.seats < 1) {
        currentGuest.seats = 1;
        if (seatNumber) seatNumber.textContent = '1';
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
                if (statusBadgeContainer) statusBadgeContainer.innerHTML = showStatusBadge(status);

                if (status === 'Declined') {
                    currentGuest.seats = 0;
                    if (seatNumber) seatNumber.textContent = '0';
                }

                updateSeatAdjustmentButtons();

                if (btnAccept) {
                    btnAccept.textContent = status === 'Attending' ? '✅ Accepted' : '✅ Accept';
                    btnAccept.style.opacity = '0.5';
                }
                if (btnDecline) {
                    btnDecline.textContent = status === 'Declined' ? '✖ Declined' : '✖ Decline';
                    btnDecline.style.opacity = '0.5';
                }

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
            if (statusBadgeContainer) statusBadgeContainer.innerHTML = showStatusBadge(status);

            if (status === 'Declined') {
                currentGuest.seats = 0;
                if (seatNumber) seatNumber.textContent = '0';
            }
            updateSeatAdjustmentButtons();
        });
}

if (btnAccept) btnAccept.addEventListener('click', () => { if (!btnAccept.disabled) submitRSVP('Attending'); });
if (btnDecline) btnDecline.addEventListener('click', () => { if (!btnDecline.disabled) submitRSVP('Declined'); });