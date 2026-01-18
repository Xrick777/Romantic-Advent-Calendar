const checkbox = document.getElementById("checkbox");
checkbox.addEventListener("change", () => {
    document.body.classList.toggle("dark-theme");
});

// Logica per nascondere l'header allo scroll
let lastScrollTop = 0;
const header = document.getElementById("header");

window.addEventListener("scroll", () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > 50) {
        // Scroll verso il basso
        header.style.transform = "translateY(-100%)";
    } else {
        // Scroll verso l'alto
        header.style.transform = "translateY(0)";
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});