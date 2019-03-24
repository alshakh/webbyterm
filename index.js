var express = require('express')
var expressws = require('express-ws')
var bodyparser = require('body-parser')
var pty = require('node-pty')

var app = express()
var ews = expressws(app); app.use(bodyparser.json())

app.use(express.static(__dirname + "/static"));

// ----------------------------------------------

let terminals = {}

app.post('/terminal/:id/start', (req, res) => {
    console.log('new terminal start', {
        id: req.params.id,
        body: req.body
    });

    let id = req.params.id
    let refresh = req.body.refresh
    let cwd = req.body.cwd
    let unrestricted = req.body.unrestricted
    let env = req.body.env

    // refresh old terminals unless (refresh=false)
    if (terminals[id] && refresh ) {
        terminals[id].destroy()
        terminals[id] = undefined
    }

    // if the shell is not defined already, create a new one

    if (!terminals[id]) {
        let shellopts = []
        shellopts.push('--noprofile')
        shellopts.push('--norc')
        if ( ! unrestricted) {
            shellopts.push('-r')
        }

        console.log("running shell with the shell optoins ",shellopts)
        terminals[id] = pty.spawn('/bin/bash', shellopts, {
            name: `xterm-color`,
            cwd: cwd,
            env: env
        })
    }


    res.end("OK")
})


app.post('/terminal/:id/resize', (req, res) => {
    console.log('resizing terminal ', {
        id: req.params.id,
        cols: req.body.cols,
        rows : req.body.rows,
    });

    let id = req.params.id

    terminals[id].resize(req.body.cols, req.body.rows)
    res.end("OK")
})

ews.app.ws('/terminal/:id', function(ws, req) {

    let id = req.params.id

    if (!terminals[id]) {
        console.error(`Connection refused on id ${req.params.id}`)
        ws.close()
    }

    let myTerm = terminals[id]

    // accomidate reconnections
    myTerm.removeAllListeners('data'); // remove old event handles
    if (myTerm.webby_saveddata) {
        ws.send(myTerm.webby_saveddata) // resend old data to continue the xterm data
    } else {
        myTerm.webby_saveddata = '' // initiate first time connections
    }

    //
    myTerm.on('data', function(data) {
        myTerm.webby_saveddata += data
        try {
        ws.send(data);
        } catch (err) { 
            console.error(err)
            console.log('ignoring')
        }
    });

    ws.on('message', function(msg) {
        myTerm.write(msg);
    });
});

app.listen(3000, "localhost");
console.log("listening to localhost:3000")
