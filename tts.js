const { ElevenLabsClient, ElevenLabs } = require("elevenlabs");
const fs = require("fs");
const path = require("path");

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID

const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

function generateFileName(phrase, maxLength = 50) {
    const accentMap = {
        'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
        'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
        'ç': 'c', 'ñ': 'n'
    };
    
    const sanitizedPhrase = phrase
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, char => accentMap[char] || '')
        .trim()
        .replace(/\s+/g, '_');

    const randomNumber = Math.floor(Math.random() * 10000);
    const truncatedPhrase = sanitizedPhrase.slice(0, maxLength - randomNumber.toString().length - 1);
    
    return `${truncatedPhrase}_${randomNumber}.mp3`;
}

module.exports = async (text) => {
    try {
        const responseStream = await client.textToSpeech.convert(ELEVENLABS_VOICE_ID, {
            output_format: ElevenLabs.OutputFormat.Mp32205032,
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0,
                use_speaker_boost: true
            }
        });

        const chunks = [];
        for await (const chunk of responseStream) {
            chunks.push(chunk);
        }
        
        const audioBuffer = Buffer.concat(chunks);

        const fileName = generateFileName(text, 40);
        const audioURL = 'audios/outputs/' + fileName;
        const outputPath = path.join(__dirname, 'public', audioURL);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, audioBuffer);

        return audioURL;
    } catch (error) {
        console.error('Erro ao chamar a API do ElevenLabs:', error);
        return null;
    }
}