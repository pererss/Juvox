document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const homeScreen = document.getElementById('home-screen');
    const webViewContainer = document.getElementById('web-view-container');
    const topSearchArea = document.getElementById('top-search-area');
    const searchBox = document.querySelector('.search-box');
    const tabsContainer = document.getElementById('tabs-container');

    // 1. ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ (С ЗАПОМИНАНИЕМ В БРАУЗЕРЕ)
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

    // 2. ЛОГИКА ГЛОБАЛЬНОГО БЕСПЛАТНОГО ПОИСКА
    function launchSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        // Анимация интерфейса Juvox (скрываем центр, открываем зону выдачи)
        homeScreen.classList.add('hidden');
        webViewContainer.classList.remove('hidden');
        searchBox.classList.add('minimized');
        topSearchArea.appendChild(searchBox);

        // Красиво добавляем вкладку в левый сайдбар
        const newTab = document.createElement('li');
        newTab.className = 'tab-item active';
        newTab.textContent = `🔍 ${query.substring(0, 10)}...`;
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        tabsContainer.insertBefore(newTab, document.getElementById('add-tab'));

        // Пишем статус загрузки
        webViewContainer.innerHTML = '<div class="loading-status">Ищем по миллионам сайтов в глобальной сети...</div>';

        // Подключаем движок SearXNG через CORS-декодер
        const searxInstance = "https://searx.be/search"; 
        const targetUrl = `${searxInstance}?q=${encodeURIComponent(query)}&format=json`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        fetch(proxyUrl)
            .then(response => response.json())
            .then(data => {
                webViewContainer.innerHTML = ''; // Очищаем текст загрузки
                
                const results = data.results;
                if (!results || results.length === 0) {
                    webViewContainer.innerHTML = '<div class="loading-status">Ничего не найдено. Хм, попробуйте другой запрос.</div>';
                    return;
                }

                // Создаем контейнер для наших карточек
                const resultsWrapper = document.createElement('div');
                resultsWrapper.className = 'search-results-page';

                // Выводим первые 10 самых релевантных сайтов из сети
                results.slice(0, 10).forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'result-card';
                    card.innerHTML = `
                        <div class="result-url">${item.pretty_url || item.url}</div>
                        <a href="${item.url}" target="_blank" class="result-title">${item.title}</a>
                        <p class="result-snippet">${item.content || 'Описание сайта отсутствует.'}</p>
                    `;
                    resultsWrapper.appendChild(card);
                });

                webViewContainer.appendChild(resultsWrapper);
            })
            .catch(error => {
                console.error("Ошибка поиска:", error);
                webViewContainer.innerHTML = '<div class="loading-status">Упс! Проблема со связью. Попробуйте еще раз.</div>';
            });
    }

    // Слушатели на кнопку и Enter
    searchBtn.addEventListener('click', launchSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') launchSearch(); });

    // 3. ВОЗВРАТ НА ГЛАВНУЮ ПРИ КЛИКЕ НА ЛОГОТИП JUVOX
    document.querySelector('.logo').addEventListener('click', () => {
        homeScreen.classList.remove('hidden');
        webViewContainer.classList.add('hidden');
        searchBox.classList.remove('minimized');
        document.querySelector('.search-wrapper').prepend(searchBox);
        webViewContainer.innerHTML = "";
        searchInput.value = "";
    });
});
