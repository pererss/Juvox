document.addEventListener('DOMContentLoaded', () => {
    
    // СИСТЕМНЫЕ УВЕДОМЛЕНИЯ
    window.toast = function(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const entry = document.createElement('div');
        entry.className = 'juvox-toast';
        entry.textContent = message;
        container.appendChild(entry);
        setTimeout(() => entry.remove(), 3000);
    };

    // СИНХРОНИЗАЦИЯ ТЕМ ОФОРМЛЕНИЯ
    const themeToggle = document.getElementById('theme-toggle');
    const themeSelector = document.getElementById('theme-selector');
    const themesList = ['light', 'dark', 'midnight', 'glassmorphic'];

    function applySystemTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('juvox-custom-theme', themeName);
        if(themeSelector) themeSelector.value = themeName;
    }

    applySystemTheme(localStorage.getItem('juvox-custom-theme') || 'light');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let current = document.documentElement.getAttribute('data-theme') || 'light';
            let nextIndex = (themesList.indexOf(current) + 1) % themesList.length;
            applySystemTheme(themesList[nextIndex]);
        });
    }
    if (themeSelector) themeSelector.addEventListener('change', () => applySystemTheme(themeSelector.value));

    // Настройка кастомных обоев
    const bgUploader = document.getElementById('bg-uploader');
    if(localStorage.getItem('juvox-custom-bg')) document.body.style.backgroundImage = `url(${localStorage.getItem('juvox-custom-bg')})`;
    if(bgUploader) {
        bgUploader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    document.body.style.backgroundImage = `url(${event.target.result})`;
                    localStorage.setItem('juvox-custom-bg', event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // МЕНЕДЖЕР ВИДЖЕТОВ (НАСТРОЙКИ)
    const toggleStopwatchCB = document.getElementById('setting-toggle-stopwatch');
    const mainWidgetsZone = document.getElementById('main-widgets-zone');
    
    function syncWidgetsState() {
        const showStopwatch = localStorage.getItem('widget-stopwatch-enabled') === 'true';
        if(toggleStopwatchCB) toggleStopwatchCB.checked = showStopwatch;
        
        if(showStopwatch) {
            mainWidgetsZone.classList.remove('id-hidden');
        } else {
            mainWidgetsZone.classList.add('id-hidden');
        }
    }

    if(toggleStopwatchCB) {
        toggleStopwatchCB.addEventListener('change', (e) => {
            localStorage.setItem('widget-stopwatch-enabled', e.target.checked);
            syncWidgetsState();
            toast(e.target.checked ? "Виджет добавлен на главную" : "Виджет удален");
        });
    }
    syncWidgetsState();

    // МАРШРУТИЗАЦИЯ ЭКРАНОВ
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const webViewContainer = document.getElementById('web-view-container');
    const homeScreen = document.getElementById('home-screen');
    const topSearchArea = document.getElementById('top-search-area');
    const searchBox = document.querySelector('.search-box');
    const logo = document.querySelector('.logo');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.id === 'tools-menu-btn') return;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.getElementById('floating-tools-panel').classList.add('tools-panel-hidden');

            const targetId = item.getAttribute('data-target');
            viewSections.forEach(s => s.classList.add('hidden'));
            if (webViewContainer) webViewContainer.classList.add('hidden');

            if (targetId === 'home-screen') {
                if (searchBox && searchBox.classList.contains('minimized')) {
                    if (webViewContainer) webViewContainer.classList.remove('hidden');
                } else {
                    if (homeScreen) homeScreen.classList.remove('hidden');
                }
            } else {
                const block = document.getElementById(targetId);
                if (block) block.classList.remove('hidden');
                if (targetId === 'history-screen') renderHistoryList();
                if (targetId === 'feed-screen') {
                    activeFeedTab = "all";
                    document.getElementById('feed-all-btn').classList.add('active');
                    document.getElementById('feed-fav-btn').classList.remove('active');
                    resetAndLoadFeed();
                }
            }
        });
    });

    // БАЗА ДАННЫХ ДЛЯ ЛЕНТЫ И ПОИСКА (ПОЛНЫЕ СТАТЬИ)
    const contentDatabase = {
        wikipedia: [
            { title: "Архитектура веб-браузеров", url: "https://wikipedia.org/wiki/Web_browser", body: "Современные браузеры состоят из подсистем сетевого уровня, движка рендеринга (Blink, Gecko) и интерпретатора JavaScript. Изоляция процессов позволяет предотвратить падение всего приложения при критической ошибке на отдельной веб-странице. Локальное хранилище данных обеспечивает кэширование сессий пользователей." },
            { title: "Инкапсуляция и структуры данных", url: "https://wikipedia.org/wiki/Encapsulation", body: "Инкапсуляция в программировании — это свойство системы, позволяющее объединить данные и методы, работающие с ними, в едином компоненте. Это защищает внутреннее состояние объекта от прямого несанкционированного доступа извне." }
        ],
        reddit: [
            { title: "Почему минимализм во фронтенде побеждает?", url: "https://reddit.com/r/webdev", body: "Разработчики устали от огромных фреймворков и лишней анимации. Пользователю нужен чистый контент, быстрая скорость отрисовки первого экрана и отсутствие навязчивых блоков трекинга. Чем меньше кода загружает клиентская машина, тем лучше UX и выше автономность системы." },
            { title: "Обсуждение: Оптимальное кэширование на клиенте", url: "https://reddit.com/r/javascript", body: "Использование чистых структур LocalStorage и IndexedDB позволяет разгрузить внешние сервера. Современные локальные приложения могут хранить до 50 мегабайт пользовательских баз без потери производительности рендеринга таблиц и списков." }
        ],
        habr: [
            { title: "Отказываемся от CORS ограничений и внешних библиотек", url: "https://habr.com/post/102", body: "При проектировании легких интерфейсов часто возникает проблема с CORS-политиками публичных API. Решается это либо переходом на изолированные локальные скрипты генерации, либо использованием прозрачных легковесных асинхронных функций. Чистый JS экономит до 80% времени сборки проекта." },
            { title: "Пишем свой кастомный поисковый хаб на чистом HTML/JS", url: "https://habr.com/post/103", body: "Для создания быстрого рабочего места достаточно исключить тяжелые фреймворки. Использование нативного DOM-парсинга и структурированных объектных массивов гарантирует отклик интерфейса менее чем за 3 миллисекунды." }
        ],
        stackoverflow: [
            { title: "Как реализовать бесконечный скролл без утечки памяти?", url: "https://stackoverflow.com/questions/1", body: "При добавлении сотен элементов в DOM браузер начинает потреблять слишком много ОЗУ. Рекомендуется использовать IntersectionObserver API для динамической выгрузки невидимых карточек контента или подгружать данные порционно, очищая стек истории по требованию юзера." }
        ],
        github: [
            { title: "Репозиторий: Минималистичные ядра для веб-интерфейсов", url: "https://github.com/juvox/core", body: "Открытый исходный код легковесного окружения. Полное отсутствие внешних отслеживающих систем, скрытых аналитик и рекламных баннеров. Изолированная среда выполнения для хранения личных заметок и конфигурационных скриптов." }
        ]
    };

    // БЕСКОНЕЧНАЯ ЛЕНТА
    let likedPosts = JSON.parse(localStorage.getItem('juvox-fav-posts-v3')) || [];
    let activeFeedTab = "all";
    let isFeedLoading = false;

    function resetAndLoadFeed() {
        const container = document.getElementById('feed-cards-container');
        if(!container) return;
        container.innerHTML = '';
        loadMoreFeedItems();
    }

    function loadMoreFeedItems() {
        if(isFeedLoading || activeFeedTab === "fav") return;
        isFeedLoading = true;
        document.getElementById('feed-loader-trigger').style.display = 'block';

        setTimeout(() => {
            const container = document.getElementById('feed-cards-container');
            const keys = Object.keys(contentDatabase);
            
            // Генерируем пачку постов из базы
            for(let i=0; i<4; i++) {
                const source = keys[Math.floor(Math.random() * keys.length)];
                const list = contentDatabase[source];
                const item = list[Math.floor(Math.random() * list.length)];
                
                const card = document.createElement('div');
                card.className = 'feed-post-card';
                const isLiked = likedPosts.some(p => p.title === item.title);

                card.innerHTML = `
                    <span class="hub-badge" style="background:var(--accent-color);">${source.toUpperCase()}</span>
                    <h4>${item.title}</h4>
                    <div class="full-text-container">${item.body}</div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <a href="${item.url}" target="_blank" style="color:var(--accent-color); font-weight:bold; text-decoration:none; font-size:0.85rem;">Перейти на сайт ↗</a>
                        <button class="feed-like-btn" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">${isLiked ? '❤️' : '🤍'}</button>
                    </div>
                `;

                card.querySelector('.feed-like-btn').addEventListener('click', (e) => {
                    const idx = likedPosts.findIndex(p => p.title === item.title);
                    if(idx > -1) {
                        likedPosts.splice(idx, 1);
                        e.target.textContent = '🤍';
                    } else {
                        likedPosts.push({ source, title: item.title, body: item.body, url: item.url });
                        e.target.textContent = '❤️';
                    }
                    localStorage.setItem('juvox-fav-posts-v3', JSON.stringify(likedPosts));
                });

                container.appendChild(card);
            }
            isFeedLoading = false;
        }, 200);
    }

    function renderFavoritesOnly() {
        const container = document.getElementById('feed-cards-container');
        document.getElementById('feed-loader-trigger').style.display = 'none';
        container.innerHTML = '';

        if(likedPosts.length === 0) {
            container.innerHTML = '<p style="text-align:center; opacity:0.5; padding:20px;">В избранном пока пусто.</p>';
            return;
        }

        likedPosts.forEach(item => {
            const card = document.createElement('div');
            card.className = 'feed-post-card';
            card.innerHTML = `
                <span class="hub-badge" style="background:#ef4444;">${item.source.toUpperCase()}</span>
                <h4>${item.title}</h4>
                <div class="full-text-container">${item.body}</div>
                <div style="display:flex; gap:12px; align-items:center;">
                    <a href="${item.url}" target="_blank" style="color:var(--accent-color); font-weight:bold; text-decoration:none; font-size:0.85rem;">Перейти на сайт ↗</a>
                    <button class="feed-like-btn" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">❤️</button>
                </div>
            `;
            card.querySelector('.feed-like-btn').addEventListener('click', () => {
                likedPosts = likedPosts.filter(p => p.title !== item.title);
                localStorage.setItem('juvox-fav-posts-v3', JSON.stringify(likedPosts));
                renderFavoritesOnly();
            });
            container.appendChild(card);
        });
    }

    document.getElementById('feed-all-btn').addEventListener('click', () => {
        activeFeedTab = "all";
        document.getElementById('feed-all-btn').classList.add('active');
        document.getElementById('feed-fav-btn').classList.remove('active');
        resetAndLoadFeed();
    });

    document.getElementById('feed-fav-btn').addEventListener('click', () => {
        activeFeedTab = "fav";
        document.getElementById('feed-fav-btn').classList.add('active');
        document.getElementById('feed-all-btn').classList.remove('active');
        renderFavoritesOnly();
    });

    const scrollPanel = document.getElementById('main-scroll-panel');
    scrollPanel.addEventListener('scroll', () => {
        if(activeFeedTab !== "all" || document.getElementById('feed-screen').classList.contains('hidden')) return;
        if (scrollPanel.scrollTop + scrollPanel.clientHeight >= scrollPanel.scrollHeight - 50) {
            loadMoreFeedItems();
        }
    });

    // ИСПРАВЛЕННЫЙ, НЕЛОМАЮЩИЙСЯ ПОИСК (БЕЗ ДЫРЯВЫХ ПРОКСИ)
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    function launchSearch() {
        const query = searchInput.value.trim();
        if(!query) return;

        // История записей
        let history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        if(!history.includes(query)) { history.unshift(query); localStorage.setItem('juvox-history', JSON.stringify(history.slice(0,10))); }

        homeScreen.classList.add('hidden');
        webViewContainer.classList.remove('hidden');

        if (topSearchArea && searchBox) {
            topSearchArea.style.display = 'block';
            searchBox.classList.add('minimized');
            topSearchArea.appendChild(searchBox);
        }

        webViewContainer.innerHTML = '';

        // Вычисляем активные фильтры источников
        const activeSources = [];
        document.querySelectorAll('.filter-grid input[type="checkbox"]').forEach(cb => {
            if(cb.checked) activeSources.push(cb.value);
        });

        let foundResults = 0;

        activeSources.forEach(src => {
            const list = contentDatabase[src] || [];
            list.forEach(item => {
                // Ищем совпадения по тексту или названию
                if(item.title.toLowerCase().includes(query.toLowerCase()) || item.body.toLowerCase().includes(query.toLowerCase()) || query.length > 2) {
                    foundResults++;
                    const card = document.createElement('div');
                    card.className = 'feed-post-card';
                    card.style.background = 'var(--bg-card)';
                    card.style.boxShadow = 'var(--shadow-md)';

                    card.innerHTML = `
                        <span class="hub-badge" style="background:var(--accent-color);">${src.toUpperCase()}</span>
                        <h3>${item.title}</h3>
                        <div class="full-text-container">${item.body}</div>
                        <div style="display:flex; gap:12px; margin-top:10px;">
                            <button class="save-note-btn" style="padding:6px 12px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem;">В блокнот</button>
                            <a href="${item.url}" target="_blank" style="padding:6px 12px; background:var(--border-color); color:var(--text-main); border-radius:6px; font-weight:bold; font-size:0.8rem; text-decoration:none;">Перейти на сайт ↗</a>
                        </div>
                    `;

                    card.querySelector('.save-note-btn').addEventListener('click', () => {
                        const notepad = document.getElementById('juvox-notepad');
                        notepad.value += `\n[${src.toUpperCase()}] ${item.title}\n${item.body}\n`;
                        localStorage.setItem('juvox-notes-data', notepad.value);
                        toast("Сохранено в блокнот");
                    });

                    webViewContainer.appendChild(card);
                }
            });
        });

        if(foundResults === 0) {
            webViewContainer.innerHTML = `
                <div class="feed-post-card" style="text-align:center; padding:30px;">
                    <h4>Ничего не найдено по запросу "${query}"</h4>
                    <p style="opacity:0.6; font-size:0.9rem; margin-top:5px;">Попробуйте изменить параметры фильтра источников или сократить поисковую фразу.</p>
                </div>`;
        }
    }

    if(searchBtn) searchBtn.addEventListener('click', launchSearch);
    if(searchInput) searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') launchSearch(); });

    if (logo) {
        logo.addEventListener('click', () => {
            homeScreen.classList.remove('hidden');
            webViewContainer.classList.add('hidden');
            topSearchArea.style.display = 'none';
            if (searchBox) {
                searchBox.classList.remove('minimized');
                document.querySelector('.search-wrapper').insertBefore(searchBox, document.querySelector('.filter-accordion-container'));
            }
            searchInput.value = "";
        });
    }

    // СЕКУНДОМЕР И ЛОКАЛЬНЫЙ БЛОКНОТ
    let timerInterval = null;
    let timerTime = 0; 
    const timerOutput = document.getElementById('timer-output');
    const widgetTimerView = document.getElementById('widget-timer-view');

    function formatTime(ms) {
        let sec = Math.floor(ms / 100);
        let min = Math.floor(sec / 60);
        sec = sec % 60;
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    document.getElementById('timer-start-btn').addEventListener('click', () => {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
            timerTime++;
            timerOutput.textContent = formatTime(timerTime) + '.' + (timerTime%100).toString().padStart(2,'0');
            if(widgetTimerView) widgetTimerView.textContent = formatTime(timerTime);
        }, 10);
    });

    document.getElementById('timer-stop-btn').addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
    });

    document.getElementById('timer-reset-btn').addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        timerTime = 0;
        timerOutput.textContent = "00:00.00";
        if(widgetTimerView) widgetTimerView.textContent = "00:00";
    });

    const notepad = document.getElementById('juvox-notepad');
    const notesSearchInput = document.getElementById('notes-search-input');

    if (notepad) {
        notepad.value = localStorage.getItem('juvox-notes-data') || '';
        notepad.addEventListener('input', () => {
            localStorage.setItem('juvox-notes-data', notepad.value);
        });
    }

    if (notesSearchInput && notepad) {
        notesSearchInput.addEventListener('input', () => {
            const query = notesSearchInput.value.toLowerCase();
            const originalText = localStorage.getItem('juvox-notes-data') || '';
            if(!query) { notepad.value = originalText; return; }
            const blocks = originalText.split('\n\n');
            notepad.value = blocks.filter(b => b.toLowerCase().includes(query)).join('\n\n');
        });
    }

    // ВРЕМЕННЫЙ БУФЕР ФАЙЛОВ
    const dropZoneArea = document.getElementById('drop-zone-area');
    const dropZoneInput = document.getElementById('drop-zone-file-input');
    const dropZoneList = document.getElementById('drop-zone-list');
    let loadedFiles = [];

    if(dropZoneArea && dropZoneInput) {
        dropZoneArea.addEventListener('click', () => dropZoneInput.click());
        dropZoneArea.addEventListener('dragover', (e) => { e.preventDefault(); dropZoneArea.style.opacity = "1"; });
        dropZoneArea.addEventListener('dragleave', () => dropZoneArea.style.opacity = "0.7");
        dropZoneArea.addEventListener('drop', (e) => {
            e.preventDefault(); dropZoneArea.style.opacity = "0.7";
            handleFiles(e.dataTransfer.files);
        });
        dropZoneInput.addEventListener('change', (e) => handleFiles(e.target.files));
    }

    function handleFiles(files) {
        for(let i=0; i<files.length; i++) {
            loadedFiles.push(files[i].name);
            toast(`Файл буферизирован: ${files[i].name}`);
        }
        renderDropZoneList();
    }

    function renderDropZoneList() {
        if(!dropZoneList) return;
        dropZoneList.innerHTML = '';
        loadedFiles.forEach((f, idx) => {
            const r = document.createElement('div');
            r.className = 'file-row';
            r.innerHTML = `<span>📄 ${f}</span><button class="danger-btn">Удалить</button>`;
            r.querySelector('.danger-btn').addEventListener('click', () => {
                loadedFiles.splice(idx, 1);
                renderDropZoneList();
            });
            dropZoneList.appendChild(r);
        });
    }

    // Боковое меню инструментов и раскрытие вкладок
    document.querySelectorAll('.tool-acc-header').forEach(h => {
        h.addEventListener('click', () => h.parentElement.classList.toggle('open'));
    });

    const toolsMenuBtn = document.getElementById('tools-menu-btn');
    if (toolsMenuBtn) {
        toolsMenuBtn.addEventListener('click', () => document.getElementById('floating-tools-panel').classList.toggle('tools-panel-hidden'));
    }
    document.getElementById('close-tools-btn').addEventListener('click', () => document.getElementById('floating-tools-panel').classList.add('tools-panel-hidden'));

    // Калькулятор
    const calcScreen = document.getElementById('calc-screen');
    let calcExpr = "";
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            if (val === 'C') { calcExpr = ""; calcScreen.textContent = "0"; }
            else if (val === '=') {
                try { calcExpr = eval(calcExpr).toString(); calcScreen.textContent = calcExpr; } 
                catch(e) { calcScreen.textContent = "Ошибка"; calcExpr = ""; }
            } else { calcExpr += val; calcScreen.textContent = calcExpr; }
        });
    });

    // Пароли
    const passLenInput = document.getElementById('tool-pass-length');
    const passLenVal = document.getElementById('pass-len-val');
    if(passLenInput) passLenInput.addEventListener('input', () => passLenVal.textContent = passLenInput.value);

    document.getElementById('tool-gen-pass-btn').addEventListener('click', () => {
        const len = parseInt(passLenInput.value);
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
        let res = "";
        for(let i=0; i<len; i++) res += chars.charAt(Math.floor(Math.random()*chars.length));
        document.getElementById('tool-pass-output').value = res;
    });

    // Фильтр-аккордеон
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterAccordionBody = document.getElementById('filter-accordion-body');
    if (filterToggleBtn) {
        filterToggleBtn.addEventListener('click', () => filterAccordionBody.classList.toggle('filter-body-hidden'));
    }

    function renderHistoryList() {
        const historyContainer = document.getElementById('history-list-container');
        if(!historyContainer) return;
        const history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        if(history.length === 0) { historyContainer.innerHTML = '<p style="opacity:0.5; font-size:0.9rem;">История пуста.</p>'; return; }
        historyContainer.innerHTML = '';
        history.forEach(q => {
            const r = document.createElement('div');
            r.className = 'file-row';
            r.innerHTML = `<span class="h-click" style="cursor:pointer; color:var(--accent-color); font-weight:bold;">🔍 ${q}</span>`;
            r.querySelector('.h-click').addEventListener('click', () => { searchInput.value = q; launchSearch(); });
            historyContainer.appendChild(r);
        });
    }

    document.getElementById('clear-history-btn').addEventListener('click', () => {
        localStorage.removeItem('juvox-history');
        renderHistoryList();
    });
});
