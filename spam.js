

const stopWords = [
    'funny', 'cool', 'lol', 'kek', 'смешн', 'smile',
    'лайк', 'прикол', 'ах', 'азаз', 'хихи', 'ahah',
    'swag', 'смех', 'memes', 'шутк', 'ржака', 'угар',
    'жиза', 'ржа', 'мем', 'забавн', 'юмор', '#1', '$$$',
    '0%', 'free', 'only $', 'save $', 'viagra', 'vicodin',
    'vip', 'вип', 'cтавки на спорт', 'cамые низкие цены',
    'секрет успеха', 'спам', 'лол', 'кек'
]


exports.spam = (text) => {
    for (let word of stopWords) {
        if (text.includes(word)) {
            return true
        }
    }
    return false
}