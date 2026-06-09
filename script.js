document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const engineSelect = document.getElementById('engine-select');
    const dropdownBox = document.getElementById('dropdown-box');
    const suggestionsList = document.getElementById('suggestions');
    const historyList = document.getElementById('history-list');
    const webFrame = document.getElementById('web-frame');

    // 1. ИСТОРИЯ: Загрузка из локальной памяти браузера
    let searchHistory = JSON.parse(localStorage.getItem('juvox_history')) || [];

    function saveToHistory(query) {
        if (!query) return;
        // Удаляем дубликат, если он был, и пушим в начало
        searchHistory = searchHistory.filter(item => item !== query);
        searchHistory.unshift(query);
        if (searchHistory.length > 5) searchHistory.pop(); // Храним топ-5
        localStorage.setItem('juvox_history', JSON.stringify(searchHistory));
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (searchHistory.length === 0) {
            historyList.innerHTML = '<li class="history-item">История пока пуста</li>';
            return;
        }
        searchHistory.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.textContent = `⏱ ${item}`;
            li.addEventListener('click', () => {
                searchInput.value = item;
                dropdownBox.classList.add('hidden');
                performSearch();
            });
            historyList.appendChild(li);
        });
    }

    // 2. ПОИСК: Логика отображения на своем сайте
    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            saveToHistory(query);
            renderHistory();
            dropdownBox.classList.add('hidden');

            // Переключаем Juvox в режим отображения "браузера"
            if (appContainer.classList.contains('home-mode')) {
                appContainer.classList.remove('home-mode');
                appContainer.classList.add('browser-mode');
                // Перемещаем логотип внутрь шапки поиска, если это необходимо
                appContainer.prepend(document.querySelector('.logo'));
            }

            const engineUrl = engineSelect.value;
            // Загружаем поисковик во фрейм внутри Juvox
            webFrame.src = engineUrl + encodeURIComponent(query);
        }
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });

    // 3. ТОЧНЫЕ ПОДСКАЗКИ: JSONP запрос к Google API
    // Создаем глобальную функцию, которую вызовет Google, когда вернет данные
    window.juvoxCallback = function(data) {
        const googleSuggestions = data[1]; // Массив с точными подсказками
        renderSuggestions(googleSuggestions);
    };

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        
        if (!query) {
            dropdownBox.classList.add('hidden');
            return;
        }

        // Динамически создаем тег <script> для обхода CORS ограничений (JSONP)
        const oldScript = document.getElementById('jsonp-script');
        if (oldScript) oldScript.remove();

        const script = document.createElement('script');
        script.id = 'jsonp-script';
        // Используем оригинальный и точный движок подсказок Google (работает и для Яндекс запросов)
        script.src = `https://suggestqueries.google.com/complete/search?client=youtube&q=${encodeURIComponent(query)}&callback=juvoxCallback`;
        document.body.appendChild(script);
    });

    function renderSuggestions(suggestions) {
        suggestionsList.innerHTML = '';
        
        if (suggestions.length === 0) {
            suggestionsList.innerHTML = '<li>Нет вариантов</li>';
        } else {
            // Берем первые 5 самых точных подсказок
            suggestions.slice(0, 5).forEach(text => {
                const li = document.createElement('li');
                li.textContent = `🔍 ${text}`;
                li.addEventListener('click', () => {
                    searchInput.value = text;
                    dropdownBox.classList.add('hidden');
                    performSearch();
                });
                suggestionsList.appendChild(li);
            });
        }
        
        renderHistory();
        dropdownBox.classList.remove('hidden');
    }

    // Показываем историю при фокусе на пустую строку
    searchInput.addEventListener('focus', () => {
        renderHistory();
        dropdownBox.classList.remove('hidden');
    });

    // Скрываем меню при клике мимо поиска
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            dropdownBox.classList.add('hidden');
        }
    });
});
