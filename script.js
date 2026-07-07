const menuButton = document.querySelector("#menuButton");
const navLinks = document.querySelector("#navLinks");
const year = document.querySelector("#year");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

if (year) {
  year.textContent = new Date().getFullYear();
}