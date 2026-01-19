
document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', currentTheme);

    // Update icon based on current theme
    const updateThemeIcon = (theme) => {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    };

    if (themeToggle) {
        updateThemeIcon(currentTheme);

        // Toggle theme on button click
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    // --- Mobile Menu Toggle ---
    const mobileMenuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');

            const icon = mobileMenuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // --- Secret Admin Access (4 Clicks on Logo) ---
    const logo = document.querySelector('.logo');
    let clickCount = 0;
    let clickTimer = null;

    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent immediate navigation
            clickCount++;

            // Reset timer on each click
            if (clickTimer) clearTimeout(clickTimer);

            // Set delay to check for more clicks
            clickTimer = setTimeout(() => {
                if (clickCount >= 4) {
                    // Secret Admin Access
                    // Determine path based on current location
                    const href = logo.getAttribute('href');
                    if (href.includes('../')) {
                        window.location.href = '../admin.html';
                    } else {
                        window.location.href = 'admin.html';
                    }
                } else {
                    // Normal Navigation
                    window.location.href = logo.getAttribute('href');
                }
                // Reset count
                clickCount = 0;
            }, 400); // 400ms window
        });
    }

    // --- Scroll Animations ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            } else {
                entry.target.classList.remove('in-view');
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll, .hero-title, .hero-subtitle, .animate-up, .animate-hidden, .timeline-item');
    animatedElements.forEach((el) => {
        el.classList.add('animate-hidden');
        observer.observe(el);
    });

    // --- Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    // --- Tab Switching Logic ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button and target content
            btn.classList.add('active');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
    // --- Event Countdown Timers ---
    function updateCountdowns() {
        const now = new Date().getTime();
        const countdownElements = document.querySelectorAll('[data-event-date]');

        countdownElements.forEach(el => {
            const dateStr = el.getAttribute('data-event-date');
            const eventDate = new Date(dateStr).getTime();
            const distance = eventDate - now;

            const badge = el.querySelector('.countdown-badge');
            if (!badge) return;

            if (distance < 0) {
                badge.style.display = 'none';
                return;
            }

            // Calculations for days, hours, minutes and seconds
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            let countdownText = "";
            if (days > 0) {
                countdownText = `${days}d ${hours}h left`;
            } else if (hours > 0) {
                countdownText = `${hours}h ${minutes}m left`;
            } else {
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                countdownText = `${minutes}m ${seconds}s left`;
            }

            badge.innerHTML = `<i class="fa-solid fa-clock"></i> ${countdownText}`;
            badge.style.display = 'block';
        });
    }

    // Run every second
    setInterval(updateCountdowns, 1000);
    updateCountdowns(); // Initial call

    // --- Gallery Lightbox ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');

    if (lightbox && lightboxImg) {
        // Open Lightbox (Event Delegation)
        document.addEventListener('click', (e) => {
            const galleryItem = e.target.closest('.gallery-item');

            // If we clicked inside a gallery item, but NOT the delete button or the upload trigger
            if (galleryItem && !e.target.closest('.delete-gallery-btn') && !galleryItem.id.includes('trigger')) {
                const img = galleryItem.querySelector('img');
                if (img) {
                    lightboxImg.src = img.src;
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Prevent background scroll
                }
            }
        });

        // Close functions
        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        };

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target === closeBtn) {
                closeLightbox();
            }
        });

        // ESC Key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });
    }

    // Make it available globally for dynamic content
    window.initEventCountdowns = updateCountdowns;
});
