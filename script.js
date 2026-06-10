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

    // МЕНЕДЖЕР ВИДЖЕТОВ (БЕЗОПАСНЫЙ С ФИКСОМ)
    const toggleStopwatchCB = document.getElementById('setting-toggle-stopwatch');
    const mainWidgetsZone = document.getElementById('main-widgets-zone');
    
    function syncWidgetsState() {
        const showStopwatch = localStorage.getItem('widget-stopwatch-enabled') === 'true';
        if(toggleStopwatchCB) toggleStopwatchCB.checked = showStopwatch;
        
        if (mainWidgetsZone) {
            if(showStopwatch) {
                mainWidgetsZone.classList.remove('id-hidden');
            } else {
                mainWidgetsZone.classList.add('id-hidden');
            }
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
            
            const toolsPanel = document.getElementById('floating-tools-panel');
            if (toolsPanel) toolsPanel.classList.add('tools-panel-hidden');

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
            }
        });
    });

    // БАЗА ДАННЫХ ДЛЯ ПОИСКА
    const contentDatabase = {
        wikipedia: [
            { title: "Архитектура веб-браузеров", url: "https://wikipedia.org/wiki/Web_browser", body: "Современные браузеры состоят из подсистем сетевого уровня, движка рендеринга (Blink, Gecko) и интерпретатора JavaScript. Изоляция процессов позволяет предотвратить падение всего приложения при критической ошибке на отдельной веб-странице. Локальное хранилище данных обеспечивает кэширование сессий пользователей." },
            { title: "Инкапсуляция и структуры данных", url: "https://wikipedia.org/wiki/Encapsulation", body: "Инкапсуляция в программировании — это свойство системы, позволяющее объединить данные и методы, работающие с ними, в едином компоненте. Это защищает внутреннее состояние объекта от прямого несанкционированного доступа извне." }
        ],
        reddit: [
            { title: "Почему минимализм во фронтенде побеждает?", url: "https://reddit.com/r/webdev", body: "Разработчики устали от огромных фреймворков и лишней анимации. Пользователю нужен чистый контент, быстрая скорость отрисовки первого экрана и отсутствие навязчивых блоков трекинга. Чем меньше кода загружает клиентская машина, тем лучше UX и выше автономность системы." }
        ],
        habr: [
            { title: "Отказываемся от CORS ограничений и внешних библиотек", url: "https://habr.com/post/102", body: "При проектировании легких интерфейсов часто возникает проблема с CORS-политиками публичных API. Решается это либо переходом на изолированные локальные скрипты генерации, либо использованием прозрачных легковесных асинхронных функций." }
        ],
        stackoverflow: [
            { title: "Как реализовать бесконечный скролл без утечки памяти?", url: "https://stackoverflow.com/questions/1", body: "При добавлении сотен элементов в DOM браузер начинает потреблять слишком много ОЗУ. Рекомендуется использовать IntersectionObserver API для динамической выгрузки невидимых карточек контента." }
        ],
        github: [
            { title: "Репозиторий: Минималистичные ядра для веб-интерфейсов", url: "https://github.com/juvox/core", body: "Открытый исходный код легковесного окружения. Полное отсутствие внешних отслеживающих систем, скрытых аналитик и рекламных баннеров. Изолированная среда выполнения." }
        ]
    };

    // ПОИСКОВЫЙ ДВИЖОК
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    function launchSearch() {
        if (!searchInput) return;
        const query = searchInput.value.trim();
        if(!query) return;

        let history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        if(!history.includes(query)) { history.unshift(query); localStorage.setItem('juvox-history', JSON.stringify(history.slice(0,10))); }

        if (homeScreen) homeScreen.classList.add('hidden');
        if (webViewContainer) webViewContainer.classList.remove('hidden');

        if (topSearchArea && searchBox) {
            topSearchArea.style.display = 'block';
            searchBox.classList.add('minimized');
            topSearchArea.appendChild(searchBox);
        }

        if (webViewContainer) webViewContainer.innerHTML = '';

        const activeSources = [];
        document.querySelectorAll('.filter-grid input[type="checkbox"]').forEach(cb => {
            if(cb.checked) activeSources.push(cb.value);
        });

        let foundResults = 0;

        activeSources.forEach(src => {
            const list = contentDatabase[src] || [];
            list.forEach(item => {
                if(item.title.toLowerCase().includes(query.toLowerCase()) || item.body.toLowerCase().includes(query.toLowerCase()) || query.length > 2) {
                    foundResults++;
                    const card = document.createElement('div');
                    card.className = 'feed-post-card';
                    card.style.background = 'var(--bg-card)';
                    card.style.padding = '20px';
                    card.style.borderRadius = '12px';
                    card.style.marginBottom = '15px';
                    card.style.border = '1px solid var(--border-color)';

                    card.innerHTML = `
                        <span style="background:var(--accent-color); color:white; padding:2px 8px; font-size:0.75rem; font-weight:bold; border-radius:4px;">${src.toUpperCase()}</span>
                        <h3 style="margin: 10px 0;">${item.title}</h3>
                        <p style="font-size:0.95rem; line-height:1.5; color:var(--text-main); opacity:0.8;">${item.body}</p>
                        <div style="margin-top:12px;">
                            <a href="${item.url}" target="_blank" style="color:var(--accent-color); font-weight:bold; text-decoration:none; font-size:0.85rem;">Перейти на сайт ↗</a>
                        </div>
                    `;
                    if (webViewContainer) webViewContainer.appendChild(card);
                }
            });
        });

        if(foundResults === 0 && webViewContainer) {
            webViewContainer.innerHTML = `<div style="text-align:center; padding:40px; opacity:0.5;">Ничего не найдено</div>`;
        }
    }

    if(searchBtn) searchBtn.addEventListener('click', launchSearch);
    if(searchInput) searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') launchSearch(); });

    if (logo) {
        logo.addEventListener('click', () => {
            if (homeScreen) homeScreen.classList.remove('hidden');
            if (webViewContainer) webViewContainer.classList.add('hidden');
            if (topSearchArea) topSearchArea.style.display = 'none';
            if (searchBox) {
                searchBox.classList.remove('minimized');
                const wrapper = document.querySelector('.search-wrapper');
                if (wrapper) wrapper.insertBefore(searchBox, document.querySelector('.filter-accordion-container'));
            }
            if (searchInput) searchInput.value = "";
        });
    }

    // СЕКУНДОМЕР И КАЛЬКУЛЯТОР
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

    const tStart = document.getElementById('timer-start-btn');
    if (tStart) {
        tStart.addEventListener('click', () => {
            if (timerInterval) return;
            timerInterval = setInterval(() => {
                timerTime++;
                if (timerOutput) timerOutput.textContent = formatTime(timerTime) + '.' + (timerTime%100).toString().padStart(2,'0');
                if (widgetTimerView) widgetTimerView.textContent = formatTime(timerTime);
            }, 10);
        });
    }

    const tStop = document.getElementById('timer-stop-btn');
    if (tStop) {
        tStop.addEventListener('click', () => { clearInterval(timerInterval); timerInterval = null; });
    }

    const tReset = document.getElementById('timer-reset-btn');
    if (tReset) {
        tReset.addEventListener('click', () => {
            clearInterval(timerInterval); timerInterval = null; timerTime = 0;
            if (timerOutput) timerOutput.textContent = "00:00.00";
            if (widgetTimerView) widgetTimerView.textContent = "00:00";
        });
    }

    // Калькулятор
    const calcScreen = document.getElementById('calc-screen');
    let calcExpr = "";
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            if (!calcScreen) return;
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
    if(passLenInput && passLenVal) passLenInput.addEventListener('input', () => passLenVal.textContent = passLenInput.value);

    const genPassBtn = document.getElementById('tool-gen-pass-btn');
    if (genPassBtn) {
        genPassBtn.addEventListener('click', () => {
            if (!passLenInput) return;
            const len = parseInt(passLenInput.value);
            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
            let res = "";
            for(let i=0; i<len; i++) res += chars.charAt(Math.floor(Math.random()*chars.length));
            const out = document.getElementById('tool-pass-output');
            if (out) out.value = res;
        });
    }

    // Буфер файлов
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
        for(let i=0; i<files.length; i++) { loadedFiles.push(files[i].name); }
        renderDropZoneList();
    }

    function renderDropZoneList() {
        if(!dropZoneList) return;
        dropZoneList.innerHTML = '';
        loadedFiles.forEach((f, idx) => {
            const r = document.createElement('div');
            r.className = 'file-row';
            r.innerHTML = `<span>📄 ${f}</span><button class="danger-btn" style="margin-left:10px;">Удалить</button>`;
            r.querySelector('.danger-btn').addEventListener('click', () => { loadedFiles.splice(idx, 1); renderDropZoneList(); });
            dropZoneList.appendChild(r);
        });
    }

    // Инструменты
    document.querySelectorAll('.tool-acc-header').forEach(h => {
        h.addEventListener('click', () => h.parentElement.classList.toggle('open'));
    });

    const toolsMenuBtn = document.getElementById('tools-menu-btn');
    if (toolsMenuBtn) {
        toolsMenuBtn.addEventListener('click', () => {
            const panel = document.getElementById('floating-tools-panel');
            if (panel) panel.classList.toggle('tools-panel-hidden');
        });
    }
    const closeToolsBtn = document.getElementById('close-tools-btn');
    if (closeToolsBtn) {
        closeToolsBtn.addEventListener('click', () => {
            const panel = document.getElementById('floating-tools-panel');
            if (panel) panel.classList.add('tools-panel-hidden');
        });
    }

    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterAccordionBody = document.getElementById('filter-accordion-body');
    if (filterToggleBtn && filterAccordionBody) {
        filterToggleBtn.addEventListener('click', () => filterAccordionBody.classList.toggle('filter-body-hidden'));
    }

    function renderHistoryList() {
        const historyContainer = document.getElementById('history-list-container');
        if(!historyContainer) return;
        const history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        if(history.length === 0) { historyContainer.innerHTML = '<p style="opacity:0.5;">История пуста.</p>'; return; }
        historyContainer.innerHTML = '';
        history.forEach(q => {
            const r = document.createElement('div');
            r.style.padding = '8px 0';
            r.innerHTML = `<span style="cursor:pointer; color:var(--accent-color);">🔍 ${q}</span>`;
            r.querySelector('span').addEventListener('click', () => { if (searchInput) searchInput.value = q; launchSearch(); });
            historyContainer.appendChild(r);
        });
    }

    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => { localStorage.removeItem('juvox-history'); renderHistoryList(); });
    }
});
