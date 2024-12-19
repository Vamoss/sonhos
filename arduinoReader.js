const WebSocket = require('ws');
const path = require('path');
const ArduinoConnection = require('./arduino.js');
const words = require('./public/palavras.json');
const { appendLog, startConnectionCheck } = require('./log-local.js');

startConnectionCheck();

require('dotenv').config();

const WEBSOCKET_URL = 'wss://sonhos-ptplw.ondigitalocean.app';
const SERIAL_PORT = process.env.SERIAL_PORT || 'COM12';
const BAUD_RATE = process.env.SERIAL_PORT || 9600;

// Conexão com o WebSocket online
let ws;

// Função para inicializar o WebSocket
function connectWebSocket() {
    ws = new WebSocket(WEBSOCKET_URL);

    ws.on('open', () => {
        console.log('Conectado ao WebSocket online.');
        appendLog('websocket', 'connected');
    });

    ws.on('error', (error) => {
        console.error('Erro na conexão WebSocket:', error);
        appendLog('websocket', 'error', error.message);
    });

    ws.on('close', () => {
        console.log('Conexão WebSocket encerrada. Tentando reconectar...');
        appendLog('websocket', 'disconnected');
        setTimeout(connectWebSocket, 500);
    });
}

// Inicializa o WebSocket
connectWebSocket();

// Configuração do Arduino
const arduino = new ArduinoConnection(SERIAL_PORT, BAUD_RATE);
arduino.on('data', (data) => {
  console.log('Dados recebidos do Arduino:', data);
  //vai sempre mandar ,,
  //sendo uuid1,uuid2,uuid3
  //deve retornar no mesmo formato, so que com palavras
  let result = data.split(',').map((uuid) => {
    let obj = words.find(obj => obj.codigo1 === uuid || obj.codigo2 === uuid);
    if(obj)
      return obj.palavra;
    else
      return "";
  });
  const message = JSON.stringify({type: 'wordUpdate', words: result});
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message);
    console.log('Dados enviados para o WebSocket:', message);
  } else {
    console.error('WebSocket não está conectado.');
  }
});
arduino.on('open', (data) => {
  appendLog('arduino', 'connected');
});
arduino.on('close', (data) => {
  appendLog('arduino', 'disconnected');
});
arduino.on('error', (data) => {
  //appendLog('arduino', 'error', data);
});
arduino.connect();