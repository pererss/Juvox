document.addEventListener('DOMContentLoaded', () => {
    // Навигация
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    
    // Поиск
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const homeScreen = document.getElementById('home-screen');
    const webViewContainer = document.getElementById('web-view-container');
    const topSearchArea = document.getElementById('top-search-area');
    const searchBox = document.querySelector('.search-box');
    const suggestionsBox = document.getElementById('suggestions-box');
    const logo = document.querySelector('.logo');

    // Окна и инструменты
    const toolsMenuBtn = document.getElementById('tools-menu-btn');
    const floatingToolsPanel = document.getElementById('floating-tools-panel');
    const closeToolsBtn = document.getElementById('close-tools-btn');
    const genPassBtn = document.getElementById('tool-gen-pass-btn');
    const passOutput = document.getElementById('tool-pass-output');
    const textCounter = document.getElementById('tool-text-counter');
    const counterResult = document.getElementById('tool-counter-result');

    const historyListContainer = document.getElementById('history-list-container');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const juvoxNotepad = document.getElementById('juvox-notepad');
    const proxySelect = document.getElementById('setting-proxy-select');
    const toggleHistorySaveBtn = document.getElementById('btn-toggle-history-save');

    // ==========================================
    // УПРАВЛЕНИЕ МЕНЮ И ИНСТРУМЕНТАМИ
    // ==========================================
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }

    if (toolsMenuBtn && floatingToolsPanel) {
        toolsMenuBtn.addEventListener('click', () => floatingToolsPanel.classList.toggle('tools-panel-hidden'));
    }
    if (closeToolsBtn && floatingToolsPanel) {
        closeToolsBtn.addEventListener('click', () => floatingToolsPanel.classList.add('tools-panel-hidden'));
    }

    // Логика инструмента: генератор паролей
    if (genPassBtn && passOutput) {
        genPassBtn.addEventListener('click', () => {
            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
            let pass = "";
            for (let i = 0; i < 14; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
            passOutput.value = pass;
        });
    }

    // Логика инструмента: подсчет текста
    if (textCounter && counterResult) {
        textCounter.addEventListener('input', () => {
            const txt = textCounter.value;
            const chars = txt.length;
            const words = txt.trim() === "" ? 0 : txt.trim().split(/\s+/).length;
            counterResult.textContent = `Символов: ${chars} | Слов: ${words}`;
        });
    }

    // Переключение экранов
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.id === 'tools-menu-btn') return; // Не переключает экраны
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            floatingToolsPanel.classList.add('tools-panel-hidden');

            const targetId = item.getAttribute('data-target');
            viewSections.forEach(section => section.classList.add('hidden'));
            if (webViewContainer) webViewContainer.classList.add('hidden');

            if (targetId === 'home-screen') {
                if (searchBox && searchBox.classList.contains('minimized')) {
                    if (webViewContainer) webViewContainer.classList.remove('hidden');
                } else {
                    if (homeScreen) homeScreen.classList.remove('hidden');
                }
            } else {
                const targetSection = document.getElementById(targetId);
                if (targetSection) targetSection.classList.remove('hidden');
                if (targetId === 'history-screen') renderHistoryList();
            }
        });
    });

    // Настройки
    let config = {
        theme: localStorage.getItem('juvox-theme') || 'light',
        saveHistory: localStorage.getItem('juvox-save-history') !== 'false',
        preferredProxy: localStorage.getItem('juvox-proxy') || 'allorigins'
    };
    document.documentElement.setAttribute('data-theme', config.theme);
    if (themeToggle) themeToggle.textContent = config.theme === 'dark' ? '☀️' : '🌙';
    if (proxySelect) proxySelect.value = config.preferredProxy;

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            config.theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', config.theme);
            themeToggle.textContent = config.theme === 'dark' ? '☀️' : '🌙';
            localStorage.setItem('juvox-theme', config.theme);
        });
    }

    if (juvoxNotepad) {
        juvoxNotepad.value = localStorage.getItem('juvox-notes-data') || '';
        juvoxNotepad.addEventListener('input', () => localStorage.setItem('juvox-notes-data', juvoxNotepad.value));
    }

    function saveToHistory(query) {
        if (!config.saveHistory) return;
        let history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        history = history.filter(item => item !== query);
        history.unshift(query);
        localStorage.setItem('juvox-history', JSON.stringify(history.slice(0, 20)));
    }

    function renderHistoryList() {
        if (!historyListContainer) return;
        const history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        if (history.length === 0) {
            historyListContainer.innerHTML = `<p style="opacity:0.6; padding:15px;">История пуста.</p>`;
            return;
        }
        historyListContainer.innerHTML = '';
        history.forEach(query => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid var(--border-color); align-items:center;';
            row.innerHTML = `<span class="h-tx" style="cursor:pointer; color:var(--accent-color);">${query}</span><button class="del-h" style="background:none; border:none; color:red; cursor:pointer;">×</button>`;
            row.querySelector('.h-tx').addEventListener('click', () => {
                searchInput.value = query;
                launchSearch();
            });
            row.querySelector('.del-h').addEventListener('click', () => {
                let current = JSON.parse(localStorage.getItem('juvox-history')) || [];
                localStorage.setItem('juvox-history', JSON.stringify(current.filter(h => h !== query)));
                renderHistoryList();
            });
            historyListContainer.appendChild(row);
        });
    }

    // ==========================================
    // УМНЫЙ АГРЕГАТОР ПОИСКА JUVOX CORE
    // ==========================================
    async function launchSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        if (suggestionsBox) suggestionsBox.classList.add('suggestions-hidden');
        saveToHistory(query);

        if (homeScreen) homeScreen.classList.add('hidden');
        if (webViewContainer) webViewContainer.classList.remove('hidden');
        
        if (topSearchArea && searchBox) {
            topSearchArea.style.display = 'block';
            searchBox.classList.add('minimized');
            topSearchArea.appendChild(searchBox);
        }

        webViewContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:10px; align-items:center; padding:50px;">
                <div style="font-size:2.5rem; animation:spin 1s linear infinite;">🛸</div>
                <div style="font-weight:bold;">ФИЛЬТРАЦИЯ БАЗ ДАННЫХ JUVOX...</div>
            </div>
        `;

        // Собираем выбранные сайты
        const checkedSites = Array.from(document.querySelectorAll('.filter-grid input:checked')).map(cb => cb.value);
        
        // Строим хитрый операторный запрос под DDG
        let finalSearchQuery = query;
        if (checkedSites.length > 0) {
            const siteOperators = checkedSites.map(site => `site:${site}`).join(' OR ');
            finalSearchQuery = `(${siteOperators}) ${query}`;
        }

        const resultsWrapper = document.createElement('div');
        resultsWrapper.style.cssText = 'padding:10px; max-width:700px; margin:0 auto;';

        let searchSuccess = false;
        const proxy = config.preferredProxy === 'allorigins' ? 'https://api.allorigins.win/raw?url=' : 'https://corsproxy.io/?';

        try {
            const targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(finalSearchQuery)}`;
            const response = await fetch(`${proxy}${encodeURIComponent(targetUrl)}`);
            
            if (response.ok) {
                const htmlText = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                const resultElements = doc.querySelectorAll('.result');

                if (resultElements.length > 0) {
                    resultElements.forEach((el, index) => {
                        if (index > 12) return;
                        const titleEl = el.querySelector('.result__title a');
                        const snippetEl = el.querySelector('.result__snippet');

                        if (titleEl && snippetEl) {
                            let rawUrl = titleEl.getAttribute('href');
                            if (rawUrl.includes('uddg=')) {
                                rawUrl = decodeURIComponent(rawUrl.split('uddg=')[1].split('&')[0]);
                            }

                            // Определяем красивый шильдик источника
                            let sourceName = "Ресурс";
                            if (rawUrl.includes('wikipedia.org')) sourceName = "Wikipedia";
                            else if (rawUrl.includes('reddit.com')) sourceName = "Reddit";
                            else if (rawUrl.includes('habr.com')) sourceName = "Habr";
                            else if (rawUrl.includes('stackoverflow.com')) sourceName = "StackOverflow";
                            else if (rawUrl.includes('github.com')) sourceName = "GitHub";
                            else if (rawUrl.includes('youtube.com')) sourceName = "YouTube";
                            else if (rawUrl.includes('quora.com')) sourceName = "Quora";
                            else if (rawUrl.includes('mozilla.org')) sourceName = "MDN Docs";
                            else if (rawUrl.includes('fandom.com')) sourceName = "Fandom";
                            else if (rawUrl.includes('imdb.com')) sourceName = "IMDb";

                            const card = document.createElement('div');
                            card.style.cssText = 'background:var(--bg-card); border:1px solid var(--border-color); border-radius:10px; padding:15px; margin-bottom:15px; box-shadow:var(--shadow-sm);';
                            
                            card.innerHTML = `
                                <span class="hub-badge">${sourceName}</span>
                                <div style="font-size:1.15rem; font-weight:bold; margin-bottom:5px;">${titleEl.textContent.trim()}</div>
                                <div class="snippet-wrapper">${snippetEl.textContent.trim()}</div>
                                <button class="btn-toggle-snippet">Читать далее ▼</button>
                                <div style="margin-top:5px;"><a href="${rawUrl}" target="_blank" class="btn-go-site">Перейти на сайт источника ↗</a></div>
                            `;

                            // Логика кнопки Раскрыть / Скрыть больше
                            const sw = card.querySelector('.snippet-wrapper');
                            const btnToggle = card.querySelector('.btn-toggle-snippet');
                            btnToggle.addEventListener('click', () => {
                                sw.classList.toggle('expanded');
                                btnToggle.textContent = sw.classList.contains('expanded') ? 'Свернуть ▲' : 'Читать далее ▼';
                            });

                            resultsWrapper.appendChild(card);
                        }
                    });
                    searchSuccess = true;
                }
            }
        } catch (e) { console.log(e); }

        // Нижняя панель глобального поиска (Обеспечивает 100% стабильность)
        const fallbackWidget = document.createElement('div');
        fallbackWidget.style.cssText = 'margin-top:25px; padding:15px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:10px;';
        fallbackWidget.innerHTML = `
            <h4 style="margin-bottom:8px;">🔍 Глобальный поиск Juvox</h4>
            <p style="font-size:0.85rem; margin-bottom:12px; opacity:0.8;">Продублировать запрос <strong>"${query}"</strong> во внешние мировые системы:</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" class="btn-go-site" style="background:#4285F4; color:white;">Google</a>
                <a href="https://yandex.ru/search/?text=${encodeURIComponent(query)}" target="_blank" class="btn-go-site" style="background:#ffcc00; color:black;">Яндекс</a>
                <a href="https://search.brave.com/search?q=${encodeURIComponent(query)}" target="_blank" class="btn-go-site" style="background:#ff4500; color:white;">Brave</a>
            </div>
        `;
        resultsWrapper.appendChild(fallbackWidget);

        webViewContainer.innerHTML = '';
        webViewContainer.appendChild(resultsWrapper);
    }

    if (searchBtn) searchBtn.addEventListener('click', launchSearch);
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') launchSearch(); });

    if (logo) {
        logo.addEventListener('click', () => {
            if (homeScreen) homeScreen.classList.remove('hidden');
            if (webViewContainer) webViewContainer.classList.add('hidden');
            if (topSearchArea) topSearchArea.style.display = 'none';
            if (searchBox) {
                searchBox.classList.remove('minimized');
                document.querySelector('.search-wrapper').insertBefore(searchBox, document.querySelector('.filter-container'));
            }
            if (searchInput) searchInput.value = "";
        });
    }
});
