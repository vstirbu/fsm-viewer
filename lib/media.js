const fsm = require('fsm-as-promised');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const getPort = require('get-port');
const uuid =  require('uuid');

module.exports = (options) => fsm({
  initial: 'New',
  final: ['Done', 'Failed'],
  events: [
    { name: 'StartServer', from: 'New', to: 'ServerStarted' },
    { name: 'Received', from: 'ServerStarted', to: 'Done' },
    { name: 'Timeout', from: 'ServerStarted', to: 'Failed' },
  ],
  callbacks: {
    onReceived: function(options) {
      clearTimeout(this.timeout);

      this.server.close(() => {
        console.log('media received');
        this.mediaCallback(null, options.args[0]);
      });
    },
    onStartServer: function (options) {
      const path = uuid.v4();

      this.app = express();
      this.app.use(bodyParser.text());

      this.server = http.createServer(this.app);

      this.app.post(`/${path}`, (req, res) => {
        res.set('Connection', 'close');
        res.send(200);

        if (req.body) {
          this.Received(req.body);
        }
      });

      this.timeout = setTimeout(() => {
        this.server.close(() => this.Timeout());
      }, 5000);

      return getPort({
        host: 'localhost'
      }).then(port => new Promise((resolve) => {
        this.server.listen(port, err => {
          const url = `http://localhost:${port}/${path}`;
          if (err) throw err;

          options.res = url;
          resolve(options);
        });
      }));
    },
    onTimeout: function() {
      this.mediaCallback(new Error('Receive timeout'));
    }
  }
}, options).StartServer();
