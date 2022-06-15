const socket = new WebSocket('wss://site82.webte.fei.stuba.sk:9000');
//const _ = require('lodash');
let dir;
let position;
let playerId;
let winner;
let intervalID;
let canPlay = false;
let startTimer = true;
let positionsA=[];
let positionsB=[];

document.querySelector('#sendMsg').addEventListener('click', () => {
    document.querySelector('#sendMsg').style.visibility = 'hidden';
    start();

})
document.querySelector('#restart').addEventListener('click', () => {
    socket.send(JSON.stringify({
        "restart": "true"
    }));
})

socket.addEventListener("message", msg => {
    const pos = JSON.parse(msg.data);
    canPlay = pos.canPlay;
    playerId = pos.id;

    if (pos.dirX === 1 || pos.dirX === 0) {
        dir = [pos.dirX, pos.dirY];
        position = [pos.posX, pos.posY];

        if (playerId === 1) {
            document.getElementById('color').style.backgroundColor='black';
            positionsA.push(position);
            socket.send(JSON.stringify({
                "canPlay": false,
                "x": position[0],
                "y": position[1],
                "color": 'black',
                "id": playerId
            }));
        } else if (playerId === 2) {
            document.getElementById('color').style.backgroundColor='red';
            positionsB.push(position)
            socket.send(JSON.stringify({
                "canPlay": false,
                "x": position[0],
                "y": position[1],
                "color": 'red',
                "id": playerId
            }));
        }
    } else {
        if (playerId === 1) {
            position = [pos.x, pos.y]
            positionsA.push(position)
            positionsA=positionsA.unique();
        }else if (playerId === 2) {
            position = [pos.x, pos.y]
            positionsB.push(position)
            positionsB=positionsB.unique();
        }
        if (startTimer && pos.canPlay === true) {
            //intervalID = playerId===1 ?setIntervalAndExecute(205) : setIntervalAndExecute(200);
            intervalID=setIntervalAndExecute(200);
            startTimer = false;
        }
        if (pos.gameOver === "true") {
            restartGame();
            document.getElementById("winner").innerHTML = pos.winner
        } else if (pos.restart === "true") {
            location.reload();
        }
    }
})

const hp = [];
for (let i = 0; i < 20; i++) {
    hp[i] = [];
    for (let j = 0; j < 30; j++) {
        hp[i][j] = 0;
    }
}

const c = document.getElementById("myCanvas");
const ctx = c.getContext("2d");

const sendMessage = () => {
    console.log(positionsA)
    console.log(positionsB)
    if (canPlay) {

        if (playerId === 1) {
            if (hp[position[0]][position[1]] !== 1) {
                hp[position[0]][position[1]] = 1;
            }
        } else if (playerId === 2) {
            if (hp[position[0]][position[1]] !== 2) {
                hp[position[0]][position[1]] = 2;
            }
        }

        positionsA.forEach((data)=>{
            hp[data[0]][data[1]]=1;
        })
        positionsB.forEach((data)=>{
            hp[data[0]][data[1]]=2;
        })

        position[0] += dir[0];
        position[1] += dir[1];
        if (position[0] >= 20 || position[0] <= -1 || position[1] >= 30 || position[1] <= -1 || hp[position[0]][position[1]] === 2 || hp[position[0]][position[1]] === 1) {
            hp.forEach((row, x) => {
                row.forEach((cell, y) => {
                    if (cell === 1) {
                        setFilled(x, y, 'black');
                    } else if (cell === 2) {
                        setFilled(x, y, 'red');
                    }
                })
            })
            winner = playerId === 1 ? "Víťaz: Červená farba" : "Víťaz: Čierna farba";
            socket.send(JSON.stringify({
                "gameOver": "true",
                "winner": winner
            }));
        } else if (playerId === 1) {
            hp[position[0]][position[1]] = 1;
            socket.send(JSON.stringify({
                "canPlay": canPlay,
                "x": position[0],
                "y": position[1],
                "color": 'black',
                "id": playerId
            }));

        } else if (playerId === 2) {
            hp[position[0]][position[1]] = 2
            socket.send(JSON.stringify({
                "canPlay": canPlay,
                "x": position[0],
                "y": position[1],
                "color": 'red',
                "id": playerId
            }));
        }
        hp.forEach((row, x) => {
            row.forEach((cell, y) => {
                if (cell === 1) {
                    setFilled(x, y, 'black');
                } else if (cell === 2) {
                    setFilled(x, y, 'red');
                }
            })
        })
    }
    return 0;
}

document.onkeydown = (e) => {

    if (e.keyCode === 38) {
        if (dir[0] !== 0 && dir[1] !== 1) {
            dir = [0, -1]
        }
    } else if (e.keyCode === 40) {
        if (dir[0] !== 0 && dir[1] !== -1) {
            dir = [0, 1]
        }
    } else if (e.keyCode === 37) {
        if (dir[0] !== 1 && dir[1] !== 0) {
            dir = [-1, 0]
        }
    } else if (e.keyCode === 39) {
        if (dir[0] !== -1 && dir[1] !== 0) {
            dir = [1, 0]
        }
    }
}

const start = () => {
    socket.send(JSON.stringify({
        "canPlay": true,
        "x": position[0],
        "y": position[1],
        "color": 'red',
        "id": playerId
    }));
};


function setIntervalAndExecute(t) {
    return (setInterval(sendMessage, t));
}

const setFilled = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * 20, y * 20, 20, 20);
}

const restartGame = () => {
    ctx.clearRect(0, 0, c.width, c.height)
    clearInterval(intervalID);

    hp.forEach((row, x) => {
        row.forEach((cell, y) => {
            hp[x][y] = 0;
            setFilled(x, y, 'white');
        })
    })
}
function arrays_equal(a,b) { return !!a && !!b && !(a<b || b<a); }

Array.prototype.unique = function() {
    const a = [];
    for (let i = 0, l = this.length; i<l; i++) {
        for (let j = i + 1; j < l; j++) if (arrays_equal(this[i], this[j])) j = ++i;
        a.push(this[i]);
    }
    return a;
};