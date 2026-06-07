// ========== НАСТРОЙКИ ==========
let currentTheme = localStorage.getItem('juvox_theme') || 'dark';
let currentEngine = localStorage.getItem('juvox_engine') || 'google';
let tabs = [{ id: 1, url: '' }];
let activeTabId = 1;

// Поисковые движки
const engines = {
    google: { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'https://www.google.com/favicon.ico' },
    yandex: { name: 'Яндекс', url: 'https://yandex.ru/search/?text=', icon: 'https://yandex.ru/favicon.ico' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: 'https://duckduckgo.com/favicon.ico' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' }
};

// Подсказки (популярные сайты)
const suggestionsList = [
    'youtube.com', 'github.com', 'chat.openai.com', 'google.com', 'yandex.ru',
    'web.telegram.org', 'x.com', 'reddit.com', 'twitch.tv', 'netflix.com'
];

// Применение темы
function applyTheme() {
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(currentTheme);
    localStorage.setItem('juvox_theme', currentTheme);
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Переключение темы
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme();
}

// Обновление иконки поисковой системы
function updateEngineUI() {
    const engine = engines[currentEngine];
    document.getElementById('engineIcon').src = engine.icon;
    document.getElementById('engineName').innerText = engine.name;
    localStorage.setItem('juvox_engine', currentEngine);
}

// Поиск или навигация
function searchOrNavigate(query) {
    if (!query.trim()) return;
    
    // Проверка на URL
    if (query.includes('.') && !query.includes(' ') && !query.startsWith('http')) {
        query = 'https://' + query;
    }
    
    if (query.startsWith('http://') || query.startsWith('https://')) {
        openUrl(query);
    } else {
        const engine = engines[currentEngine];
        openUrl(engine.url + encodeURIComponent(query));
    }
}

// Открыть URL
function openUrl(url) {
    const iframe = document.getElementById('webpage');
    const startPage = document.getElementById('startPage');
    const webpage = document.getElementById('webpage');
    
    startPage.style.display = 'none';
    webpage.style.display = 'block';
    iframe.src = url;
    
    // Добавляем вкладку, если нужно
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
        activeTab.url = url;
    }
    renderTabs();
    saveTabs();
}

// Показать подсказки
function showSuggestions(query) {
    const suggestionsDiv = document.getElementById('suggestions');
    if (!query.trim()) {
        suggestionsDiv.classList.remove('show');
        return;
    }
    
    const filtered = suggestionsList.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
    if (filtered.length === 0) {
        suggestionsDiv.classList.remove('show');
        return;
    }
    
    suggestionsDiv.innerHTML = filtered.map(s => `
        <div class="suggestion-item" data-value="${s}">
            <i class="fas fa-search"></i>
            <span>${s}</span>
        </div>
    `).join('');
    
    suggestionsDiv.classList.add('show');
    
    document.querySelectorAll('.suggestion-item').forEach(el => {
        el.addEventListener('click', () => {
            const val = el.getAttribute('data-value');
            document.getElementById('searchInput').value = val;
            suggestionsDiv.classList.remove('show');
            searchOrNavigate(val);
        });
    });
}

// Рендер вкладок
function renderTabs() {
    const tabBar = document.getElementById('tabBar');
    tabBar.innerHTML = '';
    tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
        tabEl.innerHTML = `
            <span>${tab.url ? new URL(tab.url).hostname || 'Сайт' : 'Новая вкладка'}</span>
            <button class="close-tab" data-id="${tab.id}">✕</button>
        `;
        tabEl.onclick = (e) => {
            if (!e.target.classList.contains('close-tab')) switchTab(tab.id);
        };
        tabBar.appendChild(tabEl);
    });
    
    // Кнопка новой вкладки
    const newTabBtn = document.createElement('div');
    newTabBtn.className = 'tab';
    newTabBtn.innerHTML = '<span>+ Новая вкладка</span>';
    newTabBtn.onclick = addTab;
    tabBar.appendChild(newTabBtn);
}

