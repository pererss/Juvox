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

    // Хранилище HTML кода последних результатов поиска для переключения вкладок
    let lastSearchResultsHTML = ""; 

    // 1. ПЕРЕКЛЮЧАТЕЛЬ СВЕТЛОЙ / ТЕМНОЙ ТЕМЫ
    const currentTheme = localStorage.getItem('juvox-theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
            localStorage.setItem('juvox-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙';
            localStorage.setItem('juvox-theme', 'light');
        }
    });

    // 2. СИСТЕМА ЛОКАЛЬНОЙ ИСТОРИИ (БЕЗ РЕГИСТРАЦИИ)
    function saveToHistory(query) {
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
        
        // Показываем верхнюю поисковую панель
        topSearchArea.style.display = 'block';
        topSearchArea.appendChild(searchBox);
        searchBox.classList.add('minimized');

        let history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        
        webViewContainer.innerHTML = `
            <div class="history-page">
                <h2>📜 История поиска Juvox</h2>
                <button id="clear-history-btn" class="clear-btn">Очистить всю историю</button>
                <div class="history-list"></div>
            </div>
        `;

        const listContainer = webViewContainer.querySelector('.history-list');
        if (history.length === 0) {
            listContainer.innerHTML = '<p class="empty-msg">История пока пуста. Пора что-нибудь найти!</p>';
            return;
        }

        history.forEach(query => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span class="history-text">🔍 ${query}</span>
                <button class="delete-single-history">❌</button>
            `;
            item.querySelector('.history-text').addEventListener('click', () => {
                searchInput.value = query;
                launchSearch();
            });
            item.querySelector('.delete-single-history').addEventListener('click', (e) => {
                e.stopPropagation();
                let currentHistory = JSON.parse(localStorage.getItem('juvox-history')) || [];
                currentHistory = currentHistory.filter(i => i !== query);
                localStorage.setItem('juvox-history', JSON.stringify(currentHistory));
                displayHistory();
            });
            listContainer.appendChild(item);
        });

        document.getElementById('clear-history-btn').addEventListener('click', () => {
            localStorage.removeItem('juvox-history');
            displayHistory();
        });
    }

    if (historyBtn) historyBtn.addEventListener('click', displayHistory);

    // 3. СИСТЕМА СОБСТВЕННЫХ ВНУТРЕННИХ ОКНО-ВКЛАДОК ДЛЯ ОТКРЫТИЯ САЙТОВ
    function openSiteInsideJuvox(url, title) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

        const siteTab = document.createElement('li');
        siteTab.className = 'tab-item active';
        siteTab.innerHTML = `🌐 ${title.substring(0, 12)}... <span class="close-tab-x">×</span>`;
        tabsContainer.insertBefore(siteTab, document.getElementById('add-tab'));

        function renderIframe() {
            webViewContainer.innerHTML = `
                <div class="internal-browser-wrapper">
                    <div class="browser-navbar">
                        <button class="browser-back-btn">← К поисковой выдаче</button>
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

    // 4. УМНАЯ ЛОГИКА ПОИСКА С ЗАЩИТОЙ ОТ БЛОКИРОВОК (ОБХОД NETWORK ERROR)
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

        // Сбрасываем старые вкладки поиска
        document.querySelectorAll('.tab-item').forEach(t => {
            if (t.textContent.includes('🔍')) t.remove();
        });

        const newTab = document.createElement('li');
        newTab.className = 'tab-item active';
        newTab.textContent = `🔍 ${query.substring(0, 10)}...`;
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

        webViewContainer.innerHTML = '<div class="loading-status">Устанавливаем защищенное соединение с глобальной сетью...</div>';

        // Список лучших мировых независимых серверов поиска для подстраховки
        const instances = [
            "https://paulgo.io/search",
            "https://search.mdosch.de/search",
            "https://searx.work/search",
            "https://searx.be/search"
        ];

        let searchResults = null;

        // Поочередно опрашиваем сервера, пока один не отдаст нам результат
        for (let instance of instances) {
            try {
                const targetUrl = `${instance}?q=${encodeURIComponent(query)}&format=json`;
                // Используем сверхнадежный прокси allorigins, который пробивает защиту Cloudflare
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
                
                const response = await fetch(proxyUrl);
                if (!response.ok) continue; // Если этот сервер выдал ошибку, идем к следующему в списке
                
                const data = await response.json();
                if (data && data.results && data.results.length > 0) {
                    searchResults = data.results;
                    break; // Результаты успешно получены, выходим из цикла!
                }
            } catch (error) {
                console.warn(`Сервер ${instance} временно недоступен или заблокирован. Ищем резервный узел...`);
            }
        }

        // Если все 4 сервера отказали (что маловероятно), пишем красивую ошибку
        if (!searchResults) {
            webViewContainer.innerHTML = '<div class="loading-status">Все поисковые узлы сейчас перегружены запросами. Пожалуйста, попробуйте еще раз через пару секунд.</div>';
            return;
        }

        // Выводим результаты
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

    // 5. ЖИВЫЕ КЛИКАБЕЛЬНЫЕ ПОДХВАТЫ-ПОДСКАЗКИ ПРИ ВВОДЕ ТЕКСТА
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

    // Прятать автокомплит при кликах вне зоны поиска
    document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target)) {
            suggestionsBox.classList.add('suggestions-hidden');
        }
    });

    // 6. СБРОС НА ГЛАВНУЮ СТРАНИЦУ ПРИ КЛИКЕ НА ЛОГОТИП JUVOX
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
