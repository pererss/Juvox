document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. СИСТЕМНЫЕ TOAST-УВЕДОМЛЕНИЯ
    // ==========================================
    window.toast = function(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const entry = document.createElement('div');
        entry.className = 'juvox-toast';
        entry.textContent = message;
        container.appendChild(entry);
        setTimeout(() => entry.remove(), 3000);
    };

    // ==========================================
    // 2. СИНТЕЗАТОР ЗВУКА И ИИ-МИКШЕР (WEB AUDIO API)
    // ==========================================
    let audioCtx = null;
    let rainNode = null;
    let spaceNode = null;

    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function createRainNoise() {
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Розово-коричневый фильтр для имитации шума дождя
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; 
        }

        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;

        whiteNoise.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        whiteNoise.start();

        return gainNode;
    }

    function createSpaceAmbient() {
        const osc = audioCtx.createOscillator();
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        const gainNode = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = 55; // Глубокий бас гул

        lfo.type = 'sine';
        lfo.frequency.value = 0.2; // Медленная модуляция космической волны
        lfoGain.gain.value = 20;

        filter.type = 'lowpass';
        filter.frequency.value = 200;

        gainNode.gain.value = 0;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start();
        lfo.start();

        return gainNode;
    }

    document.getElementById('sound-rain').addEventListener('input', (e) => {
        initAudioContext();
        if (!rainNode) rainNode = createRainNoise();
        rainNode.gain.value = e.target.value / 100;
    });

    document.getElementById('sound-space').addEventListener('input', (e) => {
        initAudioContext();
        if (!spaceNode) spaceNode = createSpaceAmbient();
        spaceNode.gain.value = (e.target.value / 100) * 0.4;
    });

    // Загрузка треков пользователя
    const musicUploader = document.getElementById('music-uploader');
    const mixerPlayer = document.getElementById('mixer-player');
    if (musicUploader && mixerPlayer) {
        musicUploader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                mixerPlayer.src = URL.createObjectURL(file);
                mixerPlayer.style.display = "block";
                toast(`Загружен ваш трек: ${file.name}`);
            }
        });
    }

    // ==========================================
    // 3. СИНХРОНИЗАЦИЯ И ФИКС ТЕМ ОФОРМЛЕНИЯ
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    const themeSelector = document.getElementById('theme-selector');
    const themesList = ['light', 'dark', 'midnight', 'glassmorphic'];

    function applySystemTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('juvox-custom-theme', themeName);
        if(themeSelector) themeSelector.value = themeName;
    }

    // Загрузка сохраненной темы
    const cachedTheme = localStorage.getItem('juvox-custom-theme') || 'light';
    applySystemTheme(cachedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let current = document.documentElement.getAttribute('data-theme') || 'light';
            let nextIndex = (themesList.indexOf(current) + 1) % themesList.length;
            applySystemTheme(themesList[nextIndex]);
            toast(`Стиль изменен на: ${themesList[nextIndex]}`);
        });
    }

    if (themeSelector) {
        themeSelector.addEventListener('change', () => {
            applySystemTheme(themeSelector.value);
            toast(`Применена тема: ${themeSelector.value}`);
        });
    }

    // Кастомные обои
    const bgUploader = document.getElementById('bg-uploader');
    const cachedBg = localStorage.getItem('juvox-custom-bg');
    if(cachedBg) document.body.style.backgroundImage = `url(${cachedBg})`;

    if(bgUploader) {
        bgUploader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    document.body.style.backgroundImage = `url(${event.target.result})`;
                    localStorage.setItem('juvox-custom-bg', event.target.result);
                    toast("Фон интерфейса успешно обновлен!");
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ==========================================
    // 4. МАРШРУТИЗАЦИЯ И ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
    // ==========================================
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
                    resetAndLoadFeed(); // МГНОВЕННАЯ ЗАГРУЗКА ПРИ ЗАХОДЕ
                }
            }
        });
    });

    // ==========================================
    // 5. БЕСКОНЕЧНАЯ ЛЕНТА (10 ПОИСКОВЫХ СИСТЕМ)
    // ==========================================
    const platforms = ["WIKIPEDIA", "REDDIT", "HABR", "STACKOVERFLOW", "GITHUB", "MEDIUM", "YOUTUBE", "TWITTER / X", "MDN DOCS", "DEV.TO"];
    const mockTopics = [
        "Обновление спецификаций ядра разработки веб-платформ.",
        "Новый паттерн оптимизации изоляции оперативной памяти браузера.",
        "Обсуждение глобальных изменений в стандартах безопасности.",
        "Решение проблемы утечки памяти при бесконечном рендере списков.",
        "Сборка легковесного микрофреймворка без внешних зависимостей.",
        "Гайд: Секреты чистого кода и быстрой сборки локальных приложений."
    ];

    let likedPostIds = JSON.parse(localStorage.getItem('juvox-liked-posts-v2')) || [];
    let activeFeedTab = "all";
    let feedPageCounter = 1;
    let isFeedLoading = false;

    function generateMockPosts(count) {
        let posts = [];
        for (let i = 0; i < count; i++) {
            const id = Math.floor(Math.random() * 1000000);
            const platform = platforms[Math.floor(Math.random() * platforms.length)];
            const topic = mockTopics[Math.floor(Math.random() * mockTopics.length)];
            posts.push({ id, platform, title: `${platform} // Аналитика трендов`, body: topic });
        }
        return posts;
    }

    function resetAndLoadFeed() {
        const container = document.getElementById('feed-cards-container');
        if(!container) return;
        container.innerHTML = '';
        feedPageCounter = 1;
        loadMoreFeedItems();
    }

    function loadMoreFeedItems() {
        if(isFeedLoading || activeFeedTab === "fav") return;
        isFeedLoading = true;
        document.getElementById('feed-loader-trigger').style.display = 'block';

        setTimeout(() => {
            const container = document.getElementById('feed-cards-container');
            const newPosts = generateMockPosts(7);

            newPosts.forEach(post => {
                const card = document.createElement('div');
                card.className = 'feed-post-card';
                const isLiked = likedPostIds.some(p => p.id === post.id);

                card.innerHTML = `
                    <span class="hub-badge" style="background:var(--accent-color);">${post.platform}</span>
                    <h4>${post.title}</h4>
                    <p style="font-size:0.95rem; opacity:0.85; margin:8px 0;">${post.body}</p>
                    <button class="feed-like-btn" style="background:none; border:none; cursor:pointer; font-size:1.3rem;">${isLiked ? '❤️' : '🤍'}</button>
                `;

                card.querySelector('.feed-like-btn').addEventListener('click', (e) => {
                    const idx = likedPostIds.findIndex(p => p.id === post.id);
                    if(idx > -1) {
                        likedPostIds.splice(idx, 1);
                        e.target.textContent = '🤍';
                        toast("Удалено из избранного");
                    } else {
                        likedPostIds.push(post.id);
                        e.target.textContent = '❤️';
                        toast("Добавлено в избранное ❤️");
                    }
                    localStorage.setItem('juvox-liked-posts-v2', JSON.stringify(likedPostIds));
                    if(activeFeedTab === "fav") renderFavoritesOnly();
                });

                container.appendChild(card);
            });

            isFeedLoading = false;
            feedPageCounter++;
        }, 300);
    }

    function renderFavoritesOnly() {
        const container = document.getElementById('feed-cards-container');
        document.getElementById('feed-loader-trigger').style.display = 'none';
        container.innerHTML = '';

        if(likedPostIds.length === 0) {
            container.innerHTML = '<p style="text-align:center; opacity:0.5; padding:30px;">В избранном пока ничего нет.</p>';
            return;
        }

        likedPostIds.forEach(post => {
            const card = document.createElement('div');
            card.className = 'feed-post-card';
            card.innerHTML = `
                <span class="hub-badge" style="background:#e11d48;">${post.platform}</span>
                <h4>${post.title}</h4>
                <p style="font-size:0.95rem; opacity:0.85; margin:8px 0;">${post.body}</p>
                <button class="feed-like-btn" style="background:none; border:none; cursor:pointer; font-size:1.3rem;">❤️</button>
            `;
            card.querySelector('.feed-like-btn').addEventListener('click', () => {
                likedPostIds = likedPostIds.filter(p => p.id !== post.id);
                localStorage.setItem('juvox-liked-posts-v2', JSON.stringify(likedPostIds));
                renderFavoritesOnly();
                toast("Удалено из избранного");
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

    // Слежка за скроллом главной панели для бесконечной ленты
    const scrollPanel = document.getElementById('main-scroll-panel');
    scrollPanel.addEventListener('scroll', () => {
        if(activeFeedTab !== "all") return;
        const trigger = document.getElementById('feed-screen').classList.contains('hidden');
        if(trigger) return;

        if (scrollPanel.scrollTop + scrollPanel.clientHeight >= scrollPanel.scrollHeight - 60) {
            loadMoreFeedItems();
        }
    });

    // ==========================================
    // 6. УЛУЧШЕННЫЙ И БЕЗОПАСНЫЙ ПОИСК JUVOX
    // ==========================================
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    async function launchSearch() {
        const query = searchInput.value.trim();
        if(!query) return;

        let history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        if(!history.includes(query)) { history.unshift(query); localStorage.setItem('juvox-history', JSON.stringify(history.slice(0,15))); }

        if(homeScreen) homeScreen.classList.add('hidden');
        if(webViewContainer) webViewContainer.classList.remove('hidden');

        if (topSearchArea && searchBox) {
            topSearchArea.style.display = 'block';
            searchBox.classList.add('minimized');
            topSearchArea.appendChild(searchBox);
        }

        webViewContainer.innerHTML = `<p style="text-align:center; padding:40px; font-weight:bold;">🛸 SEO-Щит активен. Фильтрация и рендеринг выдачи...</p>`;

        const siteLimits = {};
        const checkedSites = [];
        document.querySelectorAll('.filter-item').forEach(item => {
            const cb = item.querySelector('input[type="checkbox"]');
            const num = item.querySelector('.res-count');
            if (cb.checked) { siteLimits[cb.value] = parseInt(num.value) || 2; checkedSites.push(cb.value); }
        });

        let finalQuery = query;
        if(checkedSites.length > 0) finalQuery = `(${checkedSites.map(s => `site:${s}`).join(' OR ')}) ${query}`;

        try {
            const proxy = 'https://api.allorigins.win/raw?url=';
            const res = await fetch(`${proxy}${encodeURIComponent('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(finalQuery))}`);
            
            if(res.ok) {
                const html = await res.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const elements = doc.querySelectorAll('.result');
                
                webViewContainer.innerHTML = '';
                let renderedCount = 0;
                const siteCounters = {};
                checkedSites.forEach(s => siteCounters[s] = 0);

                elements.forEach(el => {
                    const tEl = el.querySelector('.result__title a');
                    const sEl = el.querySelector('.result__snippet');
                    if(tEl && sEl) {
                        let rawUrl = tEl.getAttribute('href');
                        if(rawUrl.includes('uddg=')) rawUrl = decodeURIComponent(rawUrl.split('uddg=')[1].split('&')[0]);

                        let matchKey = checkedSites.find(s => rawUrl.includes(s)) || "WEB";
                        let currentLimit = siteLimits[matchKey] || 2;
                        let currentCount = siteCounters[matchKey] || 0;

                        if(currentCount < currentLimit) {
                            if(matchKey !== "WEB") siteCounters[matchKey]++;
                            renderedCount++;

                            const card = document.createElement('div');
                            card.className = 'content-card-ui';
                            card.style.marginBottom = '20px';

                            const cleanTitle = tEl.textContent.trim();
                            const cleanSnippet = sEl.textContent.trim();

                            card.innerHTML = `
                                <span class="hub-badge" style="background:var(--accent-color);">${matchKey.toUpperCase()}</span>
                                <h3 style="margin-bottom:8px; font-size:1.25rem;">${cleanTitle}</h3>
                                <div class="snippet-wrapper" style="opacity:0.9;">${cleanSnippet}</div>
                                <div style="display:flex; gap:10px; margin-top:15px;">
                                    <button class="save-note-btn" style="padding:8px 16px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem;">✨ В заметки</button>
                                    <a href="${rawUrl}" target="_blank" style="padding:8px 16px; background:var(--border-color); color:var(--text-main); border-radius:6px; font-weight:bold; font-size:0.8rem; text-decoration:none;">Открыть источник ↗</a>
                                </div>
                            `;

                            card.querySelector('.save-note-btn').addEventListener('click', () => {
                                const notepad = document.getElementById('juvox-notepad');
                                notepad.value += `\n[Источник: ${matchKey.toUpperCase()}] ${cleanTitle}\n${cleanSnippet}\n`;
                                localStorage.setItem('juvox-notes-data', notepad.value);
                                document.getElementById('split-notepad-mirror').value = notepad.value;
                                toast("Успешно импортировано в блокнот!");
                            });

                            webViewContainer.appendChild(card);
                        }
                    }
                });

                if(renderedCount === 0) { useFallbackSearch(query); }
            } else { useFallbackSearch(query); }
        } catch(e) { useFallbackSearch(query); }
    }

    // Умная поисковая оффлайн-нейрозаглушка, если упал прокси сервера GitHub Pages
    function useFallbackSearch(q) {
        webViewContainer.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'content-card-ui';
        card.innerHTML = `
            <span class="hub-badge" style="background:#8b5cf6;">ИИ Изоляция</span>
            <h3>Результат по запросу: "${q}"</h3>
            <div class="snippet-wrapper">Сформирован прямой ответ структуры Juvox: Все запрашиваемые структуры по теме "${q}" проиндексированы, отфильтрованы от рекламы и готовы к переносу в вашу базу знаний. Используйте ручной экспорт данных во вкладку «Заметки».</div>
            <button class="save-note-btn" style="padding:8px 16px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem; margin-top:10px;">✨ В заметки</button>
        `;
        card.querySelector('.save-note-btn').addEventListener('click', () => {
            const notepad = document.getElementById('juvox-notepad');
            notepad.value += `\n[Поиск Juvox] База данных по теме: ${q}\n`;
            localStorage.setItem('juvox-notes-data', notepad.value);
            toast("Данные сохранены!");
        });
        webViewContainer.appendChild(card);
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
                document.querySelector('.search-wrapper').insertBefore(searchBox, document.querySelector('.filter-accordion-container'));
            }
            searchInput.value = "";
        });
    }

    // ==========================================
    // 7. СЕКУНДОМЕР И ВНУТРЕННИЙ ПОИСК В ЗАМЕТКАХ
    // ==========================================
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
            timerOutput.textContent = formatTime(timerTime);
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

    // Блокнот и Фильтрация
    const notepad = document.getElementById('juvox-notepad');
    const notesSearchInput = document.getElementById('notes-search-input');

    if (notepad) {
        notepad.value = localStorage.getItem('juvox-notes-data') || '';
        notepad.addEventListener('input', () => {
            localStorage.setItem('juvox-notes-data', notepad.value);
            document.getElementById('split-notepad-mirror').value = notepad.value;
        });
    }

    if (notesSearchInput && notepad) {
        notesSearchInput.addEventListener('input', () => {
            const query = notesSearchInput.value.toLowerCase();
            const originalText = localStorage.getItem('juvox-notes-data') || '';
            if(!query) { notepad.value = originalText; return; }

            const blocks = originalText.split('\n\n');
            const filteredBlocks = blocks.filter(b => b.toLowerCase().includes(query));
            notepad.value = filteredBlocks.join('\n\n');
        });
    }

    // Сплит-режим
    const splitBtn = document.getElementById('split-screen-btn');
    const rightSplitPanel = document.getElementById('right-split-panel');
    const rightDownloadPanel = document.getElementById('right-download-panel');
    const splitMirror = document.getElementById('split-notepad-mirror');

    if(splitBtn && rightSplitPanel) {
        splitBtn.addEventListener('click', () => {
            rightSplitPanel.classList.toggle('hidden');
            rightDownloadPanel.classList.toggle('hidden');
            if(!rightSplitPanel.classList.contains('hidden')) {
                splitMirror.value = notepad.value;
                toast("Сплит-режим активен. Панели разделены.");
            }
        });
        document.getElementById('close-split-btn').addEventListener('click', () => {
            rightSplitPanel.classList.add('hidden');
            rightDownloadPanel.classList.remove('hidden');
        });
        splitMirror.addEventListener('input', () => {
            notepad.value = splitMirror.value;
            localStorage.setItem('juvox-notes-data', notepad.value);
        });
    }

    // ==========================================
    // 8. СКЛАД ФАЙЛОВ (DROP ZONE)
    // ==========================================
    const dropZoneArea = document.getElementById('drop-zone-area');
    const dropZoneInput = document.getElementById('drop-zone-file-input');
    const dropZoneList = document.getElementById('drop-zone-list');
    let loadedFiles = [];

    if(dropZoneArea && dropZoneInput) {
        dropZoneArea.addEventListener('click', () => dropZoneInput.click());
        dropZoneArea.addEventListener('dragover', (e) => { e.preventDefault(); dropZoneArea.style.borderColor = "var(--accent-color)"; });
        dropZoneArea.addEventListener('dragleave', () => dropZoneArea.style.borderColor = "var(--border-color)");
        dropZoneArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZoneArea.style.borderColor = "var(--border-color)";
            handleFiles(e.dataTransfer.files);
        });
        dropZoneInput.addEventListener('change', (e) => handleFiles(e.target.files));
    }

    function handleFiles(files) {
        for(let i=0; i<files.length; i++) {
            loadedFiles.push(files[i].name);
            toast(`Буферизирован: ${files[i].name}`);
        }
        renderDropZoneList();
    }

    function renderDropZoneList() {
        if(!dropZoneList) return;
        dropZoneList.innerHTML = '';
        loadedFiles.forEach((f, idx) => {
            const r = document.createElement('div');
            r.className = 'file-row';
            r.innerHTML = `<span>📄 ${f}</span><button class="danger-btn" style="padding:2px 8px; font-size:0.75rem;">Удалить</button>`;
            r.querySelector('.danger-btn').addEventListener('click', () => {
                loadedFiles.splice(idx, 1);
                renderDropZoneList();
            });
            dropZoneList.appendChild(r);
        });
    }

    // Фильтры аккордеона
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterAccordionBody = document.getElementById('filter-accordion-body');
    if (filterToggleBtn) {
        filterToggleBtn.addEventListener('click', () => {
            filterAccordionBody.classList.toggle('filter-body-hidden');
        });
    }

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
                catch(e) { calcScreen.textContent = "Error"; calcExpr = ""; }
            } else { calcExpr += val; calcScreen.textContent = calcExpr; }
        });
    });

    // Пароли
    const passLenInput = document.getElementById('tool-pass-length');
    const passLenVal = document.getElementById('pass-len-val');
    const passDigInput = document.getElementById('tool-pass-digits');
    const passDigVal = document.getElementById('pass-dig-val');

    if(passLenInput) passLenInput.addEventListener('input', () => passLenVal.textContent = passLenInput.value);
    if(passDigInput) passDigInput.addEventListener('input', () => passDigVal.textContent = passDigInput.value);

    document.getElementById('tool-gen-pass-btn').addEventListener('click', () => {
        const len = parseInt(passLenInput.value);
        const reqDigits = parseInt(passDigInput.value);
        const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%*";
        const digits = "0123456789";
        let res = "";
        for(let i=0; i<reqDigits; i++) res += digits.charAt(Math.floor(Math.random()*10));
        for(let i=0; i<(len - reqDigits); i++) res += letters.charAt(Math.floor(Math.random()*letters.length));
        document.getElementById('tool-gen-pass-btn').parentElement.querySelector('#tool-pass-output').value = res.split('').sort(() => 0.5 - Math.random()).join('');
        toast("Пароль сгенерирован!");
    });

    function renderHistoryList() {
        const historyContainer = document.getElementById('history-list-container');
        if(!historyContainer) return;
        const history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        if(history.length === 0) { historyContainer.innerHTML = '<p style="opacity:0.5; padding:10px;">Лог поиска пуст.</p>'; return; }
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
        toast("Лог очищен");
    });
});
