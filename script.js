document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const homeScreen = document.getElementById('home-screen');
    const webViewContainer = document.getElementById('web-view-container');
    const topSearchArea = document.getElementById('top-search-area');
    const searchBox = document.querySelector('.search-box');
    const tabsContainer = document.getElementById('tabs-container');
    const suggestionsBox = document.getElementById('suggestions-box');
    const historyBtn = document.getElementById('history-btn');
    const settingsBtn = document.getElementById('settings-btn');

    let lastSearchResultsHTML = ""; 

    // ЗАГРУЗКА НАСТРОЕК (По умолчанию или из локальной памяти)
    let config = {
        theme: localStorage.getItem('juvox-theme') || 'light',
        bgStyle: localStorage.getItem('juvox-bg') || 'default',
        searchNode: localStorage.getItem('juvox-node') || 'auto',
        saveHistory: localStorage.getItem('juvox-save-history') !== 'false'
    };

    // Применение настроек при старте
    document.documentElement.setAttribute('data-theme', config.theme);
    document.body.setAttribute('data-bg', config.bgStyle);
    themeToggle.textContent = config.theme === 'dark' ? '☀️' : '🌙';

    // 1. УПРАВЛЕНИЕ ТЕМОЙ
    themeToggle.addEventListener('click', () => {
        config.theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', config.theme);
        themeToggle.textContent = config.theme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('juvox-theme', config.theme);
        const themeSelect = document.getElementById('setting-theme');
        if (themeSelect) themeSelect.value = config.theme;
    });

    // 2. ИСТОРИЯ ПОИСКА
    function saveToHistory(query) {
        if (!config.saveHistory) return;
        let history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
        history.unshift(query);
        if (history.length > 50) history.pop();
        localStorage.setItem('juvox-history', JSON.stringify(history));
    }

    function displayHistory() {
        homeScreen.classList.add('hidden');
        webViewContainer.classList.remove('hidden');
        suggestionsBox.classList.add('suggestions-hidden');
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        
        topSearchArea.style.display = 'block';
        topSearchArea.appendChild(searchBox);
        searchBox.classList.add('minimized');

        let history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        
        webViewContainer.innerHTML = `
            <div class="history-page">
                <div class="history-header-box">
                    <div class="history-header-info">
                        <h2>📜 Центр истории Juvox</h2>
                        <div class="history-stats-badge">Всего сохранено запросов: ${history.length}</div>
                    </div>
                    <button id="clear-history-all" class="clear-all-btn">Очистить историю</button>
                </div>
                <div class="history-grid"></div>
            </div>
        `;

        const gridContainer = webViewContainer.querySelector('.history-grid');
        if (history.length === 0) {
            gridContainer.innerHTML = '<p class="empty-msg">История поисковых запросов пуста.</p>';
            return;
        }

        history.forEach(query => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="history-item-left">
                    <div class="history-icon-box">🔍</div>
                    <span class="history-query-text">${query}</span>
                </div>
                <button class="delete-single-btn" title="Удалить запись">🗑️</button>
            `;
            
            card.querySelector('.history-item-left').addEventListener('click', () => {
                searchInput.value = query;
                launchSearch();
            });

            card.querySelector('.delete-single-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                let currentHistory = JSON.parse(localStorage.getItem('juvox-history')) || [];
                currentHistory = currentHistory.filter(i => i !== query);
                localStorage.setItem('juvox-history', JSON.stringify(currentHistory));
                displayHistory();
            });

            gridContainer.appendChild(card);
        });

        document.getElementById('clear-history-all').addEventListener('click', () => {
            localStorage.removeItem('juvox-history');
            displayHistory();
        });
    }

    if (historyBtn) historyBtn.addEventListener('click', displayHistory);

    // 3. ЭКРАН НАСТРОЕК
    function displaySettings() {
        homeScreen.classList.add('hidden');
        webViewContainer.classList.remove('hidden');
        suggestionsBox.classList.add('suggestions-hidden');
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

        topSearchArea.style.display = 'block';
        topSearchArea.appendChild(searchBox);
        searchBox.classList.add('minimized');

        webViewContainer.innerHTML = `
            <div class="settings-page">
                <h2 class="settings-title">⚙️ Панель управления Juvox</h2>
                
                <div class="settings-section">
                    <h3>Внешний вид и кастомизация</h3>
                    <div class="settings-row">
                        <div class="settings-info">
                            <h4>Выбор фона</h4>
                            <p>Установите уникальный живой градиент для рабочего пространства</p>
                        </div>
                        <select id="setting-bg" class="settings-select">
                            <option value="default">Стандартный минималистичный</option>
                            <option value="aurora">Магическая Аврора</option>
                            <option value="cyberpunk">Неоновый Киберпанк</option>
                            <option value="cosmic">Глубокий космос</option>
                        </select>
                    </div>
                    <div class="settings-row">
                        <div class="settings-info">
                            <h4>Цветовая схема</h4>
                            <p>Переключение между светлым и темным режимом оформления</p>
                        </div>
                        <select id="setting-theme" class="settings-select">
                            <option value="light">Светлая тема</option>
                            <option value="dark">Темная тема</option>
                        </select>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Поисковая система</h3>
                    <div class="settings-row">
                        <div class="settings-info">
                            <h4>Основной поисковый шлюз</h4>
                            <p>Выбор резервного узла децентрализованной выдачи результатов</p>
                        </div>
                        <select id="setting-node" class="settings-select">
                            <option value="auto">Авто-ротация и обход блокировок (Рекомендуется)</option>
                            <option value="https://paulgo.io/search">Paulgo Node (Германия)</option>
                            <option value="https://search.mdosch.de/search">Mdosch Node (Франция)</option>
                            <option value="https://searx.perennialte.ch/search">Perennial Node (США)</option>
                        </select>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Приватность и конфиденциальность</h3>
                    <div class="settings-row">
                        <div class="settings-info">
                            <h4>Сохранение локальной истории</h4>
                            <p>Запоминать ваши поисковые запросы в браузере на этом устройстве</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="setting-history-toggle" ${config.saveHistory ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;

        const bgSelect = document.getElementById('setting-bg');
        bgSelect.value = config.bgStyle;
        bgSelect.addEventListener('change', (e) => {
            config.bgStyle = e.target.value;
            document.body.setAttribute('data-bg', config.bgStyle);
            localStorage.setItem('juvox-bg', config.bgStyle);
        });

        const themeSelect = document.getElementById('setting-theme');
        themeSelect.value = config.theme;
        themeSelect.addEventListener('change', (e) => {
            config.theme = e.target.value;
            document.documentElement.setAttribute('data-theme', config.theme);
            themeToggle.textContent = config.theme === 'dark' ? '☀️' : '🌙';
            localStorage.setItem('juvox-theme', config.theme);
        });

        const nodeSelect = document.getElementById('setting-node');
        nodeSelect.value = config.searchNode;
        nodeSelect.addEventListener('change', (e) => {
            config.searchNode = e.target.value;
            localStorage.setItem('juvox-node', config.searchNode);
        });

        const historyToggle = document.getElementById('setting-history-toggle');
        historyToggle.addEventListener('change', (e) => {
            config.saveHistory = e.target.checked;
            localStorage.setItem('juvox-save-history', config.saveHistory);
        });
    }

    if (settingsBtn) settingsBtn.addEventListener('click', displaySettings);

    // 4. СИСТЕМА ВНУТРЕННИХ ОКНО-ВКЛАДОК ДЛЯ ОТКРЫТИЯ САЙТОВ
    function openSiteInsideJuvox(url, title) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

        const siteTab = document.createElement('li');
        siteTab.className = 'tab-item active';
        siteTab.innerHTML = `🌐 ${title.substring(0, 10)}... <span class="close-tab-x">×</span>`;
        tabsContainer.insertBefore(siteTab, document.getElementById('add-tab'));

        function renderIframe() {
            webViewContainer.innerHTML = `
                <div class="internal-browser-wrapper">
                    <div class="browser-navbar">
                        <button class="browser-back-btn">← К выдаче</button>
                        <div class="browser-url-bar">🔒 ${url}</div>
                    </div>
                    <iframe src="${url}" class="browser-iframe"></iframe>
                </div>
            `;
            webViewContainer.querySelector('.browser-back-btn').addEventListener('click', switchToSearchTab);
        }

        renderIframe();

        siteTab.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-tab-x')) return;
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            siteTab.classList.add('active');
            renderIframe();
        });

        siteTab.querySelector('.close-tab-x').addEventListener('click', (e) => {
            e.stopPropagation();
            siteTab.remove();
            switchToSearchTab();
        });
    }

    function switchToSearchTab() {
        const searchTab = Array.from(document.querySelectorAll('.tab-item')).find(t => t.textContent.includes('🔍'));
        if (searchTab) {
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            searchTab.classList.add('active');
            if (lastSearchResultsHTML) {
                webViewContainer.innerHTML = lastSearchResultsHTML;
                restoreResultCardEvents();
            }
        } else {
            document.querySelector('.logo').click();
        }
    }

    function restoreResultCardEvents() {
        webViewContainer.querySelectorAll('.result-card').forEach(card => {
            const linkElement = card.querySelector('.result-title');
            const url = linkElement.getAttribute('data-url');
            const title = linkElement.textContent;

            card.addEventListener('click', (e) => {
                e.preventDefault();
                openSiteInsideJuvox(url, title);
            });
        });
    }

    // 5. МОДЕРНИЗИРОВАННАЯ КИБЕР-ЛОГИКА ПОИСКА С ОБХОДОМ БЛОКИРОВОК И СПАСАТЕЛЬНЫМ ШЛЮЗОМ
    async function launchSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        suggestionsBox.classList.add('suggestions-hidden');
        saveToHistory(query);

        homeScreen.classList.add('hidden');
        webViewContainer.classList.remove('hidden');
        
        topSearchArea.style.display = 'block';
        searchBox.classList.add('minimized');
        topSearchArea.appendChild(searchBox);

        document.querySelectorAll('.tab-item').forEach(t => {
            if (t.textContent.includes('🔍')) t.remove();
        });

        const newTab = document.createElement('li');
        newTab.className = 'tab-item active';
        newTab.textContent = `🔍 ${query.substring(0, 8)}...`;
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        tabsContainer.insertBefore(newTab, document.getElementById('add-tab'));

        newTab.addEventListener('click', () => {
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            newTab.classList.add('active');
            if (lastSearchResultsHTML) {
                webViewContainer.innerHTML = lastSearchResultsHTML;
                restoreResultCardEvents();
            }
        });

        // Интерактивный логгер децентрализованного обхода
        webViewContainer.innerHTML = `
            <div class="loading-status" style="flex-direction: column; gap: 12px; text-align: center; padding: 50px;">
                <div style="font-size: 2.2rem; animation: rotate 2s linear infinite;">📡</div>
                <div id="log-status-text" style="font-weight: 600; font-family: monospace; color: var(--accent-color);">Инициализация квантового шлюза...</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); max-width: 450px; line-height: 1.5; margin-top: 10px;">
                    Сканируем свободные ноды и обходим Cloudflare-фильтры. Пожалуйста, подождите...
                </div>
            </div>
        `;

        const logText = document.getElementById('log-status-text');

        // Расширенный список стабильных нод
        let instances = [
            "https://searx.perennialte.ch/search",
            "https://paulgo.io/search",
            "https://search.mdosch.de/search",
            "https://searx.work/search",
            "https://searx.be/search",
            "https://priv.au/search"
        ];

        if (config.searchNode !== 'auto') {
            instances = [config.searchNode, ...instances.filter(i => i !== config.searchNode)];
        }

        let searchResults = null;

        // Цикл глубокого сканирования (6 узлов × 3 метода подключения)
        for (let i = 0; i < instances.length; i++) {
            const instance = instances[i];
            const domain = instance.replace('https://', '').split('/')[0];
            const targetUrl = `${instance}?q=${encodeURIComponent(query)}&format=json`;

            // ШАГ 1: Прямой запрос (используем чистый домашний IP пользователя, пробивает блокировки прокси!)
            try {
                logText.textContent = `[Узел ${i+1}/${instances.length}] Сканирование ${domain} напрямую...`;
                const response = await fetch(targetUrl, { priority: "high" });
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.results && data.results.length > 0) {
                        searchResults = data.results;
                        break;
                    }
                }
            } catch (e) { /* Игнорируем CORS ошибку, идем к туннелированию */ }

            // ШАГ 2: Запрос через Туннель AllOrigins
            try {
                logText.textContent = `[Узел ${i+1}/${instances.length}] Проксирование через магистраль AllOrigins...`;
                const proxyUrl1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
                const response = await fetch(proxyUrl1);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.results && data.results.length > 0) {
                        searchResults = data.results;
                        break;
                    }
                }
            } catch (e) {}

            // ШАГ 3: Запрос через Резервный Туннель CorsProxy
            try {
                logText.textContent = `[Узел ${i+1}/${instances.length}] Маршрутизация через резервный шлюз CORS...`;
                const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
                const response = await fetch(proxyUrl2);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.results && data.results.length > 0) {
                        searchResults = data.results;
                        break;
                    }
                }
            } catch (e) {}
        }

        // СПАСАТЕЛЬНЫЙ ШЛЮЗ: Если ноды SearXNG тотально забанили прокси, берем DuckDuckGo API (CORS разрешен с завода)
        if (!searchResults) {
            try {
                logText.textContent = `Запуск аварийного протокола: Подключение к DuckDuckGo Core...`;
                const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
                const response = await fetch(ddgUrl);
                const data = await response.json();
                
                if (data && (data.AbstractText || data.RelatedTopics.length > 0)) {
                    searchResults = [];
                    if (data.AbstractText) {
                        searchResults.push({
                            title: data.Heading || query,
                            url: data.AbstractURL || "https://duckduckgo.com",
                            content: data.AbstractText
                        });
                    }
                    data.RelatedTopics.slice(0, 7).forEach(topic => {
                        if (topic.Text && topic.FirstURL) {
                            searchResults.push({
                                title: topic.Text.substring(0, 65) + "...",
                                url: topic.FirstURL,
                                content: topic.Text
                            });
                        }
                    });
                }
            } catch(err) {}
        }

        // ФИНАЛЬНЫЙ КРАШ-МЕТОД: Если упал даже DuckDuckGo (что нереально), даем прямую кнопку-выход
        if (!searchResults || searchResults.length === 0) {
            webViewContainer.innerHTML = `
                <div class="loading-status" style="flex-direction: column; gap: 16px; padding: 50px; text-align: center;">
                    <div style="font-size: 1.2rem; font-weight: bold; color: #ef4444;">❌ Ошибка децентрализованной сети</div>
                    <div style="font-size: 0.95rem; color: var(--text-muted); max-width: 450px;">
                        Внешние шлюзы временно перегружены. Вы можете открыть этот запрос напрямую в изолированном окне:
                    </div>
                    <a href="https://duckduckgo.com/?q=${encodeURIComponent(query)}" target="_blank" class="browser-back-btn" style="text-decoration: none; display: inline-block; margin-top: 10px;">Открыть поиск напрямую 🌐</a>
                </div>
            `;
            return;
        }

        // Отрисовка результатов
        webViewContainer.innerHTML = '';
        const resultsWrapper = document.createElement('div');
        resultsWrapper.className = 'search-results-page';

        searchResults.slice(0, 10).forEach(item => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="result-url">${item.pretty_url || item.url}</div>
                <a href="#" data-url="${item.url}" class="result-title">${item.title}</a>
                <p class="result-snippet">${item.content || 'Описание отсутствует.'}</p>
            `;
            resultsWrapper.appendChild(card);
        });

        webViewContainer.appendChild(resultsWrapper);
        lastSearchResultsHTML = webViewContainer.innerHTML;
        restoreResultCardEvents();
    }

    searchBtn.addEventListener('click', launchSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') launchSearch(); });

    // 6. ЖИВЫЕ ПОДСКАЗКИ
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        if (query.length < 2) {
            suggestionsBox.classList.add('suggestions-hidden');
            return;
        }

        const targetSuggestUrl = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
        const proxySuggestUrl = `https://corsproxy.io/?${encodeURIComponent(targetSuggestUrl)}`;

        fetch(proxySuggestUrl)
            .then(response => response.json())
            .then(data => {
                const suggestions = data[1];
                if (!suggestions || suggestions.length === 0) {
                    suggestionsBox.classList.add('suggestions-hidden');
                    return;
                }

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
            })
            .catch(() => {});
    });

    document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target)) {
            suggestionsBox.classList.add('suggestions-hidden');
        }
    });

    // СБРОС НА ГЛАВНУЮ ПРИ КЛИКЕ НА ЛОГОТИП
    document.querySelector('.logo').addEventListener('click', () => {
        homeScreen.classList.remove('hidden');
        webViewContainer.classList.add('hidden');
        topSearchArea.style.display = 'none';
        
        searchBox.classList.remove('minimized');
        document.querySelector('.search-wrapper').prepend(searchBox);
        
        webViewContainer.innerHTML = "";
        searchInput.value = "";
        suggestionsBox.classList.add('suggestions-hidden');
        
        document.querySelectorAll('.tab-item').forEach(t => {
            if (t.id !== 'add-tab') t.remove();
        });
    });
});
