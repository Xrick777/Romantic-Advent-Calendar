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
