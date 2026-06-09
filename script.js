document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const engineSelect = document.getElementById('engine-select');
    const suggestionsBox = document.getElementById('suggestions');

    // Функция выполнения поиска
    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            const engineUrl = engineSelect.value;
            // Переходим по сформированной ссылке (Движок + Запрос)
            window.location.href = engineUrl + encodeURIComponent(query);
        }
    }

    // Поиск по клику на кнопку
    searchBtn.addEventListener('click', performSearch);

    // Поиск по нажатию клавиши Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // --- ЛОГИКА ПОДСКАЗОК (Автокомплит) ---

    // Имитация базы данных частых запросов (позже заменишь на реальный API)
    const mockDatabase = [
        "как создать сайт",
        "как создать браузер",
        "купить телефон",
        "погода на сегодня",
        "ютуб смотреть",
        "переводчик онлайн",
        "новости сегодня",
        "как выучить javascript",
        "juvox скачать",
        "дизайн сайтов тренды"
    ];

    searchInput.addEventListener('input', () => {
        const val = searchInput.value.toLowerCase().trim();
        suggestionsBox.innerHTML = ''; // Очищаем старые подсказки

        if (val.length === 0) {
            suggestionsBox.classList.add('hidden');
            return;
        }

        // Ищем совпадения в нашей "базе"
        const filteredSuggestions = mockDatabase.filter(item => item.includes(val));

        if (filteredSuggestions.length > 0) {
            filteredSuggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion;
                
                // При клике на подсказку - вставляем текст и сразу ищем
                li.addEventListener('click', () => {
                    searchInput.value = suggestion;
                    suggestionsBox.classList.add('hidden');
                    performSearch();
                });

                suggestionsBox.appendChild(li);
            });
            suggestionsBox.classList.remove('hidden');
        } else {
            suggestionsBox.classList.add('hidden');
        }
    });

    // Скрывать подсказки при клике вне зоны поиска
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            suggestionsBox.classList.add('hidden');
        }
    });
});
