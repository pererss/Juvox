document.addEventListener('DOMContentLoaded', () => {
    // Основные селекторы навигации
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    
    // Элементы поиска
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const homeScreen = document.getElementById('home-screen');
    const webViewContainer = document.getElementById('web-view-container');
    const topSearchArea = document.getElementById('top-search-area');
    const searchBox = document.querySelector('.search-box');
    const suggestionsBox = document.getElementById('suggestions-box');
    const logo = document.querySelector('.logo');

    // Управление складным фильтром поиска
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterAccordionBody = document.getElementById('filter-accordion-body');
    const filterContainerBlock = document.querySelector('.filter-accordion-container');

    // Элементы боковой панели инструментов
    const toolsMenuBtn = document.getElementById('tools-menu-btn');
    const floatingToolsPanel = document.getElementById('floating-tools-panel');
    const closeToolsBtn = document.getElementById('close-tools-btn');

    // Модули истории, настроек и блокнота
    const historyListContainer = document.getElementById('history-list-container');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const juvoxNotepad = document.getElementById('juvox-notepad');
    const proxySelect = document.getElementById('setting-proxy-select');
    const toggleHistorySaveBtn = document.getElementById('btn-toggle-history-save');

    // ==========================================
    // 1. СИСТЕМА СКЛАДНЫХ ФИЛЬТРОВ И ИНСТРУМЕНТОВ
    // ==========================================
    
    // Анимация развертывания фильтра поиска по сайтам
    if (filterToggleBtn && filterAccordionBody && filterContainerBlock) {
        filterToggleBtn.addEventListener('click', () => {
            filterContainerBlock.classList.toggle('open');
            filterAccordionBody.classList.toggle('filter-body-hidden');
        });
    }

    // Логика развертывания аккордеонов внутри Панели инструментов
    document.querySelectorAll('.tool-acc-header').forEach(header => {
        header.addEventListener('click', () => {
            const parent = header.parentElement;
            parent.classList.toggle('open');
        });
    });

    // Показ / Скрытие левой панели инструментов
    if (toolsMenuBtn && floatingToolsPanel) {
        toolsMenuBtn.addEventListener('click', () => floatingToolsPanel.classList.toggle('tools-panel-hidden'));
    }
    if (closeToolsBtn && floatingToolsPanel) {
        closeToolsBtn.addEventListener('click', () => floatingToolsPanel.classList.add('tools-panel-hidden'));
    }

    // ==========================================
    // 2. ФУНКЦИОНАЛ ИНСТРУМЕНТОВ (СТАРЫЕ + НОВЫЕ)
    // ==========================================
    
    // Генератор паролей с продвинутыми фильтрами длины и цифр
    const passLenInput = document.getElementById('tool-pass-length');
    const passLenVal = document.getElementById('pass-len-val');
    const passDigInput = document.getElementById('tool-pass-digits');
    const passDigVal = document.getElementById('pass-dig-val');
    const genPassBtn = document.getElementById('tool-gen-pass-btn');
    const passOutput = document.getElementById('tool-pass-output');

    if(passLenInput && passLenVal) {
        passLenInput.addEventListener('input', () => { passLenVal.textContent = passLenInput.value; });
    }
    if(passDigInput && passDigVal) {
        passDigInput.addEventListener('input', () => { passDigVal.textContent = passDigInput.value; });
    }

    if (genPassBtn && passOutput) {
        genPassBtn.addEventListener('click', () => {
            const len = parseInt(passLenInput.value);
            const reqDigitsCount = parseInt(passDigInput.value);
            
            const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()";
            const digits = "0123456789";
            
            let resultPassword = "";
            // Сначала гарантированно набиваем нужное количество цифр
            for(let i=0; i<reqDigitsCount; i++) {
                resultPassword += digits.charAt(Math.floor(Math.random() * digits.length));
            }
            // Добиваем оставшуюся длину буквами и знаками
            const remain = len - reqDigitsCount;
            for(let i=0; i < (remain > 0 ? remain : 0); i++) {
                resultPassword += letters.charAt(Math.floor(Math.random() * letters.length));
            }
            // Перемешиваем пароль
            resultPassword = resultPassword.split('').sort(() => 0.5 - Math.random()).join('');
            passOutput.value = resultPassword;
        });
    }

    // Анализатор текста
    const textCounter = document.getElementById('tool-text-counter');
    const counterResult = document.getElementById('tool-counter-result');
    if (textCounter && counterResult) {
        textCounter.addEventListener('input', () => {
            const txt = textCounter.value;
            const chars = txt.length;
            const words = txt.trim() === "" ? 0 : txt.trim().split(/\s+/).length;
            counterResult.textContent = `Символов: ${chars} | Слов: ${words}`;
        });
    }

    // НОВЫЙ ИНСТРУМЕНТ: URL Кодировщик/Декодер
    const urlInput = document.getElementById('tool-url-input');
    const urlOutput = document.getElementById('tool-url-output');
    if(urlInput && urlOutput) {
        document.getElementById('tool-url-encode').addEventListener('click', () => { urlOutput.value = encodeURIComponent(urlInput.value); });
        document.getElementById('tool-url-decode').addEventListener('click', () => { try{ urlOutput.value = decodeURIComponent(urlInput.value); }catch(e){ urlOutput.value = "Ошибка декодирования!"; } });
    }

    // НОВЫЙ ИНСТРУМЕНТ: Рандомайзер чисел
    const randMin = document.getElementById('rand-min');
    const randMax = document.getElementById('rand-max');
    const randBtn = document.getElementById('tool-rand-btn');
    const randOutput = document.getElementById('tool-rand-output');
    if(randBtn && randMin && randMax && randOutput) {
        randBtn.addEventListener('click', () => {
            const min = parseInt(randMin.value) || 0;
            const max = parseInt(randMax.value) || 100;
            const rand = Math.floor(Math.random() * (max - min + 1)) + min;
            randOutput.textContent = rand;
        });
    }

    // ==========================================
    // 3. РОУТИНГ СТРАНИЦ, НАСТРОЙКИ И БЛОКНОТ
    // ==========================================
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.id === 'tools-menu-btn') return; 
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

    // Управление историей
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
            historyListContainer.innerHTML = `<p style="opacity:0.6; padding:20px;">Ваша история поиска пуста.</p>`;
            return;
        }
        historyListContainer.innerHTML = '';
        history.forEach(query => {
            const row = document.createElement('div');
            row.className = 'history-item-row';
            row.innerHTML = `<span class="h-tx" style="cursor:pointer; font-weight:600; color:var(--accent-color);">${query}</span><button class="danger-btn" style="padding:4px 8px; font-size:0.8rem;">Удалить</button>`;
            
            row.querySelector('.h-tx').addEventListener('click', () => {
                searchInput.value = query;
                launchSearch();
            });
            row.querySelector('.danger-btn').addEventListener('click', () => {
                let current = JSON.parse(localStorage.getItem('juvox-history')) || [];
                localStorage.setItem('juvox-history', JSON.stringify(current.filter(h => h !== query)));
                renderHistoryList();
            });
            historyListContainer.appendChild(row);
        });
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if(confirm("Очистить локальный лог поиска?")) { localStorage.removeItem('juvox-history'); renderHistoryList(); }
        });
    }

    // ==========================================
    // 4. ИНТЕЛЛЕКТУАЛЬНЫЙ СОРТИРОВЩИК ПОИСКА JUVOX
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
                <div style="font-weight:bold;">КЛАССИФИКАЦИЯ СООБЩЕСТВ JUVOX CORE...</div>
            </div>
        `;

        // Парсим лимиты ответов для каждого сайта
        const siteLimits = {};
        const checkedSites = [];
        document.querySelectorAll('.filter-item').forEach(item => {
            const cb = item.querySelector('input[type="checkbox"]');
            const num = item.querySelector('.res-count');
            if (cb.checked) {
                siteLimits[cb.value] = parseInt(num.value) || 1;
                checkedSites.push(cb.value);
            }
        });
        
        // Формируем системный поисковый запрос
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
                    // Хранилище счетчиков выдачи для каждого ресурса
                    const siteCounters = {};
                    checkedSites.forEach(s => siteCounters[s] = 0);

                    resultElements.forEach((el) => {
                        const titleEl = el.querySelector('.result__title a');
                        const snippetEl = el.querySelector('.result__snippet');

                        if (titleEl && snippetEl) {
                            let rawUrl = titleEl.getAttribute('href');
                            if (rawUrl.includes('uddg=')) {
                                rawUrl = decodeURIComponent(rawUrl.split('uddg=')[1].split('&')[0]);
                            }

                            // Определяем к какому сообществу относится ссылка
                            let matchedSiteKey = checkedSites.find(site => rawUrl.includes(site));
                            
                            // Если сайт найден и лимит ответов для него еще не исчерпан — рендерим!
                            if (matchedSiteKey && siteCounters[matchedSiteKey] < siteLimits[matchedSiteKey]) {
                                
                                siteCounters[matchedSiteKey]++; // Увеличиваем счетчик сайта

                                let sourceName = matchedSiteKey.replace('.com', '').replace('.org', '').toUpperCase();
                                if(matchedSiteKey.includes('mozilla')) sourceName = "MDN DOCS";

                                const card = document.createElement('div');
                                card.style.cssText = 'background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px; padding:18px; margin-bottom:15px; box-shadow:var(--shadow-sm);';
                                
                                const cleanSnippetText = snippetEl.textContent.trim();
                                const cleanTitleText = titleEl.textContent.trim();

                                card.innerHTML = `
                                    <span class="hub-badge" style="background-color: var(--accent-color);">${sourceName}</span>
                                    <div style="font-size:1.2rem; font-weight:800; margin-bottom:6px; line-height:1.3;">${cleanTitleText}</div>
                                    <div class="snippet-wrapper">${cleanSnippetText}</div>
                                    <button class="btn-toggle-snippet">Читать далее ▼</button>
                                    
                                    <div class="card-actions-area">
                                        <a href="${rawUrl}" target="_blank" class="btn-go-site">Перейти на сайт источника ↗</a>
                                        <button class="btn-save-note">✨ Сохранить в заметки</button>
                                    </div>
                                `;

                                // Спойлер "Читать далее"
                                const sw = card.querySelector('.snippet-wrapper');
                                const btnToggle = card.querySelector('.btn-toggle-snippet');
                                btnToggle.addEventListener('click', () => {
                                    sw.classList.toggle('expanded');
                                    btnToggle.textContent = sw.classList.contains('expanded') ? 'Свернуть ▲' : 'Читать далее ▼';
                                });

                                // БОНУСНАЯ ФИЧА: Интеграция карточек с Блокнотом
                                card.querySelector('.btn-save-note').addEventListener('click', () => {
                                    let currentNotes = localStorage.getItem('juvox-notes-data') || '';
                                    const noteBlock = `\n\n--- [Сохранено из Juvox Search] ---\nТема: ${cleanTitleText}\nИсточник: ${rawUrl}\nВыдержка: ${cleanSnippetText}\n-----------------------------------`;
                                    localStorage.setItem('juvox-notes-data', currentNotes + noteBlock);
                                    if(juvoxNotepad) juvoxNotepad.value = localStorage.getItem('juvox-notes-data');
                                    alert('Информация успешно добавлена во вкладку "Заметки"!');
                                });

                                resultsWrapper.appendChild(card);
                                searchSuccess = true;
                            }
                        }
                    });
                }
            }
        } catch (e) { console.log(e); }

        // Нижние резервные шлюзы
        const fallbackWidget = document.createElement('div');
        fallbackWidget.style.cssText = 'margin-top:25px; padding:20px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px;';
        fallbackWidget.innerHTML = `
            <h4 style="margin-bottom:6px; font-weight:800;">🔍 Глобальный дубляж запроса</h4>
            <p style="font-size:0.85rem; margin-bottom:12px; color:var(--text-muted);">Перенаправить поисковый пакет <strong>"${query}"</strong> в глобальные поисковые системы:</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" class="btn-go-site" style="background:#4285F4; color:white; border:none;">Google</a>
                <a href="https://yandex.ru/search/?text=${encodeURIComponent(query)}" target="_blank" class="btn-go-site" style="background:#ffcc00; color:black; border:none;">Яндекс</a>
                <a href="https://search.brave.com/search?q=${encodeURIComponent(query)}" target="_blank" class="btn-go-site" style="background:#ff4500; color:white; border:none;">Brave</a>
            </div>
        `;
        resultsWrapper.appendChild(fallbackWidget);

        webViewContainer.innerHTML = '';
        webViewContainer.appendChild(resultsWrapper);
    }

    if (searchBtn) searchBtn.addEventListener('click', launchSearch);
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') launchSearch(); });

    // Сброс на главную страницу Juvox
    if (logo) {
        logo.addEventListener('click', () => {
            if (homeScreen) homeScreen.classList.remove('hidden');
            if (webViewContainer) webViewContainer.classList.add('hidden');
            if (topSearchArea) topSearchArea.style.display = 'none';
            if (searchBox) {
                searchBox.classList.remove('minimized');
                document.querySelector('.search-wrapper').insertBefore(searchBox, document.querySelector('.filter-accordion-container'));
            }
            if (searchInput) searchInput.value = "";
        });
    }
});
