// ========== НАСТРОЙКИ ==========
let currentTheme = localStorage.getItem('juvox_theme') || 'default';
let currentEngine = localStorage.getItem('juvox_engine') || 'google';
let tabs = [];
let activeTabId = null;
let tabCounter = 1;

const engines = {
    google: { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'https://www.google.com/favicon.ico' },
    yandex: { name: 'Яндекс', url: 'https://yandex.ru/search/?text=', icon: 'https://yandex.ru/favicon.ico' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: 'https://duckduckgo.com/favicon.ico' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' }
};

// Популярные запросы для подсказок
const popularQueries = [
    'youtube.com', 'github.com', 'chat.openai.com', 'google.com', 
    'яндекс', 'погода', 'новости', 'переводчик', 'telegram web',
    'gmail', 'вконтакте', 'ozon', 'wildberries', '2gis'
];

// Применение темы
function applyTheme() {
    document.body.className = '';
    document.body.classList.add(`theme-${currentTheme}`);
    localStorage.setItem('juvox_theme', currentTheme);
}

function toggleTheme() {
    const themes = ['default', 'ocean', 'sunset', 'forest', 'night'];
    let currentIndex = themes.indexOf(currentTheme);
    let nextIndex = (currentIndex + 1) % themes.length;
    currentTheme = themes[nextIndex];
    applyTheme();
}

// Обновление UI поисковой системы
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
    
    // Скрыть подсказки
    document.getElementById('suggestions').classList.remove('show');
}

// Открыть URL в активной вкладке
function openUrl(url, tabId = null) {
    let targetTabId = tabId || activeTabId;
    let tab = tabs.find(t => t.id === targetTabId);
    if (tab) {
        tab.url = url;
        const iframe = document.getElementById(`iframe-${tab.id}`);
        if (iframe) {
            iframe.src = url;
        }
        renderTabs();
        saveTabs();
    }
}

// Показать подсказки
function showSuggestions(query) {
    const suggestionsDiv = document.getElementById('suggestions');
    if (!query.trim()) {
        suggestionsDiv.classList.remove('show');
        return;
    }
    
    const filtered = popularQueries.filter(q => 
        q.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
    
    if (filtered.length === 0) {
        suggestionsDiv.classList.remove('show');
        return;
    }
    
    suggestionsDiv.innerHTML = filtered.map(q => `
        <div class="suggestion-item" data-value="${q}">
            <i class="fas fa-search"></i>
            <div class="suggestion-text">${q}</div>
            <div class="suggestion-url">${q.includes('.') ? 'https://' + q : 'поиск'}</div>
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
    const tabsContainer = document.getElementById('tabs');
    const contentContainer = document.getElementById('content');
    
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';
    
    tabs.forEach(tab => {
        // Рендер вкладки в панели
        const tabEl = document.createElement('div');
        tabEl.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
        tabEl.innerHTML = `
            <span>${tab.title || 'Новая вкладка'}</span>
            <button class="close-btn" data-id="${tab.id}">✕</button>
        `;
        tabEl.onclick = (e) => {
            if (!e.target.classList.contains('close-btn')) {
                switchTab(tab.id);
            }
        };
        tabsContainer.appendChild(tabEl);
        
        // Рендер контента
        const iframe = document.createElement('iframe');
        iframe.id = `iframe-${tab.id}`;
        iframe.src = tab.url || 'about:blank';
        iframe.onload = () => {
            try {
                tab.title = iframe.contentWindow.document.title || 'Страница';
                renderTabs();
                saveTabs();
            } catch(e) {}
        };
        contentContainer.appendChild(iframe);
    });
    
    // Обработчики закрытия
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            closeTab(parseInt(btn.getAttribute('data-id')));
        };
    });
}

// Переключение вкладки
function switchTab(id) {
    activeTabId = id;
    
    // Скрыть/показать iframe
    document.querySelectorAll('#content iframe').forEach((iframe, idx) => {
        iframe.style.display = idx === tabs.findIndex(t => t.id === id) ? 'block' : 'none';
    });
    
    renderTabs();
    saveTabs();
}

// Новая вкладка
function addTab() {
    const newId = Date.now();
    tabs.push({ 
        id: newId, 
        url: '', 
        title: 'Новая вкладка'
    });
    activeTabId = newId;
    renderTabs();
    saveTabs();
}

// Закрыть вкладку
function closeTab(id) {
    const index = tabs.findIndex(t => t.id === id);
    if (index !== -1) tabs.splice(index, 1);
    
    if (tabs.length === 0) {
        addTab();
    }
    
    if (activeTabId === id) {
        activeTabId = tabs[0]?.id;
    }
    
    renderTabs();
    saveTabs();
}

// Сохранение вкладок
function saveTabs() {
    const tabsToSave = tabs.map(t => ({ id: t.id, url: t.url, title: t.title }));
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
            } else if (tabs.length > 0) {
                activeTabId = tabs[0].id;
            } else {
                addTab();
            }
        } catch(e) {
            addTab();
        }
    } else {
        addTab();
    }
    renderTabs();
}

// Инициализация
function init() {
    applyTheme();
    updateEngineUI();
    loadTabs();
    
    // Обработчики
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('newTabBtn').addEventListener('click', addTab);
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
    
    // Закрытие дропдауна при клике вне
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-engine')) {
            document.getElementById('engineDropdown').classList.remove('show');
        }
        if (!e.target.closest('.search-wrapper')) {
            document.getElementById('suggestions').classList.remove('show');
        }
    });
}

init();
