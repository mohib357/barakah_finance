// hamburger menu toggle
function toggleMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    mobileMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
}

// smooth scroll to sections
function scrollTo(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const navHeight = document.querySelector('nav').offsetHeight;
        window.scrollTo({ top: element.offsetTop - navHeight, behavior: 'smooth' });
    }

    // mobile menu
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    if (mobileMenu?.classList.contains('active')) {
        mobileMenu.classList.remove('active');
        hamburger?.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// login modal placeholder
function openLoginModal() {
    console.log('Login modal opened');
}

// navbar style on scroll
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    const isScrolled = window.scrollY > 50;
    nav.style.background = isScrolled ? 'rgba(13, 43, 26, 0.98)' : 'rgba(13, 43, 26, 0.95)';
    nav.style.backdropFilter = isScrolled ? 'blur(15px)' : 'blur(12px)';
});