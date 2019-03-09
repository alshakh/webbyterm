const Terminal = require("xterm").Terminal
const Terminal_Fit = require("xterm/dist/addons/fit/fit")
const Terminal_Attach = require("xterm/dist/addons/attach/attach")

Terminal.applyAddon(Terminal_Fit);
Terminal.applyAddon(Terminal_Attach);



const DEFAULTS = {
    fontSize : 14
}


let terminalRefs = {}


let fitTerminal = (terminalRef) => {
    let myTerm = terminalRef.terminal
    myTerm.fit()

    fetch(`/terminal/${terminalRef.id}/resize`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cols: myTerm.cols,
            rows: myTerm.rows,
        })
    })
}

/*
 * specs = {
 *      id : <unique terminal id>,
 *      cwd : <terminal working directory>,
 *      referesh : true | false <keep terminal across refreshes of the browser (default : false)>
 *  }
 *
 */
let connectTerminal = (spec) => {
    //
    const term = new Terminal({
        fontSize: DEFAULTS['fontSize']
    });
    // start terminal backend and connect to pty
    fetch(`/terminal/${spec.id}/start`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refresh: spec.refresh,
                cwd: spec.cwd
            })
        })
        .then(() => {
            const socketUrl = `${(location.protocol === 'https:') ? 'wss://' : 'ws://'}${location.hostname}${location.port ? `:${location.port}` : ''}/terminal/${spec.id}`;
            const socket = new WebSocket(socketUrl);

            socket.onopen = () => {
                term.attach(socket, true, true);
            };
        })
    //
    return term
}



let getTerminalElementId  = (el) => {
    if (!el.dataset.id) {
        el.dataset.id = Math.random().toString(36).substr(2)
    }
    return el.dataset.id
}

let changeTerminalFontSize = (terminalRef, delta) => {
    console.log(delta)
    let term = terminalRef.terminal
    term.setOption('fontSize', term.getOption('fontSize') + delta)
    fitTerminal(terminalRef)
}



let initAllTerminals = () => {
    document.querySelectorAll('[data-terminal]').forEach((el) => {

        let id = getTerminalElementId(el)

        // connect a terminal
        let terminal = connectTerminal({
            id : id,
            refresh : ((typeof el.dataset['refresh']) !== 'undefined' ? true : false), // if not defined => false
            cwd : el.dataset['cwd'] || '/tmp/',
        })

        // attach terminal to element
        terminal.open(el)

        // prepare terminalRef
        let terminalRef = {
            id : id,
            terminal : terminal,
            element : el
        }

        // register the new terminal object
        terminalRefs[terminalRef.id] = terminalRef
        //

        // fit the terminal size
        fitTerminal(terminalRef)

        // make sure to refit terimanl when window resizes
        window.addEventListener('resize', () => fitTerminal(terminalRef))

        // attach listener for resizing the font size with ctrl+mousewheel
        el.addEventListener("wheel", (event) => {
            if (event.ctrlKey) {
                changeTerminalFontSize(terminalRef,  -1 * event.deltaY)
            }
        })

    });
}

initAllTerminals()
