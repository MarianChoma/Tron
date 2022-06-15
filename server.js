const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');

const server = https.createServer({
    cert: fs.readFileSync("/home/xchoma/webte.fei.stuba.sk-chain-cert.pem"),
    key: fs.readFileSync("/home/xchoma/webte.fei.stuba.sk.key")
})

server.listen(9000)

const ws = new WebSocket.Server({server});

ws.broadcast = function broadcast(msg, id) {
    ws.clients.forEach(function each(client) {
        if (id === client.id) {
            client.send(msg);
        }
    });
};
let messages = [];
let readyPlayerA = false;
let readyPlayerB = false;
let id = 1;
let canStart = false;
let startNow = true;
ws.on('connection', (socket) => {
    console.log("new Connection");

    readyPlayerA = false;
    readyPlayerB = false;
    canStart = false;
    startNow = true;
    messages.forEach(message => {
        socket.send(JSON.stringify(message))
    })
    socket.id = id++;
    if (socket.id % 2 === 1) {
        console.log(1)
        socket.color = 'black';
        socket.send(JSON.stringify({
            dirX: 0,
            dirY: 1,
            posX: 8,
            posY: 8,
            color: 'black',
            id: 1
        }))
        messages = []
    } else if (socket.id % 2 === 0) {
        socket.color = 'red'
        console.log(readyPlayerA, readyPlayerB, startNow, canStart)
        socket.send(JSON.stringify({
            dirX: 1,
            dirY: 0,
            posX: 2,
            posY: 2,
            color: 'red',
            id: 2
        }))
    }

    socket.on("message", (data) => {
        let newMsg = JSON.parse(data.toString());
        if (ws.clients.size % 2 === 0 && ws.clients.size !== 0) {
            if (newMsg.canPlay === true && newMsg.id === 2) {
                readyPlayerB = true;
            } else if (newMsg.canPlay === true && newMsg.id === 1) {
                readyPlayerA = true;
            }
        }
        if (newMsg.canPlay === true || newMsg.canPlay === false) {

            canStart = readyPlayerA && readyPlayerB;
            if (startNow && canStart) {
                console.log(213)
                ws.broadcast(JSON.stringify({
                    "canPlay": canStart,
                    "x": 2,
                    "y": 2,
                    "color": 'red',
                    "id": 2
                }), 2)
                ws.broadcast(JSON.stringify({
                    "canPlay": canStart,
                    "x": 8,
                    "y": 8,
                    "color": 'black',
                    "id": 1
                }), 1)

                startNow = false;
            } else {
                newMsg = {
                    "canPlay": canStart,
                    "x": newMsg.x,
                    "y": newMsg.y,
                    "color": newMsg.color,
                    "id": newMsg.id
                }
            }
        }
        messages.push(newMsg);
        messages.forEach(message => {
            socket.send(JSON.stringify(message))
        })

        ws.clients.forEach(client => {
            if (newMsg.restart === "true") {
                messages = [];
                id = 1;
                client.send(JSON.stringify(newMsg));
            } else if (newMsg.gameOver === "true") {
                messages = [];
                id = 1;
                client.send(JSON.stringify(newMsg));
            }
        })
    })
})