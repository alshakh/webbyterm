const Terminal = require("xterm").Terminal
const Terminal_Fit = require("xterm/dist/addons/fit/fit")
const Terminal_Attach = require("xterm/dist/addons/attach/attach")


Terminal.applyAddon(Terminal_Fit);
Terminal.applyAddon(Terminal_Attach);




let attachTerminal = (el) => {
    if (!el.dataset.id) {
        el.dataset.id = Math.random().toString(36).substr(2)
    }
    //
    let id = el.dataset['id']
    let refresh = (typeof el.dataset['refresh']) !== 'undefined' ? true : false // default is false
    let cwd = el.dataset['cwd'] || '/tmp/'
    //
    fetch(`/terminal/${id}/start`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refresh : refresh,
                cwd: cwd
            })
        })
        .then(() => {
            const term = new Terminal();
            term.open(el);

            const protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
            const port = location.port ? `:${location.port}` : '';
            const socketUrl = `${protocol}${location.hostname}${port}/terminal/${id}`;
            const socket = new WebSocket(socketUrl);
            socket.onopen = (ev) => {
                term.attach(socket);
            };
        })
}



document.querySelectorAll('[data-terminal]').forEach((el) => {
    attachTerminal(el)
})
