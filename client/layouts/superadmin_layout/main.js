const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('sideNav');
const img = menuToggle.querySelector('img');

const openIcon = '../../img/menu-icon.svg';
const closeIcon = '../../img/close-icon.svg';

menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open'); // toggle class directly

    // toggle image src based on nav state
    if (nav.classList.contains('open')) {
        img.src = closeIcon;
    } else {
        img.src = openIcon;
    }
});
