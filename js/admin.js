/**
 * Admin Panel JavaScript
 * Handles authentication and article CRUD operations using localStorage
 */

(function () {
    'use strict';

    // Configuration
    const ADMIN_PASSWORD = 'crown2026';
    const STORAGE_KEY = 'crownheights_articles';
    const GALLERY_KEY = 'crownheights_gallery';
    const SESSION_KEY = 'crownheights_admin_session';

    // Shared Helper functions
    function getArticles() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function getGallery() {
        try {
            return JSON.parse(localStorage.getItem(GALLERY_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveGallery(images) {
        localStorage.setItem(GALLERY_KEY, JSON.stringify(images));
    }

    function saveArticles(articles) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Expose article helpers globally
    window.crownheightsArticles = {
        getAll: getArticles,
        formatDate: formatDate
    };

    // --- Gallery Logic ---
    function initGalleryAdmin() {
        const trigger = document.getElementById('add-image-trigger');
        const fileInput = document.getElementById('gallery-file-input');
        const container = document.getElementById('dynamic-gallery');

        if (!trigger || !fileInput || !container) return;

        // Initial render
        renderGallery();

        trigger.addEventListener('click', () => {
            const password = prompt("Admin access required. Please enter password:");
            if (password === ADMIN_PASSWORD) {
                fileInput.click();
            } else if (password !== null) {
                alert("Incorrect password!");
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Optional: Limit file size to prevent localStorage overflow (~2MB limit per image)
            if (file.size > 2 * 1024 * 1024) {
                alert("File is too large! Please use images smaller than 2MB.");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target.result;
                const images = getGallery();
                images.push({
                    id: Date.now().toString(),
                    src: imageData,
                    timestamp: new Date().toISOString()
                });
                saveGallery(images);
                renderGallery();
            };
            reader.readAsDataURL(file);
        });

        function renderGallery() {
            const images = getGallery();
            container.innerHTML = images.map(img => `
                <div class="gallery-item animate-on-scroll in-view" style="position: relative;">
                    <img src="${img.src}" alt="Gallery Image">
                    <div class="gallery-overlay" style="opacity: 0; pointer-events: none;"><i class="fa-solid fa-plus"></i></div>
                    <button class="delete-gallery-btn" onclick="crownheightsGallery.delete('${img.id}')" 
                        style="position: absolute; top: 10px; right: 10px; background: rgba(255,0,0,0.7); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; z-index: 10;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }

        // Global delete access
        window.crownheightsGallery = {
            delete: (id) => {
                const password = prompt("Confirm deletion. Enter admin password:");
                if (password === ADMIN_PASSWORD) {
                    const images = getGallery().filter(img => img.id !== id);
                    saveGallery(images);
                    renderGallery();
                } else if (password !== null) {
                    alert("Incorrect password!");
                }
            }
        };
    }

    // Call gallery init if elements exist
    document.addEventListener('DOMContentLoaded', initGalleryAdmin);

    // --- Admin Panel Page Initialization ---
    const loginForm = document.getElementById('login-form');
    const adminPanel = document.getElementById('admin-panel');

    // Only run admin-specific code if we are on the admin page
    if (loginForm && adminPanel) {
        initAdmin();
    }

    function initAdmin() {
        const passwordInput = document.getElementById('admin-password');
        const loginBtn = document.getElementById('login-btn');
        const loginError = document.getElementById('login-error');
        const logoutBtn = document.getElementById('logout-btn');
        const articleForm = document.getElementById('article-form');
        const articleSuccess = document.getElementById('article-success');
        const articlesContainer = document.getElementById('articles-container');

        // Check if already logged in
        if (sessionStorage.getItem(SESSION_KEY) === 'true') {
            showAdminPanel();
        }

        // Event Listeners
        loginBtn.addEventListener('click', handleLogin);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        logoutBtn.addEventListener('click', handleLogout);
        articleForm.addEventListener('submit', handleAddArticle);

        // Load existing articles
        renderArticles();

        function handleLogin() {
            const password = passwordInput.value.trim();

            if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem(SESSION_KEY, 'true');
                loginError.style.display = 'none';
                showAdminPanel();
            } else {
                loginError.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        }

        function handleLogout() {
            sessionStorage.removeItem(SESSION_KEY);
            adminPanel.style.display = 'none';
            loginForm.style.display = 'block';
            passwordInput.value = '';
        }

        function showAdminPanel() {
            loginForm.style.display = 'none';
            adminPanel.style.display = 'block';
            renderArticles();
        }

        function handleAddArticle(e) {
            e.preventDefault();

            const title = document.getElementById('article-title').value.trim();
            const date = document.getElementById('article-date').value;
            const summary = document.getElementById('article-summary').value.trim();
            const content = document.getElementById('article-content').value.trim();
            const image = document.getElementById('article-image').value.trim();

            if (!title || !date || !summary || !content) {
                alert('Please fill in all required fields.');
                return;
            }

            const article = {
                id: Date.now().toString(),
                title,
                date,
                summary,
                content,
                image: image || null,
                createdAt: new Date().toISOString()
            };

            // Save to localStorage
            const articles = getArticles();
            articles.unshift(article);
            saveArticles(articles);

            // Reset form
            articleForm.reset();

            // Show success message
            articleSuccess.style.display = 'block';
            setTimeout(() => {
                articleSuccess.style.display = 'none';
            }, 3000);

            // Re-render articles list
            renderArticles();
        }

        function handleDeleteArticle(id) {
            if (!confirm('Are you sure you want to delete this article?')) return;

            const articles = getArticles().filter(a => a.id !== id);
            saveArticles(articles);
            renderArticles();
        }

        function renderArticles() {
            const articles = getArticles();

            if (articles.length === 0) {
                articlesContainer.innerHTML = `
                <div class="no-articles">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                    <p>No custom articles yet. Add your first article above!</p>
                </div>
            `;
                return;
            }

            articlesContainer.innerHTML = articles.map(article => `
            <div class="article-item">
                <div>
                    <h4>${escapeHtml(article.title)}</h4>
                    <span>${formatDate(article.date)}</span>
                </div>
                <button class="delete-btn" onclick="deleteArticle('${article.id}')">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        `).join('');
        }

        // Expose delete function globally for onclick handlers
        window.deleteArticle = handleDeleteArticle;
    }

})();
