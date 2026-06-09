document.addEventListener('DOMContentLoaded', () => {
    // Элементы навигации и разметки
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    
    // Поисковые элементы
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const homeScreen = document.getElementById('home-screen');
    const webViewContainer = document.getElementById('web-view-container');
    const topSearchArea = document.getElementById('top-search-area');
    const searchBox = document.querySelector('.search-box');
    const suggestionsBox = document.getElementById('suggestions-box');
    const logo = document.querySelector('.logo');

    // Элементы Истории, Настроек и Блокнота
    const historyListContainer = document.getElementById('history-list-container');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const juvoxNotepad = document.getElementById('juvox-notepad');
    const proxySelect = document.getElementById('setting-proxy-select');
    const toggleHistorySaveBtn = document.getElementById('btn-toggle-history-save');

    // ==========================================
    // 1. СИСТЕМА ПЕРЕКЛЮЧЕНИЯ И ВЫДВИЖЕНИЯ ВКЛАДОК
    // ==========================================
    
    // Сжатие/расширение боковой панели по клику на ☰
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Роутер экранов (Переключает вкладки как в полноценном приложении)
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('data-target');
            
            // Скрываем абсолютно все экраны
            viewSections.forEach(section => section.classList.add('hidden'));
            if (webViewContainer) webViewContainer.classList.add('hidden');

            // Активируем нужный экран
            if (targetId === 'home-screen') {
                // Если поисковая строка уже свернута наверх, показываем контейнер выдачи
                if (searchBox && searchBox.classList.contains('minimized')) {
                    if (webViewContainer) webViewContainer.classList.remove('hidden');
                } else {
                    if (homeScreen) homeScreen.classList.remove('hidden');
                }
            } else {
                const targetSection = document.getElementById(targetId);
                if (targetSection) targetSection.classList.remove('hidden');
                
                // Специфическая логика загрузки разделов
                if (targetId === 'history-screen') renderHistoryList();
            }
        });
    });

    // ==========================================
    // 2. ИНИЦИАЛИЗАЦИЯ НАСТРОЕК И ТЕМЫ JUVOX
    // ==========================================
    let config = {
        theme: localStorage.getItem('juvox-theme') || 'light',
        saveHistory: localStorage.getItem('juvox-save-history') !== 'false',
        preferredProxy: localStorage.getItem('juvox-proxy') || 'allorigins'
    };

    document.documentElement.setAttribute('data-theme', config.theme);
    if (themeToggle) themeToggle.textContent = config.theme === 'dark' ? '☀️' : '🌙';
    if (proxySelect) proxySelect.value = config.preferredProxy;
    updateHistoryBtnUI();

    // Смена темы оформления
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            config.theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', config.theme);
            themeToggle.textContent = config.theme === 'dark' ? '☀️' : '🌙';
            localStorage.setItem('juvox-theme', config.theme);
        });
    }

    // Настройки прокси-сервера
    if (proxySelect) {
        proxySelect.addEventListener('change', () => {
            config.preferredProxy = proxySelect.value;
            localStorage.setItem('juvox-proxy', config.preferredProxy);
        });
    }

    // Переключатель записи истории
    if (toggleHistorySaveBtn) {
        toggleHistorySaveBtn.addEventListener('click', () => {
            config.saveHistory = !config.saveHistory;
            localStorage.setItem('juvox-save-history', config.saveHistory);
            updateHistoryBtnUI();
        });
    }

    function updateHistoryBtnUI() {
        if (toggleHistorySaveBtn) {
            toggleHistorySaveBtn.textContent = config.saveHistory ? "Запись истории: ВКЛ" : "Запись истории: ВЫКЛ";
            toggleHistorySaveBtn.style.background = config.saveHistory ? "#10b981" : "#ef4444";
            toggleHistorySaveBtn.style.color = "#fff";
        }
    }

    // ==========================================
    // 3. ПОЛЕЗНЫЙ МОДУЛЬ: АВТО-БЛОКНОТ (JUVOX NOTES)
    // ==========================================
    if (juvoxNotepad) {
        // Загружаем старый текст черновика
        juvoxNotepad.value = localStorage.getItem('juvox-notes-data') || '';
        // Сохраняем каждое нажатие клавиши налету
        juvoxNotepad.addEventListener('input', () => {
            localStorage.setItem('juvox-notes-data', juvoxNotepad.value);
        });
    }

    // ==========================================
    // 4. ИСТОРИЯ ПОИСКА (ФУНКЦИОНАЛ)
    // ==========================================
    function saveToHistory(query) {
        if (!config.saveHistory) return;
        let history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
        history.unshift(query);
        if (history.length > 30) history.pop();
        localStorage.setItem('juvox-history', JSON.stringify(history));
    }

    function renderHistoryList() {
        if (!historyListContainer) return;
        const history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        
        if (history.length === 0) {
            historyListContainer.innerHTML = `<p style="opacity:0.6; padding: 20px 0;">История поисковых запросов пуста.</p>`;
            return;
        }

        historyListContainer.innerHTML = '';
        history.forEach(query => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.padding = '12px';
            row.style.borderBottom = '1px solid var(--border-color, #e5e7eb)';
            row.style.alignItems = 'center';

            row.innerHTML = `
                <span class="hist-text" style="cursor:pointer; font-weight:500; color: var(--accent-color, #3b82f6);">${query}</span>
                <button class="delete-single-hist" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.1rem;">×</button>
            `;

            // Повторный поиск по клику на элемент истории
            row.querySelector('.hist-text').addEventListener('click', () => {
                searchInput.value = query;
                const searchTabItem = Array.from(navItems).find(i => i.getAttribute('data-target') === 'home-screen');
                if (searchTabItem) searchTabItem.click();
                launchSearch();
            });

            // Удаление одного конкретного элемента
            row.querySelector('.delete-single-hist').addEventListener('click', () => {
                let currentHistory = JSON.parse(localStorage.getItem('juvox-history')) || [];
                currentHistory = currentHistory.filter(h => h !== query);
                localStorage.setItem('juvox-history', JSON.stringify(currentHistory));
                renderHistoryList();
            });

            historyListContainer.appendChild(row);
        });
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm("Вы действительно хотите полностью стереть историю поиска Juvox?")) {
                localStorage.removeItem('juvox-history');
                renderHistoryList();
            }
        });
    }

    // ==========================================
    // 5. ЖИВЫЕ ПОДСКАЗКИ
    // ==========================================
    if (searchInput && suggestionsBox) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();
            if (query.length < 2) {
                suggestionsBox.classList.add('suggestions-hidden');
                return;
            }

            fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=chrome&q=${query}`)}`)
                .then(res => res.json())
                .then(data => {
                    const suggestions = data[1];
                    if (!suggestions || suggestions.length === 0) return;
                    suggestionsBox.innerHTML = '';
                    suggestionsBox.classList.remove('suggestions-hidden');

                    suggestions.slice(0, 5).forEach(text => {
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';
                        div.textContent = text;
                        div.addEventListener('click', () => {
                            searchInput.value = text;
                            launchSearch();
                        });
                        suggestionsBox.appendChild(div);
                    });
                }).catch(() => {});
        });
    }

    // ==========================================
    // 6. НЕУБИВАЕМЫЙ ДВИЖОК ПОИСКА JUVOX CORE
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
            <div class="loading-status" style="display: flex; flex-direction: column; gap: 12px; align-items: center; padding: 50px;">
                <div style="font-size: 2.5rem; animation: spin 1s linear infinite;">🛸</div>
                <div style="font-weight: bold; letter-spacing: 1px;">ПЕРЕНАПРАВЛЕНИЕ ПОТОКОВ JUVOX...</div>
            </div>
        `;

        const resultsWrapper = document.createElement('div');
        resultsWrapper.className = 'search-results-page';
        resultsWrapper.style.padding = '20px';
        resultsWrapper.style.maxWidth = '800px';
        resultsWrapper.style.margin = '0 auto';

        // --- МОДУЛЬ 1: КАЛЬКУЛЯТОР ---
        if (/^[0-9+\-*/().\s]+$/.test(query) && /[+\-*/]/.test(query)) {
            try {
                const mathResult = Function(`"use strict"; return (${query})`)();
                const calcWidget = document.createElement('div');
                calcWidget.style.background = 'linear-gradient(135deg, #4f46e5, #3b82f6)';
                calcWidget.style.color = '#fff';
                calcWidget.style.padding = '15px 20px';
                calcWidget.style.borderRadius = '10px';
                calcWidget.style.marginBottom = '20px';
                calcWidget.innerHTML = `
                    <div style="font-size: 0.8rem; opacity: 0.8; font-weight: bold;">Вычисление Juvox Engine</div>
                    <div style="font-size: 1.6rem; font-weight: bold;">${query} = ${mathResult}</div>
                `;
                resultsWrapper.appendChild(calcWidget);
            } catch (e) {}
        }

        // --- МОДУЛЬ 2: ОТКРЫТАЯ СПРАВКА (ВИКИПЕДИЯ API) ---
        try {
            const wikiRes = await fetch(`https://ru.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&exintro&explaintext&redirects=1&pithumbsize=400&origin=*&titles=${encodeURIComponent(query)}`);
            const wikiData = await wikiRes.json();
            const pages = wikiData.query.pages;
            const pageId = Object.keys(pages)[0];
            
            if (pageId !== "-1") {
                const page = pages[pageId];
                const text = page.extract ? page.extract.substring(0, 320) + '...' : '';
                const imgUrl = page.thumbnail ? page.thumbnail.source : '';

                if (text) {
                    const wikiWidget = document.createElement('div');
                    wikiWidget.style.background = 'var(--card-bg, #f3f4f6)';
                    wikiWidget.style.border = '1px solid var(--border-color, #e5e7eb)';
                    wikiWidget.style.padding = '15px';
                    wikiWidget.style.borderRadius = '10px';
                    wikiWidget.style.marginBottom = '20px';
                    wikiWidget.style.display = 'flex';
                    wikiWidget.style.gap = '15px';

                    wikiWidget.innerHTML = `
                        ${imgUrl ? `<img src="${imgUrl}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">` : ''}
                        <div>
                            <div style="font-size: 0.8rem; color: #10b981; font-weight: bold;">СПРАВКА JUVOX</div>
                            <h3 style="margin: 3px 0; font-size: 1.25rem;">${page.title}</h3>
                            <p style="font-size: 0.9rem; margin: 5px 0; color: var(--text-muted, #4b5563);">${text}</p>
                            <a href="https://ru.wikipedia.org/?curid=${pageId}" target="_blank" style="color: #3b82f6; font-size: 0.85rem; font-weight: bold; text-decoration:none;">Открыть статью в Википедии →</a>
                        </div>
                    `;
                    resultsWrapper.appendChild(wikiWidget);
                }
            }
        } catch (err) {}

        // --- МОДУЛЬ 3: ОРГАНИЧЕСКИЙ ГЛОБАЛЬНЫЙ ПОИСК С РОТАЦИЕЙ ПРОКСИ ---
        let searchSuccess = false;
        
        // Массив прокси-серверов для поочередного перебора в случае падения
        const proxyUrls = config.preferredProxy === 'allorigins' 
            ? [`https://api.allorigins.win/raw?url=`, `https://corsproxy.io/?`]
            : [`https://corsproxy.io/?`, `https://api.allorigins.win/raw?url=`];

        for (let proxy of proxyUrls) {
            if (searchSuccess) break;
            try {
                const targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
                const response = await fetch(`${proxy}${encodeURIComponent(targetUrl)}`);
                if (!response.ok) continue;

                const htmlText = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                const resultElements = doc.querySelectorAll('.result');

                if (resultElements.length > 0) {
                    const searchHeader = document.createElement('h4');
                    searchHeader.textContent = "Найденные ссылки в глобальной сети:";
                    searchHeader.style.margin = '15px 0 10px 0';
                    searchHeader.style.opacity = '0.6';
                    resultsWrapper.appendChild(searchHeader);

                    resultElements.forEach((el, index) => {
                        if (index > 7) return;
                        const titleEl = el.querySelector('.result__title a');
                        const snippetEl = el.querySelector('.result__snippet');

                        if (titleEl && snippetEl) {
                            let rawUrl = titleEl.getAttribute('href');
                            if (rawUrl.includes('uddg=')) {
                                const parts = rawUrl.split('uddg=');
                                if (parts[1]) rawUrl = decodeURIComponent(parts[1].split('&')[0]);
                            }

                            const card = document.createElement('div');
                            card.className = 'result-card';
                            card.style.marginBottom = '15px';
                            card.style.padding = '15px';
                            card.style.background = 'var(--card-bg, #ffffff)';
                            card.style.borderRadius = '8px';
                            card.style.border = '1px solid var(--border-color, #e5e7eb)';
                            card.innerHTML = `
                                <div style="font-size: 0.75rem; color: #10b981; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${rawUrl}</div>
                                <a href="${rawUrl}" target="_blank" style="font-size: 1.15rem; color: #2563eb; font-weight: bold; text-decoration: none;">${titleEl.textContent.trim()}</a>
                                <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: var(--text-muted, #4b5563); line-height: 1.4;">${snippetEl.textContent.trim()}</p>
                            `;
                            resultsWrapper.appendChild(card);
                        }
                    });
                    searchSuccess = true;
                }
            } catch (e) {
                console.log("Текущий шлюз прокси занят, переключаюсь...");
            }
        }

        // --- МОДУЛЬ ПРЕДОТВРАЩЕНИЯ ОШИБОК: УМНЫЙ ХАБ-РЕДИРЕКТОР ---
        // Если парсинг сети полностью заблокирован внешними серверами, строим умный шлюз-клиент
        if (!searchSuccess) {
            const fallbackWidget = document.createElement('div');
            fallbackWidget.style.marginTop = '20px';
            fallbackWidget.style.padding = '20px';
            fallbackWidget.style.background = 'var(--card-bg, #fef3c7)';
            fallbackWidget.style.border = '1px solid #f59e0b';
            fallbackWidget.style.borderRadius = '10px';
            fallbackWidget.innerHTML = `
                <h4 style="margin:0 0 5px 0; color:#b45309;">🔒 Внешние шлюзы перегружены</h4>
                <p style="font-size:0.9rem; margin:0 0 15px 0; opacity:0.8;">Прямой парсинг заблокирован системами защиты. Чтобы вы мгновенно получили информацию по запросу <strong>"${query}"</strong>, Juvox подготовил шлюзы прямого защищенного перехода:</p>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" style="background:#b45309; color:#fff; text-decoration:none; padding:8px 15px; border-radius:5px; font-weight:bold; font-size:0.85rem;">Искать в Google ↗</a>
                    <a href="https://yandex.ru/search/?text=${encodeURIComponent(query)}" target="_blank" style="background:#3b82f6; color:#fff; text-decoration:none; padding:8px 15px; border-radius:5px; font-weight:bold; font-size:0.85rem;">Искать в Яндекс ↗</a>
                    <a href="https://search.brave.com/search?q=${encodeURIComponent(query)}" target="_blank" style="background:#10b981; color:#fff; text-decoration:none; padding:8px 15px; border-radius:5px; font-weight:bold; font-size:0.85rem;">Искать в Brave ↗</a>
                </div>
            `;
            resultsWrapper.appendChild(fallbackWidget);
        }

        webViewContainer.innerHTML = '';
        webViewContainer.appendChild(resultsWrapper);
    }

    if (searchBtn) searchBtn.addEventListener('click', launchSearch);
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') launchSearch(); });

    // Сброс на главный экран Juvox
    if (logo) {
        logo.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            const searchTabItem = Array.from(navItems).find(i => i.getAttribute('data-target') === 'home-screen');
            if (searchTabItem) searchTabItem.classList.add('active');

            if (homeScreen) homeScreen.classList.remove('hidden');
            if (webViewContainer) webViewContainer.classList.add('hidden');
            if (topSearchArea) topSearchArea.style.display = 'none';
            
            if (searchBox) {
                searchBox.classList.remove('minimized');
                const wrapper = document.querySelector('.search-wrapper');
                if (wrapper) wrapper.prepend(searchBox);
            }
            if (searchInput) searchInput.value = "";
            viewSections.forEach(section => {
                if(section.id !== 'home-screen') section.classList.add('hidden');
            });
        });
    }
});
