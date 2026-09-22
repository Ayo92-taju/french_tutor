// Shared by index.html and meet-dr-taju.html.

// Navbar scroll
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

// Mobile menu
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobile-menu').classList.toggle('open');
});
function closeMobile() {
  document.getElementById('mobile-menu').classList.remove('open');
}
