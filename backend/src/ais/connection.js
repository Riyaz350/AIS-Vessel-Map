const net = require('net'); 

const EventEmitter = require('events'); 

  

class AisFeedConnection extends EventEmitter { 

  constructor({ host, port, reconnectDelayMs = 1000 }) { 

    super(); 

    this.host = host; 

    this.port = port; 

    this.reconnectDelayMs = reconnectDelayMs; 

    this.buffer = ''; 

    this.socket = null; 

  } 

  

  connect() { 

    this.socket = net.createConnection( 

      { host: this.host, port: this.port }, 

      () => console.log(`[AIS] Connected to ${this.host}:${this.port}`) 

    ); 

  

    this.socket.setEncoding('utf8'); 

  

    this.socket.on('data', (chunk) => { 

      this.buffer += chunk; 

      const lines = this.buffer.split(/\r?\n/); 

      this.buffer = lines.pop(); // keep last, possibly incomplete line 

      for (const line of lines) { 

        const trimmed = line.trim(); 

        if (trimmed) this.emit('sentence', trimmed); 

      } 
      // console.log(lines)

    }); 

  

    this.socket.on('error', (err) => { 

      console.error('[AIS] Socket error:', err.message); 

    }); 

  

    this.socket.on('close', () => { 

      console.warn('[AIS] Connection closed. Reconnecting in ' + 

        this.reconnectDelayMs + 'ms'); 

      setTimeout(() => this.connect(), this.reconnectDelayMs); 

    }); 

  } 

} 

  

module.exports = AisFeedConnection; 