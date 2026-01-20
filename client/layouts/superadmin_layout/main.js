const openMenu = document.getElementById('openMenu');
const closeMenu = document.getElementById('closeMenu');
const nav = document.getElementById('sideNav');

// initial state: nav closed
nav.classList.remove('open');
openMenu.classList.add('active');   // show openMenu
closeMenu.classList.remove('active'); // hide closeMenu

openMenu.addEventListener('click', () => {
    nav.classList.toggle('open');            // toggle nav
    openMenu.classList.toggle('active');     // hide openMenu
    closeMenu.classList.toggle('active');    // show closeMenu
});

closeMenu.addEventListener('click', () => {
    nav.classList.toggle('open');            // toggle nav
    closeMenu.classList.toggle('active');    // hide closeMenu
    openMenu.classList.toggle('active');     // show openMenu
});
