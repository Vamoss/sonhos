const https = require('https');
const querystring = require('querystring');

async function saveData(word1, word2, word3, phrase) {
  return new Promise((resolve, reject) => {
    const data = querystring.stringify({ word1, word2, word3, phrase });

    const options = {
      hostname: 'vamoss.com.br',  // Altere conforme necessário
      port: 443,
      path: '/publico/sonhos/database.php',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        //console.log('Resposta do servidor:', responseData);
        resolve(responseData);
      });
    });

    req.on('error', (error) => {
      //console.error('Erro ao enviar dados:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

module.exports = { saveData };