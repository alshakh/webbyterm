var express = require('express')
var expressws = require('express-ws')
var bodyparser = require('body-parser')
var app = express()
var ews = expressws(app);
app.use(bodyparser.json())


const WebbyTerm = require("./webbyterm")

app.use(express.static(__dirname + "/static"));

// ----------------------------------------------

let terminals = {}

app.post('/terminal/:id/start', (req, res) => {
    const id = req.params.id
    console.log("start Connections", id, req.body )

    if (terminals[id]) {
        terminals[id].restart(req.body)
    } else {
        terminals[id] = new WebbyTerm(req.body)
    }

    res.end("OK")
})


app.post('/terminal/:id/resize', (req, res) => {
    const id = req.params.id

    if (terminals[id]) {
        terminals[id].resize(req.body)
    }
    res.end("OK")
})

ews.app.ws('/terminal/:id', function(ws, req) {
    let id = req.params.id

    if (!terminals[id]) {
        console.error(`Connection refused on id ${id}`)
        ws.close()
    }

    terminals[id].connect(ws)
});

app.listen(3000, "localhost");
console.log("listening to localhost:3000")
