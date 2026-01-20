/**
 * Admin Panel JavaScript
 * Handles authentication and article CRUD operations using Firebase Firestore
 * Fallback to localStorage provided for offline development
 */

import { db, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, getDoc } from './firebase-config.js';

(function () {
    'use strict';

    // Configuration
    const ADMIN_PASSWORD = 'crown2026';
    const STORAGE_KEY = 'crownheights_articles';
    const GALLERY_KEY = 'crownheights_gallery';
    const SESSION_KEY = 'crownheights_admin_session';

    // State
    let editingArticleId = null;

    // --- Firebase / Storage Helper functions ---

    // Check if Firebase is configured (not using placeholder keys)
    function isFirebaseConfigured() {
        return !window.location.protocol.includes('file') && !window.firebaseConfig?.apiKey?.includes('YOUR_');
    }

    async function getArticles() {
        try {
            // Attempt Firebase first
            const q = query(collection(db, "articles"), orderBy("date", "desc"));
            const querySnapshot = await getDocs(q);
            const firebaseArticles = [];
            querySnapshot.forEach((doc) => {
                firebaseArticles.push({ id: doc.id, ...doc.data() });
            });

            if (firebaseArticles.length > 0) return firebaseArticles;
        } catch (e) {
            console.warn("Firebase fetch failed, falling back to localStorage", e);
        }

        // Fallback to localStorage
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    async function getGallery() {
        try {
            const q = query(collection(db, "gallery"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const firebaseImages = [];
            querySnapshot.forEach((doc) => {
                firebaseImages.push({ id: doc.id, ...doc.data() });
            });
            if (firebaseImages.length > 0) return firebaseImages;
        } catch (e) {
            console.warn("Firebase gallery fetch failed", e);
        }

        try {
            return JSON.parse(localStorage.getItem(GALLERY_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    async function saveGalleryImage(imgData) {
        try {
            const newImg = {
                src: imgData,
                timestamp: new Date().toISOString()
            };
            await addDoc(collection(db, "gallery"), newImg);
        } catch (e) {
            console.error("Firebase save failed", e);
            // Fallback to local
            const images = JSON.parse(localStorage.getItem(GALLERY_KEY)) || [];
            images.push({ id: Date.now().toString(), src: imgData, timestamp: new Date().toISOString() });
            localStorage.setItem(GALLERY_KEY, JSON.stringify(images));
        }
    }

    async function deleteGalleryImage(id) {
        try {
            await deleteDoc(doc(db, "gallery", id));
        } catch (e) {
            // Fallback local delete
            const images = (JSON.parse(localStorage.getItem(GALLERY_KEY)) || []).filter(img => img.id !== id);
            localStorage.setItem(GALLERY_KEY, JSON.stringify(images));
        }
    }

    async function saveArticle(article) {
        try {
            if (editingArticleId) {
                await updateDoc(doc(db, "articles", editingArticleId), article);
            } else {
                await addDoc(collection(db, "articles"), article);
            }
            return true;
        } catch (e) {
            console.error("Firebase article save/update failed", e);
            alert("Firebase Error: " + e.message + "\n\nPlease check if your Firestore Rules are set to 'allow read, write: if true;'.");

            // Local fallback
            try {
                const articles = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
                if (editingArticleId) {
                    const idx = articles.findIndex(a => a.id === editingArticleId);
                    if (idx !== -1) articles[idx] = { ...article, id: editingArticleId };
                } else {
                    articles.unshift({ ...article, id: Date.now().toString() });
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
                return true;
            } catch (localErr) {
                console.error("Storage fallback failed", localErr);
                return false;
            }
        }
    }

    async function deleteArticleFirebase(id) {
        try {
            await deleteDoc(doc(db, "articles", id));
        } catch (e) {
            const articles = (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).filter(a => a.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
        }
    }

    function formatDate(dateString) {
        if (!dateString) return 'Date unknown';
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
    async function initGalleryAdmin() {
        const trigger = document.getElementById('add-image-trigger');
        const fileInput = document.getElementById('gallery-file-input');
        const container = document.getElementById('dynamic-gallery');

        if (!trigger || !fileInput || !container) return;

        // Initial render
        await renderGallery();

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

            if (file.size > 1 * 1024 * 1024) {
                alert("File is too large! Please use images smaller than 1MB to save database space.");
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                const imageData = event.target.result;
                await saveGalleryImage(imageData);
                await renderGallery();
            };
            reader.readAsDataURL(file);
        });

        async function renderGallery() {
            const images = await getGallery();
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
            delete: async (id) => {
                const password = prompt("Confirm deletion. Enter admin password:");
                if (password === ADMIN_PASSWORD) {
                    await deleteGalleryImage(id);
                    await renderGallery();
                } else if (password !== null) {
                    alert("Incorrect password!");
                }
            }
        };
    }

    // Call gallery init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGalleryAdmin);
    } else {
        initGalleryAdmin();
    }

    // --- Admin Panel Page Initialization ---
    const loginForm = document.getElementById('login-form');
    const adminPanel = document.getElementById('admin-panel');

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
        const formTitle = document.getElementById('form-title');
        const cancelEditBtn = document.getElementById('cancel-edit');

        if (sessionStorage.getItem(SESSION_KEY) === 'true') {
            showAdminPanel();
        }

        loginBtn.addEventListener('click', handleLogin);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        logoutBtn.addEventListener('click', handleLogout);
        articleForm.addEventListener('submit', handleAddArticle);
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', handleCancelEdit);

        // Test connection button (helpful for debugging)
        const testBtn = document.createElement('button');
        testBtn.innerHTML = '<i class="fa-solid fa-plug"></i> Test Connection';
        testBtn.style = "background: #6c757d; color: white; border: none; padding: 5px 15px; border-radius: 8px; cursor: pointer; margin-top: 10px; font-size: 0.8rem;";
        testBtn.onclick = async () => {
            try {
                console.log("Testing connection...");
                const q = query(collection(db, "articles"), orderBy("date", "desc"), 1);
                await getDocs(q);
                alert("Connection successful! Database is responding.");
            } catch (e) {
                console.error("Connection test failed", e);
                alert("Connection failed: " + e.message);
            }
        };
        adminPanel.querySelector('.admin-header').appendChild(testBtn);

        async function handleLogin() {
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

        async function showAdminPanel() {
            loginForm.style.display = 'none';
            adminPanel.style.display = 'block';
            await renderArticles();
        }

        async function handleAddArticle(e) {
            e.preventDefault();
            console.log("Submit button clicked!");

            const titleEl = document.getElementById('article-title');
            const dateEl = document.getElementById('article-date');
            const summaryEl = document.getElementById('article-summary');
            const contentEl = document.getElementById('article-content');
            const imageEl = document.getElementById('article-image');

            if (!titleEl || !dateEl || !summaryEl || !contentEl) {
                console.error("Form elements not found!");
                return;
            }

            const title = titleEl.value.trim();
            const date = dateEl.value;
            const summary = summaryEl.value.trim();
            const content = contentEl.value.trim();
            const image = imageEl ? imageEl.value.trim() : "";

            if (!title || !date || !summary || !content) {
                alert('Please fill in all required fields.');
                return;
            }

            const submitBtn = articleForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

                const article = {
                    title,
                    date,
                    summary,
                    content,
                    image: image || null,
                    updatedAt: new Date().toISOString()
                };

                if (!editingArticleId) {
                    article.createdAt = new Date().toISOString();
                }

                const success = await saveArticle(article);

                if (success) {
                    articleForm.reset();
                    const isEditing = !!editingArticleId;
                    handleCancelEdit(); // Reset edit state

                    articleSuccess.textContent = isEditing ? 'Article updated successfully!' : 'Article added successfully!';
                    articleSuccess.style.display = 'block';
                    setTimeout(() => {
                        articleSuccess.style.display = 'none';
                    }, 3000);

                    await renderArticles();
                }
            } catch (err) {
                console.error("Submission error", err);
                alert("An unexpected error occurred: " + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }

        async function handleEditArticle(id) {
            editingArticleId = id;
            try {
                const docSnap = await getDoc(doc(db, "articles", id));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    document.getElementById('article-title').value = data.title;
                    document.getElementById('article-date').value = data.date;
                    document.getElementById('article-summary').value = data.summary;
                    document.getElementById('article-content').value = data.content;
                    document.getElementById('article-image').value = data.image || '';

                    if (formTitle) formTitle.textContent = 'Edit Article';
                    if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';

                    // Scroll to form
                    articleForm.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (e) {
                console.error("Fetch article for edit failed", e);
            }
        }

        function handleCancelEdit() {
            editingArticleId = null;
            articleForm.reset();
            if (formTitle) formTitle.textContent = 'Add New Article';
            if (cancelEditBtn) cancelEditBtn.style.display = 'none';
        }

        async function handleDeleteArticle(id) {
            if (!confirm('Are you sure you want to delete this article?')) return;
            await deleteArticleFirebase(id);
            if (editingArticleId === id) handleCancelEdit();
            await renderArticles();
        }

        async function renderArticles() {
            const articles = await getArticles();

            if (articles.length === 0) {
                articlesContainer.innerHTML = `
                    <div class="no-articles">
                        <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                        <p>No announcements yet. Add your first one above!</p>
                    </div>
                `;
                return;
            }

            articlesContainer.innerHTML = articles.map(article => `
                <div class="article-item">
                    <div style="flex: 1;">
                        <h4 style="margin-bottom: 5px;">${escapeHtml(article.title)}</h4>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${formatDate(article.date)}</span>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="edit-btn" onclick="editArticle('${article.id}')" style="background: var(--primary-purple); color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer;">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteArticle('${article.id}')" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer;">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }

        window.deleteArticle = handleDeleteArticle;
        window.editArticle = handleEditArticle;
    }

})();

