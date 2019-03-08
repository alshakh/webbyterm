var express = require('express')
var expressws = require('express-ws')
var pty = require('node-pty')

var app = express()

var ews = expressws(app);

app.use(express.static(__dirname + "/static"));

ews.app.ws('/shell', function (ws, req) {
    // var shell = pty.spawn('/bin/bash', [], {
    //     name: 'xterm-color',
    //     cwd: process.env.PWD,
    //     env: process.env
    // });
    // shell.on('data', function (data) {
    //     ws.send(data);
    // });
    // ws.on('message', function (msg) {
    //     shell.write(msg);
    // });
});

app.listen(3000,"localhost");
console.log("listening to localhost:3000")
