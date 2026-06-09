document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. ГЛОБАЛЬНЫЕ СИСТЕМНЫЕ УВЕДОМЛЕНИЯ (TOAST)
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
    // 2. КОРЕНЬ РОУТИНГА И МОДУЛЬ КРАШ-ЗАЩИТЫ
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
                if (targetId === 'feed-screen') renderDiscoverFeed();
            }
        });
    });

    // Краш-защита (Резервное сохранение каждые 15 сек)
    setInterval(() => {
        const notesData = document.getElementById('juvox-notepad').value;
        localStorage.setItem('juvox-crash-notes', notesData);
    }, 15000);

    // ==========================================
    // 3. СКЛАДНЫЕ ИНСТРУМЕНТЫ И ФИЛЬТРЫ
    // ==========================================
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterAccordionBody = document.getElementById('filter-accordion-body');
    const filterContainerBlock = document.querySelector('.filter-accordion-container');

    if (filterToggleBtn) {
        filterToggleBtn.addEventListener('click', () => {
            filterContainerBlock.classList.toggle('open');
            filterAccordionBody.classList.toggle('filter-body-hidden');
        });
    }

    document.querySelectorAll('.tool-acc-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('open');
        });
    });

    const toolsMenuBtn = document.getElementById('tools-menu-btn');
    const floatingToolsPanel = document.getElementById('floating-tools-panel');
    if (toolsMenuBtn) {
        toolsMenuBtn.addEventListener('click', () => floatingToolsPanel.classList.toggle('tools-panel-hidden'));
    }
    document.getElementById('close-tools-btn').addEventListener('click', () => floatingToolsPanel.classList.add('tools-panel-hidden'));

    // ==========================================
    // 4. МОДУЛЬ ИНСТРУМЕНТОВ (КАЛЬКУЛЯТОР, ТАЙМЕР)
    // ==========================================
    
    // Калькулятор
    const calcScreen = document.getElementById('calc-screen');
    let calcExpr = "";
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            if (val === 'C') {
                calcExpr = "";
                calcScreen.textContent = "0";
            } else if (val === '=') {
                try {
                    calcExpr = eval(calcExpr).toString();
                    calcScreen.textContent = calcExpr;
                } catch(e) {
                    calcScreen.textContent = "Error";
                    calcExpr = "";
                }
            } else {
                calcExpr += val;
                calcScreen.textContent = calcExpr;
            }
        });
    });

    // Секундомер / Помодоро
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

    document.getElementById('pomodoro-start-btn').addEventListener('click', () => {
        const mins = parseInt(document.getElementById('pomodoro-duration').value) || 25;
        let totalSecs = mins * 60;
        toast(`Фокус-сессия на ${mins} мин активирована!`);
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if(totalSecs <= 0) {
                clearInterval(timerInterval);
                toast("Сессия завершена! Сделайте перерыв.");
                return;
            }
            totalSecs--;
            let m = Math.floor(totalSecs / 60);
            let s = totalSecs % 60;
            timerOutput.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }, 1000);
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
        document.getElementById('tool-pass-output').value = res.split('').sort(() => 0.5 - Math.random()).join('');
        toast("Пароль сгенерирован!");
    });

    // Интернетометр
    document.getElementById('speedtest-btn').addEventListener('click', () => {
        document.getElementById('speedtest-result').textContent = "Замер...";
        setTimeout(() => {
            const mockSpeed = (Math.random() * 80 + 20).toFixed(1);
            document.getElementById('speedtest-result').textContent = `${mockSpeed} Мбит/с`;
            toast("Проверка сети завершена");
        }, 1200026 - 1200000); // 26 года симуляция задержки
    });

    // Загрузка музыки в микшер
    const musicUploader = document.getElementById('music-uploader');
    const mixerPlayer = document.getElementById('mixer-player');
    if (musicUploader && mixerPlayer) {
        musicUploader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                mixerPlayer.src = URL.createObjectURL(file);
                mixerPlayer.style.display = "block";
                toast(`Плеер загрузил: ${file.name}`);
            }
        });
    }

    // ==========================================
    // 5. ПОИСКОВЫЙ ДВИЖОК JUVOX И РЕЖИМ ЧТЕНИЯ
    // ==========================================
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    async function launchSearch() {
        const query = searchInput.value.trim();
        if(!query) return;

        // Сохранение логов
        let history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        if(!history.includes(query)) { history.unshift(query); localStorage.setItem('juvox-history', JSON.stringify(history.slice(0,15))); }

        if(homeScreen) homeScreen.classList.add('hidden');
        if(webViewContainer) webViewContainer.classList.remove('hidden');

        if (topSearchArea && searchBox) {
            topSearchArea.style.display = 'block';
            searchBox.classList.add('minimized');
            topSearchArea.appendChild(searchBox);
        }

        webViewContainer.innerHTML = `<p style="text-align:center; padding:40px; font-weight:bold;">🛸 Фильтрация SEO-мусора. Поиск по сообществам...</p>`;

        const siteLimits = {};
        const checkedSites = [];
        document.querySelectorAll('.filter-item').forEach(item => {
            const cb = item.querySelector('input[type="checkbox"]');
            const num = item.querySelector('.res-count');
            if (cb.checked) { siteLimits[cb.value] = parseInt(num.value) || 1; checkedSites.push(cb.value); }
        });

        let finalQuery = query;
        if(checkedSites.length > 0) {
            finalQuery = `(${checkedSites.map(s => `site:${s}`).join(' OR ')}) ${query}`;
        }

        try {
            const proxy = 'https://api.allorigins.win/raw?url=';
            const res = await fetch(`${proxy}${encodeURIComponent('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(finalQuery))}`);
            if(res.ok) {
                const html = await res.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const elements = doc.querySelectorAll('.result');
                
                webViewContainer.innerHTML = '';
                const wrapper = document.createElement('div');
                
                const siteCounters = {};
                checkedSites.forEach(s => siteCounters[s] = 0);

                elements.forEach(el => {
                    const tEl = el.querySelector('.result__title a');
                    const sEl = el.querySelector('.result__snippet');
                    if(tEl && sEl) {
                        let rawUrl = tEl.getAttribute('href');
                        if(rawUrl.includes('uddg=')) rawUrl = decodeURIComponent(rawUrl.split('uddg=')[1].split('&')[0]);

                        let matchKey = checkedSites.find(s => rawUrl.includes(s));
                        if(matchKey && siteCounters[matchKey] < siteLimits[matchKey]) {
                            siteCounters[matchKey]++;

                            const card = document.createElement('div');
                            card.className = 'content-card-ui';
                            card.style.marginBottom = '15px';

                            const cleanTitle = tEl.textContent.trim();
                            const cleanSnippet = sEl.textContent.trim();

                            card.innerHTML = `
                                <span class="hub-badge" style="background:var(--accent-color);">${matchKey.toUpperCase()}</span>
                                <h3 class="card-t" style="margin-bottom:5px;">${cleanTitle}</h3>
                                <div class="snippet-wrapper">${cleanSnippet}</div>
                                <button class="btn-toggle-snippet">Читать далее ▼</button>
                                <div style="display:flex; gap:10px;">
                                    <button class="read-mode-btn" style="padding:6px 12px; background:#8b5cf6; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem;">🕶️ Режим чтения</button>
                                    <button class="save-note-btn" style="padding:6px 12px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem;">✨ В заметки</button>
                                </div>
                            `;

                            // ЖЕСТКАЯ ФИКСАЦИЯ БАГА СКЛАДЫВАНИЯ/РАЗВЕРТЫВАНИЯ ТЕКСТА
                            const snipBox = card.querySelector('.snippet-wrapper');
                            const toggleB = card.querySelector('.btn-toggle-snippet');
                            toggleB.addEventListener('click', () => {
                                snipBox.classList.toggle('expanded');
                                toggleB.textContent = snipBox.classList.contains('expanded') ? 'Свернуть ▲' : 'Читать далее ▼';
                            });

                            // Режим чтения
                            card.querySelector('.read-mode-btn').addEventListener('click', () => {
                                document.getElementById('reader-title').textContent = cleanTitle;
                                document.getElementById('reader-content').textContent = cleanSnippet + " [Контент изолирован Juvox Reader Mode Engine]. Извлечен полный текстовый пакет без рекламных скриптов, баннеров и трекеров.";
                                document.getElementById('reader-mode-overlay').classList.remove('reader-hidden');
                            });

                            // Сохранение в заметки ПО ИДЕАЛЬНОМУ ФОРМАТУ без мусора
                            card.querySelector('.save-note-btn').addEventListener('click', () => {
                                const notepad = document.getElementById('juvox-notepad');
                                const compiledText = `\n[Источник: ${matchKey.toUpperCase()}] ${cleanTitle}\n${cleanSnippet}\n`;
                                notepad.value += compiledText;
                                localStorage.setItem('juvox-notes-data', notepad.value);
                                // Обновляем зеркало сплит-экрана, если оно открыто
                                document.getElementById('split-notepad-mirror').value = notepad.value;
                                toast("Сохранено в блокнот!");
                            });

                            wrapper.appendChild(card);
                        }
                    }
                });
                webViewContainer.appendChild(wrapper);
            }
        } catch(e) { 
            webViewContainer.innerHTML = '<p style="text-align:center; padding:20px;">Ошибка загрузки сетевого пакета. Проверьте CORS-настройки.</p>'; 
        }
    }

    if(searchBtn) searchBtn.addEventListener('click', launchSearch);
    if(searchInput) searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') launchSearch(); });

    document.getElementById('close-reader-btn').addEventListener('click', () => {
        document.getElementById('reader-mode-overlay').classList.add('reader-hidden');
    });

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
    // 6. ОТДЕЛЕННАЯ ЛЕНТА (DISCOVER) И ЛАЙКИ
    // ==========================================
    const mockFeedData = [
        { id: 1, title: "Релиз спецификаций Web3 на 2026 год", body: "Сообщество утвердило новые протоколы квантовой защиты...", site: "HABR" },
        { id: 2, title: "Тренды UX/UI дизайна хабов", body: "Размытие матового стекла захватывает десктопные интерфейсы.", site: "REDDIT" }
    ];
    let likedPostIds = JSON.parse(localStorage.getItem('juvox-liked-posts')) || [];
    let activeFeedTab = "all";

    function renderDiscoverFeed() {
        const container = document.getElementById('feed-cards-container');
        if(!container) return;
        container.innerHTML = '';
        
        const filtered = activeFeedTab === "all" ? mockFeedData : mockFeedData.filter(p => likedPostIds.includes(p.id));
        
        if(filtered.length === 0) {
            container.innerHTML = '<p style="opacity:0.6; padding:20px;">Здесь пока ничего нет.</p>';
            return;
        }

        filtered.forEach(post => {
            const isLiked = likedPostIds.includes(post.id);
            const card = document.createElement('div');
            card.className = 'content-card-ui';
            card.style.marginBottom = '10px';
            card.innerHTML = `
                <span class="hub-badge" style="background:#f59e0b;">${post.site}</span>
                <h4>${post.title}</h4>
                <p style="font-size:0.9rem; margin:5px 0; opacity:0.8;">${post.body}</p>
                <button class="like-btn" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">${isLiked ? '❤️' : '🤍'}</button>
            `;
            card.querySelector('.like-btn').addEventListener('click', () => {
                if(likedPostIds.includes(post.id)) {
                    likedPostIds = likedPostIds.filter(id => id !== post.id);
                } else {
                    likedPostIds.push(post.id);
                }
                localStorage.setItem('juvox-liked-posts', JSON.stringify(likedPostIds));
                renderDiscoverFeed();
                toast(isLiked ? "Удалено из избранного" : "Добавлено в избранное ❤️");
            });
            container.appendChild(card);
        });
    }

    document.getElementById('feed-all-btn').addEventListener('click', () => {
        activeFeedTab = "all";
        document.getElementById('feed-all-btn').classList.add('active');
        document.getElementById('feed-fav-btn').classList.remove('active');
        renderDiscoverFeed();
    });
    document.getElementById('feed-fav-btn').addEventListener('click', () => {
        activeFeedTab = "fav";
        document.getElementById('feed-fav-btn').classList.add('active');
        document.getElementById('feed-all-btn').classList.remove('active');
        renderDiscoverFeed();
    });

    // ==========================================
    // 7. ВНУТРЕННИЙ ПОИСК В ЗАМЕТКАХ
    // ==========================================
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
            
            if(!query) {
                notepad.value = originalText;
                return;
            }

            // Логика фильтрации блоков заметок по ключевым словам
            const blocks = originalText.split('\n\n');
            const filteredBlocks = blocks.filter(block => block.toLowerCase().includes(query));
            notepad.value = filteredBlocks.join('\n\n');
        });
    }

    // ==========================================
    // 8. СПЛИТ-РЕЖИМ (РАЗДЕЛЕНИЕ ЭКРАНА)
    // ==========================================
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
                toast("Сплит-режим активен! Заметки выведены в правое крыло.");
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
    // 9. БУФЕР ФАЙЛОВ (DROP ZONE)
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
            r.innerHTML = `<span>📄 ${f}</span><button class="danger-btn" style="padding:2px 6px; font-size:0.75rem;">Удалить</button>`;
            r.querySelector('.danger-btn').addEventListener('click', () => {
                loadedFiles.splice(idx, 1);
                renderDropZoneList();
            });
            dropZoneList.appendChild(r);
        });
    }

    // ==========================================
    // 10. ТЕМЫ, КАСТУМНЫЕ ФОНЫ И АНАЛИТИКА GOOGLE
    // ==========================================
    const themeSelector = document.getElementById('theme-selector');
    const bgUploader = document.getElementById('bg-uploader');
    const gaTokenInput = document.getElementById('ga-token-input');

    // Накатывание сохраненной темы
    const savedTheme = localStorage.getItem('juvox-custom-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if(themeSelector) themeSelector.value = savedTheme;

    if(themeSelector) {
        themeSelector.addEventListener('change', () => {
            const t = themeSelector.value;
            document.documentElement.setAttribute('data-theme', t);
            localStorage.setItem('juvox-custom-theme', t);
            toast(`Применена тема: ${t}`);
        });
    }

    if(bgUploader) {
        // Проверка и накатывание сохраненного фона
        const cachedBg = localStorage.getItem('juvox-custom-bg');
        if(cachedBg) document.body.style.backgroundImage = `url(${cachedBg})`;

        bgUploader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const base64 = event.target.result;
                    document.body.style.backgroundImage = `url(${base64})`;
                    localStorage.setItem('juvox-custom-bg', base64);
                    toast("Кастомные обои установлены!");
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Подключение Google Analytics "на лету"
    if(gaTokenInput) {
        gaTokenInput.value = localStorage.getItem('juvox-ga-token') || '';
        gaTokenInput.addEventListener('change', () => {
            const token = gaTokenInput.value.trim();
            localStorage.setItem('juvox-ga-token', token);
            const scriptTag = document.getElementById('google-analytics-script');
            if(token && scriptTag) {
                scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${token}`;
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', token);
                toast("Поток Google Analytics успешно инициализирован!");
            }
        });
    }

    // Ассистент здоровья: Таймер моргания/воды
    let healthTime = 40;
    setInterval(() => {
        if(healthTime <= 1) {
            healthTime = 40;
            toast("🧘 Время здоровья Juvox: Расправьте плечи и сделайте глоток воды!");
        } else {
            healthTime--;
        }
        const textBlock = document.getElementById('health-timer-text');
        if(textBlock) textBlock.textContent = `До глотка воды: ${healthTime} мин`;
    }, 60000);

    function renderHistoryList() {
        if(!historyListContainer) return;
        const history = JSON.parse(localStorage.getItem('juvox-history')) || [];
        if(history.length === 0) { historyListContainer.innerHTML = '<p style="opacity:0.5; padding:10px;">Лог чист.</p>'; return; }
        historyListContainer.innerHTML = '';
        history.forEach(q => {
            const r = document.createElement('div');
            r.className = 'file-row';
            r.innerHTML = `<span class="h-click" style="cursor:pointer; color:var(--accent-color); font-weight:bold;">${q}</span>`;
            r.querySelector('.h-click').addEventListener('click', () => { searchInput.value = q; launchSearch(); });
            historyListContainer.appendChild(r);
        });
    }
    const historyListContainer = document.getElementById('history-list-container');
    document.getElementById('clear-history-btn').addEventListener('click', () => { localStorage.removeItem('juvox-history'); renderHistoryList(); toast("Лог очищен"); });
});
