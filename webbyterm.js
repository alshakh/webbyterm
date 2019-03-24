var pty = require('node-pty')

module.exports = class {
    constructor(opts) {
        this.refresh = opts.refresh
        this.cwd = opts.cwd
        this.unrestricted = opts.unrestricted
        this.env = opts.env
        this.term = this._newShell()
        this.savedData = ""
    }
    _newShell() {
        let shellopts = []
        shellopts.push('--noprofile')
        shellopts.push('--norc')
        if (!this.unrestricted) {
            shellopts.push('-r')
        }

        console.log("running shell with the shell optoins ", shellopts)
        return pty.spawn('/bin/bash', shellopts, {
            name: `xterm-color`,
            cwd: this.cwd,
            env: this.env
        })
    }
    restart(opts) {
        // refresh old terminals unless (refresh=false)
        if (this.term && this.refresh) {
            this.term.destroy()
            this.term = this._newShell()
        }
    }

    resize(opts) {
        let cols = opts.cols
        let rows = opts.rows

        console.log('resizing terminal ', {
            cols: cols,
            rows: rows,
        });

        this.term.resize(cols, rows)
    }

    connect(ws) {

        // accomidate reconnections
        this.term.removeAllListeners('data'); // remove old event handles

        if (! this.refresh) {
            ws.send(this.savedData) // resend old data to continue the xterm data
        } 

        //
        this.term.on('data', (data) => {
            this.savedData += data
            try {
                ws.send(data);
            } catch (err) {
                console.error(err)
                console.log('ignoring')
            }
        });

        ws.on('message', (msg) => {
            this.term.write(msg);
        });
    }
}
