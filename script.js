// ========================
// FIREBASE CONFIGURATION
// ========================
const firebaseConfig = {
    apiKey: "AIzaSyCPIKqcHyAmeRHmgMyYea_2yxRHv7vErxg",
    authDomain: "romantic-advent-calendar.firebaseapp.com",
    databaseURL: "https://romantic-advent-calendar-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "romantic-advent-calendar",
    storageBucket: "romantic-advent-calendar.firebasestorage.app",
    messagingSenderId: "545121258378",
    appId: "1:545121258378:web:03f499721afa6dd8805673",
    measurementId: "G-WW0GL67W09"
};

// ========================
// IMAGE PRELOADING
// ========================
const imagesToPreload = [
    'images/lightmodebg.png',
    'images/darkmodebg.png',
    'images/heresemptylight.png',
    'images/heresemptydark.png',
    'images/giftlight.png',
    'images/giftdark.png',
    'images/light_vibrationfx.png',
    'images/dark_vibrationfx.png',
    'images/crample.png',
    'images/midcrample.png',
    'images/opened.png',
    'images/lookinuplight.png'
];

function preloadImages() {
    imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
    });
    console.log('[System] Avviato precaricamento immagini...');
}

// Avvia immediatamente il precaricamento
preloadImages();

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Cache per i dati delle letterine (evita chiamate ripetute)
let letterineCache = {};
let letterineBasePath = 'letterine'; // Verrà aggiornato se necessario

/**
 * Verifica se un giorno è disponibile per l'apertura
 * @param {number} dayNumber - Numero del giorno (1-14)
 * @returns {boolean} - true se il giorno è sbloccato
 */
function isDayAvailable(dayNumber) {
    const now = new Date();
    const currentYear = 2026;
    // Il giorno 1 corrisponde al 1 Febbraio 2026, giorno 14 al 14 Febbraio 2026
    const unlockDate = new Date(currentYear, 1, dayNumber); // Mese 1 = Febbraio (0-indexed)
    unlockDate.setHours(0, 0, 0, 0); // Inizio del giorno
    return now >= unlockDate;
}

/**
 * Inizializza il calendario leggendo lo stato dal database
 */
function initializeCalendar() {
    const dayBoxes = document.querySelectorAll(".day-box");

    // Prima proviamo a leggere dalla radice del database
    database.ref('/').once('value').then((snapshot) => {
        let data = snapshot.val() || {};

        console.log('[Firebase] Dati grezzi dalla radice:', data);

        // Auto-detect della struttura del database
        // Caso 1: Dati direttamente alla radice (1, 2, 3...)
        if (data['1'] && data['1'].messaggio) {
            console.log('[Firebase] Struttura rilevata: dati alla radice');
            letterineBasePath = ''; // Percorso vuoto = radice
            letterineCache = data;
        }
        // Caso 2: Dati sotto 'letterine' (letterine/1, letterine/2...)
        else if (data.letterine && data.letterine['1'] && data.letterine['1'].messaggio) {
            console.log('[Firebase] Struttura rilevata: dati sotto /letterine');
            letterineBasePath = 'letterine';
            letterineCache = data.letterine;
        }
        // Caso 3: Dati sotto 'letterine/letterine' (import errato)
        else if (data.letterine && data.letterine.letterine) {
            console.log('[Firebase] Struttura rilevata: dati sotto /letterine/letterine');
            letterineBasePath = 'letterine/letterine';
            letterineCache = data.letterine.letterine;
        }
        else {
            console.warn('[Firebase] Struttura dati non riconosciuta:', data);
            letterineCache = {};
        }

        console.log('[Firebase] letterineCache:', letterineCache);
        console.log('[Firebase] letterineBasePath:', letterineBasePath);

        dayBoxes.forEach(box => {
            const dayNumber = box.innerText.trim().split('\n')[0].trim();
            const dayNum = dayNumber.match(/\d+/)?.[0];

            if (dayNum && letterineCache[dayNum]) {
                if (letterineCache[dayNum].aperto === true) {
                    box.classList.add('is-opened');
                }
            }
        });
    }).catch((error) => {
        console.error('[Firebase] Errore nel caricamento dati:', error);
    });
}

