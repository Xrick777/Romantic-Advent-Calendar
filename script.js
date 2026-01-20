const checkbox = document.getElementById("checkbox");

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
            const dayNumber = box.innerText;
            // Qui puoi personalizzare il contenuto del modal in base al giorno
            modalBody.innerHTML = `
                <h2>Giorno ${dayNumber}</h2>
                <div class="modal-gift-container">
                    <div class="vibration-fx left"></div>
                    <div class="modal-gift-image"></div>
                    <div class="vibration-fx right"></div>
                    <div class="gift-shadow"></div>
                </div>
                <p>Apri il regalo per scoprire il contenuto speciale!</p>
                <button class="claim-btn">Riscatta</button>
            `;
            modal.classList.add("active");
            document.body.style.overflow = "hidden"; // Previene lo scroll della pagina
        });
    });

    const closeModal = () => {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
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
        document.getElementById("days").innerText = "00";
        document.getElementById("hours").innerText = "00";
        document.getElementById("minutes").innerText = "00";
        document.getElementById("seconds").innerText = "00";
        return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById("days").innerText = d.toString().padStart(2, '0');
    document.getElementById("hours").innerText = h.toString().padStart(2, '0');
    document.getElementById("minutes").innerText = m.toString().padStart(2, '0');
    document.getElementById("seconds").innerText = s.toString().padStart(2, '0');
}

if (document.getElementById("countdown")) {
    setInterval(updateCountdown, 1000);
    updateCountdown();
}
