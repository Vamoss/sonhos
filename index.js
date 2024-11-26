const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const words = require('./public/palavras.json');

require('dotenv').config();

const AI = require("./ai.js");
const TTS = require("./tts.js");

const app = express();
const PORT = process.env.PORT || 3000;
const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3';
const BAUD_RATE = process.env.SERIAL_PORT || 9600;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from Node.js server!' });
});

const server = app.listen(PORT, () => {
  console.log(`Servidor HTTP rodando em http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
  console.log('WebSocket conectado');
  ws.on('message', (message) => {
    console.log(`Mensagem recebida do cliente: ${message}`);
    const data = JSON.parse(message);
    if (data.type === 'wordUpdate') {
      broadcast(message);
    } else if(data.type === 'wordsConfirmed') {
      AI(data.words.join(", ")).then((response) => {
          TTS(response).then((audioURL) => {
              console.log(`Pergunta gerada pela AI: ${response}`);
              const result = {
                  type: 'aiResponse',
                  text: response,
                  audioURL: audioURL
              };
              broadcast(JSON.stringify(result));
          });
      });
    } else {
      console.log('Mensagem inválida, sem data.type');
    }
  });
});

function broadcast(message) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}