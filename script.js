document.addEventListener('DOMContentLoaded', () => {
    // Находим все элементы интерфейса Juvox
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const homeScreen = document.getElementById('home-screen');
    const webViewContainer = document.getElementById('web-view-container');
    const topSearchArea = document.getElementById('top-search-area');
    const searchBox = document.querySelector('.search-box');
    const tabsContainer = document.getElementById('tabs-container');
    const suggestionsBox = document.getElementById('suggestions-box');
    const logo = document.querySelector('.logo');

    // Переменная для хранения копии последнего поиска
    let lastSearchResultsHTML = ""; 

    // ==========================================
    // 1. НАСТРОЙКИ СИСТЕМЫ И ИНИЦИАЛИЗАЦИЯ ТЕМЫ
    // ==========================================
    let config = {
        theme: localStorage.getItem('juvox-theme') || 'light',
        bgStyle: localStorage.getItem('juvox-bg') || 'default',
        saveHistory: localStorage.getItem('juvox-save-history') !== 'false'
    };

    // Применяем сохраненную тему оформления
    document.documentElement.setAttribute('data-theme', config.theme);
    document.body.setAttribute('data-bg', config.bgStyle);
    if (themeToggle) themeToggle.textContent = config.theme === 'dark' ? '☀️' : '🌙';

    // Клик по кнопке смены темы
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            config.theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', config.theme);
            themeToggle.textContent = config.theme === 'dark' ? '☀️' : '🌙';
            localStorage.setItem('juvox-theme', config.theme);
        });
    }

    // ==========================================
    // 2. СИСТЕМА ЛОКАЛЬНОЙ ИСТОРИИ ПОИСКА
    // ==========================================
    function saveToHistory(query) {
        if (!config.saveHistory) return;
        let history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
        history.unshift(query);
        if (history.length > 20) history.pop(); // Храним только последние 20 запросов
        localStorage.setItem('juvox-history', JSON.stringify(history));
    }

    // ==========================================
    // 3. ЖИВЫЕ ПОДСКАЗКИ ПРИ ВВОДЕ ТЕКСТА
    // ==========================================
    if (searchInput && suggestionsBox) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();
            if (query.length < 2) {
                suggestionsBox.classList.add('suggestions-hidden');
                return;
            }

            // Запрашиваем быстрые подсказки через безопасный прокси
            fetch(`https://corsproxy.io/?${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=chrome&q=${query}`)}`)
                .then(res => res.json())
                .then(data => {
                    const suggestions = data[1];
                    if (!suggestions || suggestions.length === 0) return;
                    
                    suggestionsBox.innerHTML = '';
                    suggestionsBox.classList.remove('suggestions-hidden');

                    // Показываем первые 5 подсказок
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

        // Закрываем подсказки, если кликнули мимо поисковой строки
        document.addEventListener('click', (e) => {
            if (e.target !== searchInput) {
                suggestionsBox.classList.add('suggestions-hidden');
            }
        });
    }

    // ==========================================
    // 4. УМНЫЙ ПОИСКОВОЙ ДВИЖОК JUVOX CORE
    // ==========================================
    async function launchSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        // Прячем выпадающие подсказки и сохраняем запрос
        if (suggestionsBox) suggestionsBox.classList.add('suggestions-hidden');
        saveToHistory(query);

        // Переключаем экраны (прячем центр, активируем зону выдачи)
        if (homeScreen) homeScreen.classList.add('hidden');
        if (webViewContainer) webViewContainer.classList.remove('hidden');
        
        // Переносим поисковую строку наверх страницы (минимизация)
        if (topSearchArea && searchBox) {
            topSearchArea.style.display = 'block';
            searchBox.classList.add('minimized');
            topSearchArea.appendChild(searchBox);
        }

        // Создаем красивую вкладку с иконкой лупы сверху
        document.querySelectorAll('.tab-item').forEach(t => { if (t.textContent.includes('🔍')) t.remove(); });
        const newTab = document.createElement('li');
        newTab.className = 'tab-item active';
        newTab.textContent = `🔍 ${query.substring(0, 8)}...`;
        if (tabsContainer) tabsContainer.insertBefore(newTab, document.getElementById('add-tab'));

        // Включаем фирменный загрузчик Juvox
        webViewContainer.innerHTML = `
            <div class="loading-status" style="display: flex; flex-direction: column; gap: 12px; align-items: center; padding: 50px; color: var(--text-color, #000);">
                <div style="font-size: 2.5rem; animation: spin 1s linear infinite;">🛸</div>
                <div style="font-weight: bold; letter-spacing: 1px;">JUVOX ИЩЕТ ОТВЕТЫ...</div>
            </div>
        `;

        // Создаем общий контейнер для нашей кастомной выдачи
        const resultsWrapper = document.createElement('div');
        resultsWrapper.className = 'search-results-page';
        resultsWrapper.style.padding = '20px';
        resultsWrapper.style.maxWidth = '800px';
        resultsWrapper.style.margin = '0 auto';

        // --- МОДУЛЬ 1: ВСТРОЕННЫЙ КАЛЬКУЛЯТОР ---
        if (/^[0-9+\-*/().\s]+$/.test(query) && /[+\-*/]/.test(query)) {
            try {
                const mathResult = Function(`"use strict"; return (${query})`)();
                const calcWidget = document.createElement('div');
                calcWidget.className = 'juvox-widget';
                calcWidget.style.background = 'linear-gradient(135deg, #4f46e5, #3b82f6)';
                calcWidget.style.color = '#fff';
                calcWidget.style.padding = '20px';
                calcWidget.style.borderRadius = '12px';
                calcWidget.style.marginBottom = '25px';
                calcWidget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                calcWidget.innerHTML = `
                    <div style="font-size: 0.85rem; opacity: 0.8; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Математический модуль Juvox</div>
                    <div style="font-size: 1.8rem; font-weight: bold; margin-top: 5px;">${query} = ${mathResult}</div>
                `;
                resultsWrapper.appendChild(calcWidget);
            } catch (e) {
                // Игнорируем ошибку, если это был обычный текст с дефисом
            }
        }

        // --- МОДУЛЬ 2: ИНТЕЛЛЕКТУАЛЬНАЯ СПРАВКА (ВИКИПЕДИЯ API) ---
        try {
            const wikiRes = await fetch(`https://ru.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&exintro&explaintext&redirects=1&pithumbsize=400&origin=*&titles=${encodeURIComponent(query)}`);
            const wikiData = await wikiRes.json();
            const pages = wikiData.query.pages;
            const pageId = Object.keys(pages)[0];
            
            if (pageId !== "-1") {
                const page = pages[pageId];
                const text = page.extract ? page.extract.substring(0, 350) + '...' : '';
                const imgUrl = page.thumbnail ? page.thumbnail.source : '';

                if (text) {
                    const wikiWidget = document.createElement('div');
                    wikiWidget.className = 'juvox-wiki-card';
                    wikiWidget.style.background = 'var(--card-bg, #f3f4f6)';
                    wikiWidget.style.border = '1px solid var(--border-color, #e5e7eb)';
                    wikiWidget.style.padding = '20px';
                    wikiWidget.style.borderRadius = '12px';
                    wikiWidget.style.marginBottom = '25px';
                    wikiWidget.style.display = 'flex';
                    wikiWidget.style.gap = '20px';

                    wikiWidget.innerHTML = `
                        ${imgUrl ? `<img src="${imgUrl}" style="width: 110px; height: 110px; object-fit: cover; border-radius: 8px; flex-shrink: 0;">` : ''}
                        <div>
                            <div style="font-size: 0.85rem; color: #10b981; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Справка Juvox AI</div>
                            <h3 style="margin: 5px 0; font-size: 1.4rem; color: var(--text-color, #000);">${page.title}</h3>
                            <p style="font-size: 0.95rem; line-height: 1.5; margin: 5px 0; color: var(--text-muted, #4b5563);">${text}</p>
                            <a href="https://ru.wikipedia.org/?curid=${pageId}" target="_blank" style="color: #3b82f6; font-size: 0.9rem; text-decoration: none; font-weight: bold;">Читать полностью на Википедии →</a>
                        </div>
                    `;
                    resultsWrapper.appendChild(wikiWidget);
                }
            }
        } catch (err) {
            console.log("Модуль знаний временно недоступен");
        }

        // --- МОДУЛЬ 3: СБОР ОРГАНИЧЕСКИХ ССЫЛОК (ПАРСИНГ DUCKDUCKGO HTML) ---
        try {
            const targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
            
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error();
            
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const resultElements = doc.querySelectorAll('.result');

            if (resultElements.length > 0) {
                // Добавляем красивую текстовую черту разделения
                const searchHeader = document.createElement('h4');
                searchHeader.textContent = "Результаты глобального поиска:";
                searchHeader.style.margin = '20px 0 15px 0';
                searchHeader.style.opacity = '0.6';
                searchHeader.style.fontSize = '0.9rem';
                resultsWrapper.appendChild(searchHeader);

                // Рендерим первые 9 чистых результатов без рекламы
                resultElements.forEach((el, index) => {
                    if (index > 8) return;
                    const titleEl = el.querySelector('.result__title a');
                    const snippetEl = el.querySelector('.result__snippet');

                    if (titleEl && snippetEl) {
                        let rawUrl = titleEl.getAttribute('href');
                        
                        // Очищаем редиректы внутри ссылок, делая их прямыми
                        if (rawUrl.includes('uddg=')) {
                            const parts = rawUrl.split('uddg=');
                            if (parts[1]) rawUrl = decodeURIComponent(parts[1].split('&')[0]);
                        }

                        const card = document.createElement('div');
                        card.className = 'result-card';
                        card.style.marginBottom = '20px';
                        card.style.padding = '15px';
                        card.style.background = 'var(--card-bg, #ffffff)';
                        card.style.borderRadius = '8px';
                        card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                        card.innerHTML = `
                            <div class="result-url" style="font-size: 0.8rem; color: #10b981; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${rawUrl}</div>
                            <a href="${rawUrl}" target="_blank" class="result-title" style="font-size: 1.2rem; color: #2563eb; font-weight: 600; text-decoration: none;">${titleEl.textContent.trim()}</a>
                            <p class="result-snippet" style="margin: 6px 0 0 0; font-size: 0.95rem; color: var(--text-muted, #4b5563); line-height: 1.4;">${snippetEl.textContent.trim()}</p>
                        `;
                        resultsWrapper.appendChild(card);
                    }
                });
            } else {
                appendNoResultsMessage(resultsWrapper);
            }
        } catch (error) {
            appendNoResultsMessage(resultsWrapper);
        }

        // Очищаем экран загрузки и вставляем готовую страницу
        webViewContainer.innerHTML = '';
        webViewContainer.appendChild(resultsWrapper);
        
        // Сохраняем слепок кода для работы логики переключения
        lastSearchResultsHTML = webViewContainer.innerHTML;
    }

    // Обработчики клика по кнопке "Поиск" и нажатия клавиши Enter
    if (searchBtn) searchBtn.addEventListener('click', launchSearch);
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') launchSearch(); });

    function appendNoResultsMessage(container) {
        const errDiv = document.createElement('div');
        errDiv.style.padding = '30px';
        errDiv.style.textAlign = 'center';
        errDiv.style.color = 'var(--text-muted, #6b7280)';
        errDiv.textContent = "Шлюз поиска перегружен запросами. Пожалуйста, нажмите кнопку поиска еще раз через 3 секунды.";
        container.appendChild(errDiv);
    }

    // ==========================================
    // 5. ВОЗВРАТ НА ГЛАВНУЮ ПРИ КЛИКЕ НА ЛОГОТИП
    // ==========================================
    if (logo) {
        logo.addEventListener('click', () => {
            // Возвращаем видимость стартового экрана и прячем выдачу
            if (homeScreen) homeScreen.classList.remove('hidden');
            if (webViewContainer) webViewContainer.classList.add('hidden');
            if (topSearchArea) topSearchArea.style.display = 'none';
            
            // Возвращаем поисковую строку в центр
            if (searchBox) {
                searchBox.classList.remove('minimized');
                const wrapper = document.querySelector('.search-wrapper');
                if (wrapper) wrapper.prepend(searchBox);
            }
            
            // Очищаем строку ввода и вкладки
            if (searchInput) searchInput.value = "";
            document.querySelectorAll('.tab-item').forEach(t => { if (t.textContent.includes('🔍')) t.remove(); });
        });
    }
});