// Inizializza il calendario quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelectorAll(".day-box").length > 0) {
        initializeCalendar();
    }
});

// ========================
// END FIREBASE CONFIG
// ========================

const checkbox = document.getElementById("checkbox");

// SOUND EFFECTS HANDLER
const sfx = {
    shake: new Audio('sounds/shaking.mp3'),
    open: new Audio('sounds/open.mp3'),
    uncrample: new Audio('sounds/uncrample.mp3')
};

function playSfx(type, pitch = 1) {
    if (sfx[type]) {
        sfx[type].currentTime = 0;
        sfx[type].playbackRate = pitch; // Cambia il "pitch" (velocità/intonazione)
        sfx[type].play().catch(err => {
            console.log("Audio playback failed, possibly due to user interaction policy or missing file:", err);
            playSynthSfx(type);
        });
    }
}

function playSynthSfx(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'shake') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.2);
        } else if (type === 'open') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        }
    } catch (e) {
        console.error("Web Audio API not supported", e);
    }
}

// Carica il tema salvato
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-theme");
    checkbox.checked = true;
}

checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
        document.documentElement.classList.add("dark-theme");
        document.body.classList.add("dark-theme");
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.classList.remove("dark-theme");
        document.body.classList.remove("dark-theme");
        localStorage.setItem("theme", "light");
    }
});



// Logica per nascondere l'header allo scroll
let lastScrollTop = 0;
const header = document.getElementById("header");

window.addEventListener("scroll", () => {
    let scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scroll verso il basso - Nascondi header
        header.classList.add("nav-up");
    } else {
        // Scroll verso l'alto - Mostra header
        header.classList.remove("nav-up");
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}, { passive: true });



// LOGICA MODAL CALENDARIO
const dayBoxes = document.querySelectorAll(".day-box");
const modal = document.getElementById("day-modal");
const closeModalBtn = document.getElementById("close-modal");
const modalBody = document.getElementById("modal-body");

