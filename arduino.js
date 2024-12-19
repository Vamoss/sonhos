const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const EventEmitter = require('events');


SerialPort.list()
  .then((ports) => {
    if (ports.length === 0) {
      console.log('Nenhuma porta serial encontrada.');
    } else {
      console.log('Portas disponíveis:');
      ports.forEach((port, index) => {
        console.log(`${index + 1}: ${port.path}`);
        console.log(`  Manufacturer: ${port.manufacturer || 'Desconhecido'}`);
        console.log(`  Serial Number: ${port.serialNumber || 'Desconhecido'}`);
        console.log(`  PnP ID: ${port.pnpId || 'Desconhecido'}`);
        console.log('-----------------------------------');
      });
    }
  })
  .catch((err) => {
    console.error('Erro ao listar portas seriais:', err.message);
  });


class ArduinoConnection extends EventEmitter {
  constructor(portName, baudRate = 9600) {
    super();
    console.log(portName);
    this.portName = portName;
    this.baudRate = baudRate;
    this.arduinoConnected = false;
    this.port = null;
  }

  connect() {
    try {
      this.port = new SerialPort({ path: this.portName, baudRate: this.baudRate });
      const parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      this.port.on('open', () => {
        this.arduinoConnected = true;
        console.log('Conectado ao Arduino');
        this.emit('open');
      });

      parser.on('data', (data) => {
        console.log(`Dados recebidos do Arduino: ${data}`);
        this.emit('data', data);
      });

      this.port.on('close', () => {
        console.log('Conexão com Arduino perdida. Tentando reconectar...');
        this.arduinoConnected = false;
        this.emit('close');
        this.attemptReconnection();
      });

      this.port.on('error', (err) => {
        console.error('Erro de conexão com o Arduino:', err.message);
        this.arduinoConnected = false;
        this.emit('error', err.message);
        this.attemptReconnection();
      });

    } catch (error) {
      console.error('Erro ao conectar ao Arduino:', error.message);
      this.arduinoConnected = false;
      this.emit('error', error.message);
      this.attemptReconnection();
    }
  }

  attemptReconnection() {
    setTimeout(() => {
      if (!this.arduinoConnected) {
        // console.log('Tentando reconectar ao Arduino...');
        this.connect();
      }
    }, 5000);
  }
}

module.exports = ArduinoConnection;