const fs = require('fs');
const path = require('path');
const ping = require('ping');

const LOG_FILE = path.join(__dirname, 'connection.log');

async function startConnectionCheck() {
  async function checkInternetConnection() {
    try {
      ping.sys.probe('8.8.8.8', async (isAlive) => {
        if (!isAlive) {
          console.log('Internet desconectada');
          appendLog('internet', 'disconnected');
        } else {
          console.log('Internet conectada');
          appendLog('internet', 'connected');
        }
      });
    } catch (error) {
      console.error('Erro ao verificar conexão com a internet:', error.message);
      appendLog('internet', 'error', error.message);
    }
  }

  setInterval(checkInternetConnection, 60000);
}

function appendLog(component, event, message = '') {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = { component, event, timestamp, message };
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n', 'utf8');
  } catch (error) {
    console.error('Erro ao gravar no log:', error.message);
  }
}

module.exports = { appendLog, startConnectionCheck };