// Переключение вкладки
function switchTab(id) {
    activeTabId = id;
    const tab = tabs.find(t => t.id === id);
    if (tab && tab.url) {
        document.getElementById('webpage').src = tab.url;
        document.getElementById('startPage').style.display = 'none';
        document.getElementById('webpage').style.display = 'block';
    } else {
        document.getElementById('startPage').style.display = 'flex';
        document.getElementById('webpage').style.display = 'none';
    }
    renderTabs();
    saveTabs();
}

// Новая вкладка
function addTab() {
    const newId = Date.now();
    tabs.push({ id: newId, url: '' });
    activeTabId = newId;
    document.getElementById('startPage').style.display = 'flex';
    document.getElementById('webpage').style.display = 'none';
    renderTabs();
    saveTabs();
}

// Закрыть вкладку
function closeTab(id) {
    const index = tabs.findIndex(t => t.id === id);
    if (index !== -1) tabs.splice(index, 1);
    if (tabs.length === 0) {
        tabs.push({ id: Date.now(), url: '' });
    }
    if (activeTabId === id) {
        activeTabId = tabs[0].id;
        const tab = tabs[0];
        if (tab && tab.url) {
            document.getElementById('webpage').src = tab.url;
            document.getElementById('startPage').style.display = 'none';
            document.getElementById('webpage').style.display = 'block';
        } else {
            document.getElementById('startPage').style.display = 'flex';
            document.getElementById('webpage').style.display = 'none';
        }
    }
    renderTabs();
    saveTabs();
}

// Сохранение вкладок
function saveTabs() {
    const tabsToSave = tabs.map(t => ({ id: t.id, url: t.url }));
    localStorage.setItem('juvox_tabs', JSON.stringify(tabsToSave));
    localStorage.setItem('juvox_activeTab', activeTabId);
}

// Загрузка вкладок
function loadTabs() {
    const saved = localStorage.getItem('juvox_tabs');
    if (saved) {
        try {
            tabs = JSON.parse(saved);
            const savedActive = localStorage.getItem('juvox_activeTab');
            if (savedActive && tabs.find(t => t.id == savedActive)) {
                activeTabId = parseInt(savedActive);
            } else {
                activeTabId = tabs[0].id;
            }
            const activeTab = tabs.find(t => t.id === activeTabId);
            if (activeTab && activeTab.url) {
                document.getElementById('webpage').src = activeTab.url;
                document.getElementById('startPage').style.display = 'none';
                document.getElementById('webpage').style.display = 'block';
            } else {
                document.getElementById('startPage').style.display = 'flex';
                document.getElementById('webpage').style.display = 'none';
            }
            renderTabs();
        } catch(e) {}
    }
}

// Инициализация
function init() {
    applyTheme();
    updateEngineUI();
    loadTabs();
    
    // Обработчики событий
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('engineBtn').addEventListener('click', () => {
        document.getElementById('engineDropdown').classList.toggle('show');
    });
    document.querySelectorAll('.engine-option').forEach(opt => {
        opt.addEventListener('click', () => {
            currentEngine = opt.getAttribute('data-engine');
            updateEngineUI();
            document.getElementById('engineDropdown').classList.remove('show');
        });
    });
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchOrNavigate(e.target.value);
        }
    });
    document.getElementById('searchInput').addEventListener('input', (e) => {
        showSuggestions(e.target.value);
    });
    document.getElementById('startSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchOrNavigate(e.target.value);
        }
    });
    document.getElementById('startSearchBtn').addEventListener('click', () => {
        const val = document.getElementById('startSearch').value;
        if (val) searchOrNavigate(val);
    });
    document.querySelectorAll('.quick-link').forEach(link => {
        link.addEventListener('click', () => {
            const url = link.getAttribute('data-url');
            if (url) openUrl(url);
        });
    });
    document.getElementById('voiceBtn').addEventListener('click', () => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'ru-RU';
            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                document.getElementById('searchInput').value = text;
                searchOrNavigate(text);
            };
            recognition.start();
        } else {
            alert('Голосовой ввод не поддерживается');
        }
    });
    
    // Закрытие дропдауна при клике вне
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.engine-select')) {
            document.getElementById('engineDropdown').classList.remove('show');
        }
        if (!e.target.closest('.search-wrapper')) {
            document.getElementById('suggestions').classList.remove('show');
        }
    });
}

init();