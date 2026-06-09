document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const engineSelect = document.getElementById('engine-select');
    const homeScreen = document.getElementById('home-screen');
    const webViewContainer = document.getElementById('web-view-container');
    const webFrame = document.getElementById('web-frame');
    const topSearchArea = document.getElementById('top-search-area');
    const searchBox = document.querySelector('.search-box');
    const tabsContainer = document.getElementById('tabs-container');

    // 1. ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ (С ЗАПОМИНАНИЕМ)
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

    // 2. ЛОГИКА ПОИСКА И АНИМАЦИИ ВНУТРИ ОКНА
    function launchSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        // Плавная анимация: Скрываем стартовый экран, показываем фрейм
        homeScreen.classList.add('hidden');
        webViewContainer.classList.remove('hidden');

        // Перемещаем поиск в верхнюю панель, уменьшая его размер
        searchBox.classList.add('minimized');
        topSearchArea.appendChild(searchBox);

        // Создаем новую вкладку слева с текстом запроса
        const newTab = document.createElement('li');
        newTab.className = 'tab-item active';
        newTab.textContent = `🌐 ${query.substring(0, 10)}...`;
        
        // Снимаем "активный" класс с других вкладок
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        tabsContainer.insertBefore(newTab, document.getElementById('add-tab'));

        // Загружаем поисковый запрос (в Tauri это откроет настоящий сайт)
        const engineUrl = engineSelect.value;
        webFrame.src = engineUrl + encodeURIComponent(query);
    }

    searchBtn.addEventListener('click', launchSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') launchSearch(); });

    // Возврат на главную при клике на Лого Juvox
    document.querySelector('.logo').addEventListener('click', () => {
        homeScreen.classList.remove('hidden');
        webViewContainer.classList.add('hidden');
        searchBox.classList.remove('minimized');
        // Возвращаем поиск на место
        document.querySelector('.search-wrapper').prepend(searchBox);
        webFrame.src = "about:blank";
    });
});
