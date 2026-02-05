const openMenu = document.getElementById('openMenu');
const closeMenu = document.getElementById('closeMenu');
const nav = document.getElementById('sideNav');

// Initial state
nav.classList.remove('open');
openMenu.style.display = 'inline-flex';
closeMenu.style.display = 'none';

openMenu.addEventListener('click', () => {
    nav.classList.add('open');
    openMenu.style.display = 'none';
    closeMenu.style.display = 'inline-flex';
});

closeMenu.addEventListener('click', () => {
    nav.classList.remove('open');
    closeMenu.style.display = 'none';
    openMenu.style.display = 'inline-flex';
});