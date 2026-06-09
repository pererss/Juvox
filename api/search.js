export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Запрос пуст' });

    // Имитируем реального пользователя, чтобы поисковик не блокировал запрос
    const targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        if (!response.ok) throw new Error('Ошибка узла');
        const html = await response.text();
        const results = [];

        // Разбираем HTML на карточки сайтов
        const blocks = html.split('class="result__body"');
        blocks.shift(); 

        blocks.slice(0, 10).forEach(block => {
            try {
                let hrefMatch = block.match(/href="([^"]+)"/);
                let titleMatch = block.match(/class="result__link"[^>]*>([^<]+)/) || block.match(/class="result__title"[^>]*>.*?<a[^>]*>([^<]+)/s);
                let snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);

                let url = hrefMatch ? hrefMatch[1] : '#';
                if (url.includes('uddg=')) {
                    url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
                }

                if (url !== '#' && !url.startsWith('/')) {
                    results.push({
                        title: titleMatch ? titleMatch[1].trim() : 'Перейти',
                        url: url,
                        content: snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : 'Описание недоступно.'
                    });
                }
            } catch (e) {}
        });

        return res.status(200).json({ results });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