if (dayBoxes.length > 0 && modal) {
    dayBoxes.forEach(box => {
        box.addEventListener("click", () => {
            const dayText = box.innerText;
            // Estrai solo il numero del giorno
            const dayNumber = dayText.match(/\d+/)?.[0] || "1";

            // Recupera i dati in tempo reale da Firebase
            // Costruisci il percorso corretto (gestisce radice e sotto-nodi)
            const dbPath = letterineBasePath ? `${letterineBasePath}/${dayNumber}` : `/${dayNumber}`;
            console.log(`[Firebase] Recupero dati da: ${dbPath}`);

            database.ref(dbPath).once('value').then((snapshot) => {
                const letterina = snapshot.val() || { messaggio: "Messaggio non disponibile", aperto: false };
                const messaggio = letterina.messaggio;
                const giaAperto = letterina.aperto === true;

                console.log(`[Firebase] Giorno ${dayNumber}:`, { messaggio, giaAperto, isAvailable: isDayAvailable(parseInt(dayNumber)) });

                // Verifica disponibilità data
                const isAvailable = isDayAvailable(parseInt(dayNumber));

                // Costruisci il modal
                modalBody.innerHTML = `
                    <div class="bloom-overlay"></div>
                    <h2 id="modal-title">Giorno ${dayNumber}</h2>
                    <div class="modal-gift-container" id="gift-container">
                        <div class="vibration-fx left"></div>
                        <div class="modal-gift-image" id="gift-image"></div>
                        <div class="vibration-fx right"></div>
                        <div class="gift-shadow" id="gift-shadow"></div>
                        <div class="cat-floor"></div>
                    </div>
                    <div id="gift-message-container">
                        <p id="modal-desc">Apri il regalo per scoprire il contenuto speciale!</p>
                        <button class="claim-btn" id="claim-button">Riscatta</button>
                    </div>
                `;
                modal.classList.add("active");
                document.body.style.overflow = "hidden";

                const giftImage = document.getElementById("gift-image");
                const claimBtn = document.getElementById("claim-button");
                const giftShadow = document.getElementById("gift-shadow");
                const bloomOverlay = document.querySelector(".bloom-overlay");
                const vibrationFx = document.querySelectorAll(".vibration-fx");
                const modalDesc = document.getElementById("modal-desc");

                // === CASO 1: GIÀ APERTO - Salta animazione e mostra messaggio ===
                if (giaAperto) {
                    // Imposta lo stato finale direttamente
                    giftImage.style.animation = "none";
                    giftImage.classList.add("opened", "paper-opened");
                    vibrationFx.forEach(fx => fx.style.display = "none");
                    claimBtn.style.display = "none";

                    document.getElementById("modal-title").innerText = "Un messaggio per te!";
                    modalDesc.innerHTML = `<span class="gift-content-text show">${messaggio}</span>`;
                    modalDesc.classList.add("show");
                    return; // Esci, nessuna ulteriore logica necessaria
                }

                // === CASO 2: NON DISPONIBILE (data futura) ===
                if (!isAvailable) {
                    claimBtn.setAttribute("disabled", "true");
                    claimBtn.style.opacity = "0.5";
                    claimBtn.style.cursor = "not-allowed";
                    claimBtn.innerText = "Non ancora disponibile";
                    modalDesc.innerHTML = `<p>Questo regalo si sbloccherà il <strong>${dayNumber} Febbraio 2026</strong></p>`;

                    // Disabilita animazione idle per i giorni non disponibili
                    giftImage.style.animation = "none";
                    vibrationFx.forEach(fx => fx.style.display = "none");
                    return; // IMPORTANTE: non permettere ulteriori azioni
                }

                // === CASO 3: DISPONIBILE E NON APERTO ===
                // Gestione audio per l'animazione idle (jumpingGift)
                if (!giaAperto) {
                    setTimeout(() => {
                        if (!giftImage.classList.contains('opened') && modal.classList.contains('active')) {
                            playSfx('shake', 1.2);
                        }
                    }, 1000);

                    giftImage.addEventListener('animationiteration', (e) => {
                        if (e.animationName === 'jumpingGift' && !giftImage.classList.contains('opened')) {
                            playSfx('shake', 1.2);
                        }
                    });
                }

                // Handler per il pulsante Riscatta
                claimBtn.addEventListener("click", () => {
                    if (giftImage.classList.contains("opened") || claimBtn.getAttribute("disabled")) return;

                    // Disabilita UI
                    claimBtn.setAttribute("disabled", "true");
                    claimBtn.style.opacity = "0.5";
                    claimBtn.innerText = "Attendi...";

                    // Funzione che avvia la sequenza finale
                    const startFinalSequence = () => {
                        giftImage.style.animation = "none";
                        giftImage.offsetHeight; // trigger reflow

                        claimBtn.style.display = "none";
                        modalDesc.style.opacity = "0";

                        playSfx('shake', 1.2);

                        giftImage.classList.add("shaking");
                        giftImage.style.animation = "giftShake 0.6s ease-in-out forwards";

                        setTimeout(() => {
                            bloomOverlay.classList.add("active");
                            setTimeout(() => playSfx('open'), 200);

                            setTimeout(() => {
                                giftImage.classList.remove("shaking");
                                giftImage.style.animation = "none";
                                giftImage.classList.add("opened");
                                if (giftShadow) giftShadow.style.opacity = "1";
                                vibrationFx.forEach(fx => fx.style.display = "none");

                                document.getElementById("modal-title").innerText = "Un messaggio per te!";
                                modalDesc.innerHTML = `<span class="gift-content-text show">Tocca il foglio per aprirlo...</span>`;
                                modalDesc.style.opacity = "1";
                                modalDesc.classList.add("show");

                                // Logica di apertura della carta
                                let paperState = 0;
                                giftImage.addEventListener("click", () => {
                                    if (paperState === 0) {
                                        playSfx('uncrample', 1.1);
                                        if (giftShadow) giftShadow.classList.add("cat-exit");
                                        giftImage.classList.add("paper-mid");
                                        paperState = 1;
                                    } else if (paperState === 1) {
                                        playSfx('uncrample', 0.9);
                                        giftImage.classList.add("paper-opened");
                                        // Usa il messaggio dal database
                                        modalDesc.innerHTML = `<span class="gift-content-text show">${messaggio}</span>`;
                                        paperState = 2;
                                    }
                                });
                            }, 1200);
                        }, 600);
                    };

                    // PRIMA di startFinalSequence, aggiorna Firebase con aperto: true
                    database.ref(dbPath).update({ aperto: true }).then(() => {
                        console.log(`[Firebase] Aggiornato aperto=true per giorno ${dayNumber}`);
                        // Aggiorna anche la cache locale e la classe sul box
                        if (letterineCache[dayNumber]) {
                            letterineCache[dayNumber].aperto = true;
                        }
                        box.classList.add('is-opened');

                        // Ora avvia la sequenza di animazione
                        const onAnimationFinish = (e) => {
                            if (e.animationName === 'jumpingGift') {
                                giftImage.removeEventListener('animationiteration', onAnimationFinish);
                                startFinalSequence();
                            }
                        };

                        giftImage.addEventListener('animationiteration', onAnimationFinish);

                        // Fallback se l'animazione non triggera
                        setTimeout(() => {
                            giftImage.removeEventListener('animationiteration', onAnimationFinish);
                            if (!giftImage.classList.contains("opened") && claimBtn.style.display !== "none") {
                                startFinalSequence();
                            }
                        }, 3100);
                    }).catch((error) => {
                        console.error("Errore durante l'aggiornamento Firebase:", error);
                        claimBtn.innerText = "Errore, riprova";
                        claimBtn.removeAttribute("disabled");
                        claimBtn.style.opacity = "1";
                    });
                });
            }).catch((error) => {
                console.error("Errore nel recupero dati Firebase:", error);
                modalBody.innerHTML = `<p>Errore nel caricamento. Riprova più tardi.</p>`;
                modal.classList.add("active");
            });
        });
    });

    const closeModal = () => {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";

        // Ferma tutti i suoni quando il modal viene chiuso
        Object.values(sfx).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });

        // Pulisce il contenuto del modal per sicurezza
        setTimeout(() => {
            modalBody.innerHTML = "";
        }, 400);
    };

    closeModalBtn.addEventListener("click", closeModal);

    // Chiudi il modal cliccando fuori dal contenuto
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Chiudi con il tasto ESC
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("active")) {
            closeModal();
        }
    });
}



