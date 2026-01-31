// ========================
// FIREBASE CONFIGURATION
// ========================
const firebaseConfig = {
    apiKey: "AIzaSyAtDQ4PAlBTWPw6TlTuo62WLG0ShwY1EtI",
    authDomain: "romantic-advent-calendar-e599d.firebaseapp.com",
    databaseURL: "https://romantic-advent-calendar-e599d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "romantic-advent-calendar-e599d",
    storageBucket: "romantic-advent-calendar-e599d.firebasestorage.app",
    messagingSenderId: "60474076543",
    appId: "1:60474076543:web:35ac54e461cac5cfecfe4a",
    measurementId: "G-CQCYZNYVSM"
};

// ========================
// IMAGE PRELOADING
// ========================
const imagesToPreload = [
    'images/stvalentine.png',
    'images/stvalentinemobile.png',
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
    'images/lookinuplight.png',
    'images/lookinupdark.png',
    'images/stairslight.png',
    'images/stairsdark.png',
    'images/lockedlight.png',
    'images/lockeddark.png',
    'images/overlay.png'
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
 * Trova il primo giorno sbloccato temporalmente ma non ancora riscattato
 * @returns {number|null} - Numero del giorno o null
 */
function getFirstClaimableDay() {
    for (let i = 1; i <= 14; i++) {
        const isAvailable = isDayAvailable(i);
        // Controlliamo la cache (che deve essere popolata)
        const giaAperto = letterineCache[i] && letterineCache[i].aperto === true;

        if (isAvailable && !giaAperto) {
            return i;
        }
    }
    return null;
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

        const firstClaimable = getFirstClaimableDay();

        dayBoxes.forEach(box => {
            const dayNumberText = box.innerText.trim().split('\n')[0].trim();
            const dayNum = parseInt(dayNumberText.match(/\d+/)?.[0]);

            if (dayNum) {
                // Rimuovi classi per aggiornamento pulito
                box.classList.remove('is-opened', 'is-claimable');
                const icon = box.querySelector("i.fa-gift");
                if (icon) icon.classList.remove("fa-bounce");

                const available = isDayAvailable(dayNum);
                const giaAperto = letterineCache[dayNum] && letterineCache[dayNum].aperto === true;

                if (giaAperto) {
                    box.classList.add('is-opened');
                } else if (available) {
                    // Tutti i giorni sbloccati temporalmente diventano evidenziati col bordo
                    box.classList.add('is-claimable');

                    // Solo il PRIMO regalo della fila (quello effettivamente riscattabile ora) rimbalza
                    if (dayNum === firstClaimable && icon) {
                        icon.classList.add("fa-bounce");
                    }
                }
            }
        });
    }).catch((error) => {
        console.error('[Firebase] Errore nel caricamento dati:', error);
    });
}


/**
 * Aggiorna il contatore dei progressi nella home page
 */
function updateHomeProgress() {
    const progressText = document.getElementById("progress-text");
    if (!progressText) return;

    database.ref('/').once('value').then((snapshot) => {
        let data = snapshot.val() || {};
        let count = 0;
        let letters = {};

        // Stessa logica di rilevamento struttura di initializeCalendar
        if (data['1'] && data['1'].messaggio) {
            letters = data;
        } else if (data.letterine && data.letterine['1'] && data.letterine['1'].messaggio) {
            letters = data.letterine;
        } else if (data.letterine && data.letterine.letterine) {
            letters = data.letterine.letterine;
        }

        // Conta le letterine aperte da 1 a 14
        for (let i = 1; i <= 14; i++) {
            if (letters[i] && letters[i].aperto === true) {
                count++;
            }
        }

        progressText.innerText = `${count}/14 giorni riscattati`;
    }).catch((error) => {
        console.error('[Firebase] Errore aggiornamento progressi home:', error);
    });
}

