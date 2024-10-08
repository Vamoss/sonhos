const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const EventEmitter = require('events');
// const { simulateArduino } = require('./simulator');

class ArduinoConnection extends EventEmitter {
  constructor(portName, baudRate = 9600) {
    super();
    this.portName = portName;
    this.baudRate = baudRate;
    this.arduinoConnected = false;
    this.port = null;
  }

  connect() {
    try {
      this.port = new SerialPort(this.portName, { baudRate: this.baudRate });
      const parser = this.port.pipe(new Readline({ delimiter: '\r\n' }));

      this.port.on('open', () => {
        this.arduinoConnected = true;
        console.log('Conectado ao Arduino');
      });

      parser.on('data', (data) => {
        console.log(`Dados recebidos do Arduino: ${data}`);
        this.emit('data', data);
      });

      this.port.on('close', () => {
        console.log('Conexão com Arduino perdida. Tentando reconectar...');
        this.arduinoConnected = false;
        this.attemptReconnection();
      });

      this.port.on('error', (err) => {
        console.error('Erro de conexão com o Arduino:', err.message);
        this.arduinoConnected = false;
        this.attemptReconnection();
      });

    } catch (error) {
      //console.error('Erro ao conectar ao Arduino:', error.message);
      this.arduinoConnected = false;
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