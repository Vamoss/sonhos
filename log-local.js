const fs = require('fs');
const path = require('path');
const ping = require('ping');
const https = require('https');
const querystring = require('querystring');

const LOG_FILE = path.join(__dirname, 'connection.log');

async function sendLogToServer() {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      throw new Error('Log file does not exist.');
    }

    const logData = fs.readFileSync(LOG_FILE, 'utf8');
    const data = querystring.stringify({ log: logData });

    const options = {
      hostname: 'vamoss.com.br', // Substitua pelo hostname do seu servidor
      port: 443,
      path: '/publico/sonhos/save-log.php', // Atualize para o caminho correto do script PHP
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const responseJson = JSON.parse(responseData);
            if (responseJson.status === true) {
              console.log('Log enviado com sucesso ao servidor!');
              fs.unlinkSync(LOG_FILE); // Apaga o log local após envio se o status for true
              resolve(responseData);
            } else {
              console.error('Erro ao inserir log no banco:', responseJson.message);
              appendLog('server', 'error', responseJson.message); // Registra a mensagem de erro no log local
              reject(new Error(responseJson.message));
            }
          } catch (error) {
            console.log(error);
            console.log(responseData);
            reject(new Error('Erro ao processar a resposta do servidor: ' + error.message));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });

    return response;
  } catch (error) {
    console.error('Erro no envio do log:', error.message);
    appendLog('server', 'error', error.message);
  }
}

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
          await sendLogToServer();
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