// Inizializza il calendario quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelectorAll(".day-box").length > 0) {
        initializeCalendar();
    }

    // Aggiorna la home se presente
    if (document.getElementById("progress-text")) {
        updateHomeProgress();
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
                    modalDesc.innerHTML = '<p class="hint-text">Clicca sul foglio per scoprire la foto ricordo!</p>';

                    // Inserisce il testo dentro il foglio + OVERLAY
                    const showText = () => {
                        giftImage.innerHTML = `
                            <div class="paper-text-scroll">${messaggio}</div>
                            <div class="paper-overlay"></div>
                        `;
                    };
                    const showPhoto = () => {
                        giftImage.innerHTML = `<img src="images/photos/day${dayNumber}.png" class="paper-photo" alt="Ricordo">`;
                    };

                    // Mostra testo iniziale
                    showText();

                    // Toggle Click per girare il foglio
                    let isPhotoView = false;
                    giftImage.onclick = (e) => {
                        // Se l'utente sta selezionando il testo, non girare (opzionale, ma migliora UX)
                        if (window.getSelection().toString().length > 0) return;

                        isPhotoView = !isPhotoView;
                        // Simula effetto flip (opzionale, basico scambio contenuto per ora)
                        if (isPhotoView) showPhoto(); else showText();
                    };

                    return; // Esci, nessuna ulteriore logica necessaria
                }

                // === CASO 2: NON DISPONIBILE (data futura) ===
                if (!isAvailable) {
                    claimBtn.setAttribute("disabled", "true");
                    claimBtn.style.opacity = "0.5";
                    claimBtn.style.cursor = "not-allowed";
                    claimBtn.innerText = "Non ancora disponibile";
                    modalDesc.innerHTML = `<p>Questo regalo si sbloccherà il <strong>${dayNumber} Febbraio 2026</strong></p>`;

                    // Mostra l'immagine del lucchetto
                    giftImage.classList.add("locked-mode");

                    // Disabilita animazione idle per i giorni non disponibili
                    giftImage.style.animation = "none";
                    if (vibrationFx) vibrationFx.forEach(fx => fx.style.display = "none");
                    return;
                }

                // === CASO 2.5: SEQUENZA BLOCCATA (giorni precedenti non riscattati) ===
                const firstClaimable = getFirstClaimableDay();
                const currentDayNum = parseInt(dayNumber);

                if (firstClaimable && currentDayNum > firstClaimable) {
                    claimBtn.setAttribute("disabled", "true");
                    claimBtn.style.opacity = "0.5";
                    claimBtn.style.cursor = "not-allowed";
                    claimBtn.innerText = "Bloccato";
                    modalDesc.innerHTML = `
                        <p>Eh no. Devi riscattare i regali in fila!</p>
                        <button class="skip-to-btn" id="go-to-first">
                            Vai al regalo da riscattare <i class="fas fa-arrow-right" style="margin-left: 5px;"></i>
                        </button>
                    `;

                    // Mostra l'immagine delle scale
                    giftImage.classList.add("stairs-mode");

                    // Disabilita animazione idle
                    giftImage.style.animation = "none";
                    if (vibrationFx) vibrationFx.forEach(fx => fx.style.display = "none");

                    // Handler per il pulsante skip
                    document.getElementById("go-to-first").onclick = () => {
                        // Invece di chiudere e riaprire, sovrascriviamo direttamente
                        const targetBox = Array.from(dayBoxes).find(b => {
                            const bNum = b.innerText.match(/\d+/)?.[0];
                            return parseInt(bNum) === firstClaimable;
                        });
                        if (targetBox) {
                            targetBox.click();
                        } else {
                            closeModal();
                        }
                    };
                    return;
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
                                let isPhotoView = false;

                                const showText = () => {
                                    giftImage.innerHTML = `
                                        <div class="paper-text-scroll">${messaggio}</div>
                                        <div class="paper-overlay"></div>
                                    `;
                                };
                                const showPhoto = () => {
                                    giftImage.innerHTML = `<img src="images/photos/day${dayNumber}.png" class="paper-photo" alt="Ricordo">`;
                                };

                                giftImage.addEventListener("click", () => {
                                    if (paperState === 0) {
                                        playSfx('uncrample', 1.1);
                                        if (giftShadow) giftShadow.classList.add("cat-exit");
                                        giftImage.classList.add("paper-mid");
                                        paperState = 1;
                                    } else if (paperState === 1) {
                                        playSfx('uncrample', 0.9);
                                        giftImage.classList.add("paper-opened");
                                        // Pulisce il contenitore sotto e mostra hint
                                        modalDesc.innerHTML = '<p class="hint-text">Clicca sul foglio per scoprire la foto ricordo!</p>';

                                        // Mostra testo
                                        showText();

                                        paperState = 2;
                                    } else if (paperState === 2) {
                                        // Flip logic
                                        if (window.getSelection().toString().length > 0) return;
                                        isPhotoView = !isPhotoView;
                                        if (isPhotoView) showPhoto(); else showText();
                                    }
                                });
                            }, 1200);
                        }, 600);
                    };

                    // PRIMA di startFinalSequence, aggiorna Firebase con aperto: true
                    database.ref(dbPath).update({ aperto: true }).then(() => {
                        console.log(`[Firebase] Aggiornato aperto=true per giorno ${dayNumber}`);

                        // Aggiorna anche la cache locale
                        if (letterineCache[dayNumber]) {
                            letterineCache[dayNumber].aperto = true;
                        }

                        // Rinfresca lo stato visivo (es. rimuove is-claimable e aggiunge al prossimo)
                        initializeCalendar();

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

        // Pulisce il contenuto del modal immediatamente per evitare conflitti con riaperture veloci
        modalBody.innerHTML = "";
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