// LOGICA COUNTDOWN
function updateCountdown() {
    const now = new Date();
    const currentYear = 2026; // Fissiamo l'anno come da richiesta
    let targetDate;

    // Se siamo prima di Febbraio 1, il target è Febbraio 1
    if (now.getMonth() < 1 || (now.getMonth() === 1 && now.getDate() < 1)) {
        targetDate = new Date(currentYear, 1, 1); // 1 Febbraio (index 1)
    }
    // Se siamo tra l'1 e il 13 Febbraio, il target è il giorno successivo a mezzanotte
    else if (now.getMonth() === 1 && now.getDate() < 14) {
        targetDate = new Date(currentYear, 1, now.getDate() + 1);
    }
    // Se è il 14 Febbraio o dopo, San Valentino è passato o è oggi
    else {
        targetDate = new Date(currentYear, 1, 14); // Target finale 14 Febbraio
    }

    const diff = targetDate - now;

    if (diff <= 0) {
        document.getElementById("hours").innerText = "00";
        document.getElementById("minutes").innerText = "00";
        document.getElementById("seconds").innerText = "00";
        return;
    }

    // Calcoliamo le ore totali (includendo i giorni convertiti in ore)
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById("hours").innerText = h.toString().padStart(2, '0');
    document.getElementById("minutes").innerText = m.toString().padStart(2, '0');
    document.getElementById("seconds").innerText = s.toString().padStart(2, '0');
}

if (document.getElementById("countdown")) {
    setInterval(updateCountdown, 1000);
    updateCountdown();
}
