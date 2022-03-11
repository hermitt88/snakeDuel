const gameCanvas = document.getElementById("gameCanvas");
const ctxGame = gameCanvas.getContext("2d");
const bgCanvas = document.getElementById("bgCanvas");
const ctxBg = bgCanvas.getContext("2d");
const msgCanvas = document.getElementById("msgCanvas");
const ctxMsg = msgCanvas.getContext("2d");

document.body.style.overflow = "hidden";

gameCanvas.width = Math.min(window.innerWidth, window.innerHeight, 550);
gameCanvas.height = gameCanvas.width;
const gameCanvasW = gameCanvas.width;
const gameCanvasH = gameCanvas.height;
bgCanvas.width = gameCanvas.width;
bgCanvas.height = gameCanvas.width;
const bgCanvasW = bgCanvas.width;
const bgCanvasH = bgCanvas.height;

const KEY_RIGHT = "ArrowRight"
const KEY_DOWN = "ArrowDown"
const KEY_LEFT = "ArrowLeft"
const KEY_UP = "ArrowUp"

const boardColor1 = "hsl(44, 40%, 88%)";
const boardColor2 = "hsl(44, 40%, 80%)";
const snakeColor1 = "green";
const snakeColor2 = "#25779f";
const appleColor = "#ff0800";

let pointsPerLine = 19;
let gap = Math.ceil(gameCanvas.width / (pointsPerLine + 2));
let gameboardW = gap * pointsPerLine;
let gameboardH = gap * pointsPerLine;
paintBgCanvas();

const readyForm = document.querySelector(".readyForm");
const leaveForm = document.querySelector(".leaveForm");

let timeoutId;
let snake1, snake2, apple;
let opponentsSnake;
let headX, headY;
let snakeInterval;
let lengthGoal;
let direction, directionTemp;
let directions = [KEY_RIGHT, KEY_DOWN, KEY_LEFT, KEY_UP];
let applesInGame;
let pickApple;

let touchstartX, touchstartY, touchendX, touchendY;

const socket = io();
let players = [];

window.addEventListener('touchstart', function(event) {
    touchstartX = event.changedTouches[0].screenX;
    touchstartY = event.changedTouches[0].screenY;
}, false);

window.addEventListener('touchend', function(event) {
    touchendX = event.changedTouches[0].screenX;
    touchendY = event.changedTouches[0].screenY;
    handleGesture();
}, false); 

function handleGesture() {
    let lastKey;
    let swipeX = touchendX - touchstartX;
    let swipeY = touchendY - touchstartY;
    if (Math.abs(swipeX) > Math.abs(swipeY)) {
        if (swipeX > 0) {
            lastKey = "right";
        } else {
            lastKey = "left";
        }
    } else {
        if (swipeY > 0) {
            lastKey = "down";
        } else {
            lastKey = "up";
        }
    }
    if (directionTemp.length == 0 || lastKey != directionTemp[directionTemp.length-1]) {
        directionTemp = directionTemp.slice(-2).concat(lastKey);
    }
}

function putApple() {
    while (apple.length < applesInGame){
        pickApple = [Math.floor(Math.random() * pointsPerLine), Math.floor(Math.random() * pointsPerLine)];
        while (JSON.stringify([...snake1, ...snake2, ...apple]).includes(JSON.stringify(pickApple))) {
            pickApple = [Math.floor(Math.random() * pointsPerLine), Math.floor(Math.random() * pointsPerLine)];
        };
        paintBlock(pickApple[0], pickApple[1], appleColor);
        apple.push(pickApple);
        pickApple = [];
    }

}

function snakeGame() {
    timeoutId = setTimeout(moveSnake, snakeInterval);
}

function determineDirection () {
    if (directionTemp.length != 0) {
        let newDirection = directionTemp.shift();
        if ((direction == "right" && newDirection != "left" && newDirection != "right") 
        || (direction == "down" && newDirection != "up" && newDirection != "down") 
        || (direction == "left" && newDirection != "right" && newDirection != "left") 
        || (direction == "up" && newDirection != "down" && newDirection != "up")) {direction = newDirection}
    }
}

function moveSnake() {
    determineDirection();
    headX = snake1[0][0];
    headY = snake1[0][1];
    switch (direction) {
        case "right":
            headX += 1;
            break
        case "down":
            headY += 1;
            break
        case "left":
            headX -= 1;
            break
        case "up":
            headY -= 1;
            break
    }
    resolveMoves();
}

function standBySnake(snake, color) {
    for (let block of snake) {
        let paintX = block[0];
        let paintY = block[1];
        paintBlock(paintX, paintY, color);
    };
}

function paintBgCanvas() {
    ctxBg.setTransform(1, 0, 0, 1, 0, 0);
    ctxBg.clearRect(0, 0, gameCanvasW, gameCanvasH);
    ctxBg.fillStyle = "#964b00";
    ctxBg.fillRect(0, 0, gameCanvasW, gameCanvasH);
    ctxBg.translate(Math.floor(0.5*(gameCanvasW - gameboardW)), Math.floor(0.5*(gameCanvasH - gameboardH)));
    for (let i=0; i<pointsPerLine; i++) {
        for (let j=0; j<pointsPerLine; j++) {
            if ((i+j) % 2 == 0) {
                ctxBg.fillStyle = boardColor1;
            } else {
                ctxBg.fillStyle = boardColor2;
            };
            ctxBg.fillRect(i*gap, j*gap, gap, gap);
        }
    };
}

function setSnakeGame() {
    pointsPerLine = 19;
    gap = Math.ceil(gameCanvas.width / (pointsPerLine + 2));
    gameboardW = gap * pointsPerLine;
    gameboardH = gap * pointsPerLine;
    paintBgCanvas();
    ctxGame.setTransform(1, 0, 0, 1, 0, 0);
    ctxGame.clearRect(0, 0, gameCanvasW, gameCanvasH);
    ctxGame.translate(Math.floor(0.5*(gameCanvasW - gameboardW)), Math.floor(0.5*(gameCanvasH - gameboardH)));

    let startingPos1 = Math.floor(pointsPerLine / 3);
    let startingPos2 = pointsPerLine - startingPos1;
    snake1 = [[startingPos1, startingPos1], [startingPos1-1, startingPos1], [startingPos1-2, startingPos1]];
    snake2 = [[startingPos2, startingPos2], [startingPos2+1, startingPos2], [startingPos2+2, startingPos2]];
    snakeInterval = 200;
    lengthGoal = 30;
    direction = "right";
    directionTemp = [];
    snakeLength = 3;
    standBySnake(snake1, snakeColor1);
    standBySnake(snake2, snakeColor2);
    apple = [];
    pickApple = [];
    applesInGame = 2;
    putApple();

    snakeGame();
}

// socket.on("drawGame", (areTheyCleared) => {
//     clearTimeout(timeoutId);
//     if (areTheyCleared) {
//         gameClear(snake1);
//         gameClear(snake2);
//     } else {
//         gameOver(snake1);
//         gameOver(snake2);
//     }
//     btns.hidden = true;
// })
// socket.on("winner", (didPlayer1Win) => {
//     clearTimeout(timeoutId);
//     if (didPlayer1Win) {
//         gameClear(snake1);
//         gameOver(snake2);
//         player1Score += 1;
//         score.innerText = `Player1 ${player1Score}:${player2Score} Player2`
//     } else {
//         gameOver(snake1);
//         gameClear(snake2);
//         player2Score += 1;
//         score.innerText = `Player1 ${player1Score}:${player2Score} Player2`
//     }
//     btns.hidden = true;
// })

function resolveMoves() {
    let winFlag1 = "";
    let winFlag2 = "";
    // if (headX == headX2 && headY == headY2) {
    //     if (snake1.length > snake2.length) {
    //         winFlag1 = "win";
    //         winFlag2 = "lose";
    //         socket.emit("winFlag1", winFlag1);
    //         socket.emit("winFlag2", winFlag2);
    //     } else if (snake1.length < snake2.length) {
    //         winFlag1 = "lose";
    //         winFlag2 = "win";
    //         socket.emit("winFlag1", "lose");
    //         socket.emit("winFlag2", "win");
    //     } else {
    //         winFlag1 = "lose";
    //         winFlag2 = "lose";
    //         socket.emit("winFlag", "lose");
    //         socket.emit("winFlag", "lose");
    //     }
    // } else 
    if (JSON.stringify(snake1).includes(JSON.stringify([headX, headY]), 1) || headX<0 || headY<0 || headX>pointsPerLine-1 ||headY>pointsPerLine-1) {
        socket.emit("winFlag1", "lose");
    } else {
        paintBlock(headX, headY, snakeColor1);
        snake1.unshift([headX, headY]);
        if (JSON.stringify(apple).includes(JSON.stringify(snake1[0]))) {
            if (snakeLength == lengthGoal) {
                socket.emit("winFlag1", "win");
            } else {
                for (let i = 0; i < apple.length; i++) {
                    if (JSON.stringify(apple[i]) == JSON.stringify(snake1[0])) {
                        apple.splice(i, 1);
                        break
                    }
                }
                putApple();
                snakeGame();
            }
        } else {
            removeSnakeTail();
            snakeGame();
        }
    }
}

function gameOver(snake) {
    for (let i = 0; i < snake.length; i++) {
        setTimeout(() => {
            const pad = Math.round(0.075*gap);
            const padX = pad + snake[0][0]*gap;
            const padY = pad + snake[0][1]*gap;
            ctxGame.fillStyle = "hsl(0, 0%, " + Math.round(100*(1 - i/(snake.length - 1))).toString() + "%)";
            ctxGame.fillRect(padX, padY, gap-2*pad, gap-2*pad);}, 100*i);
        }
    btns.hidden = false;
}

function gameClear(snake) {
    for (let i = 0; i < snake.length; i++) {
        setTimeout(() => {
            const pad = Math.round(0.075*gap);
            const padX = pad + snake[0][0]*gap;
            const padY = pad + snake[0][1]*gap;
            ctxGame.fillStyle = "hsl(" + Math.round(320*i/(snake.length - 1)).toString() + ", 100%, 50%)";
            ctxGame.fillRect(padX, padY, gap-2*pad, gap-2*pad);}, 100*i);
        }
    btns.hidden = false;
}

function paintBlock(x, y, color) {
    ctxGame.fillStyle = color;
    const pad = Math.round(0.075*gap);
    const padX = pad + x*gap;
    const padY = pad + y*gap;
    ctxGame.fillRect(padX, padY, gap-2*pad, gap-2*pad);
}

function removeSnakeTail() {
    const snakeTail = snake1.pop();
    ctxGame.clearRect(snakeTail[0]*gap, snakeTail[1]*gap, gap, gap);
}

const btns = document.querySelector(".btns");

function handleReadyBtn(e) {
    e.preventDefault();
    btns.hidden = true;
    socket.emit("ready", yourRole);

    setSnakeGame();
}

// function handleReadyBtn(e) {
//     e.preventDefault();
//     readyForm.hidden = true;
//     socket.emit
// }

function handleLeaveBtn(e) {
    e.preventDefault();
    toWelcome();
    socket.emit("leave_room", roomName, toWelcome);
}

readyForm.addEventListener("submit", handleReadyBtn);
leaveForm.addEventListener("submit", handleLeaveBtn);

window.addEventListener("keydown", changeDirection);

function changeDirection(e) {
    let lastKey = e.key;
    if (directions.includes(lastKey)) {
        switch (lastKey) {
            case KEY_RIGHT:
                lastKey = "right";
                break
            case KEY_DOWN:
                lastKey = "down";
                break
            case KEY_LEFT:
                lastKey = "left";
                break
            case KEY_UP:
                lastKey = "up";
                break
            }
        if (directionTemp.length == 0 || lastKey != directionTemp[directionTemp.length-1]) {
            directionTemp = directionTemp.slice(-2).concat(lastKey);
        }
    }
}


// const socket = io("HEROKU URL");
const welcome = document.getElementById("welcome");
const joinForm = document.querySelector(".joinForm");

const gameBoard = document.getElementById("gameBoard");
const joinedRoom = gameBoard.querySelector(".joinedRoom");
gameBoard.hidden = true;

let roomName;
const message = gameBoard.querySelector(".message");
const score = gameBoard.querySelector(".score");
let player1Score = 0;
let player2Score = 0;
score.innerText = `Player1 ${player1Score}:${player2Score} Player2`

function handleJoin(e) {
    e.preventDefault();
    const input = joinForm.querySelector("input");
    roomName = input.value;
    socket.emit("join_room", roomName, whoAmI);
    input.value = "";
    toRoom();
    joinedRoom.innerText = `Room: ${roomName}`;
};

function toRoom() {
    welcome.hidden = true;
    gameBoard.hidden = false;
};

function toWelcome() {
    yourRole = "";
    gameBoard.hidden = true;
    welcome.hidden = false;
};

let yourRole = "";

function whoAmI (who) {
    yourRole = who;
    message.innerText = `You are ${yourRole}`;
    if (yourRole == "observer") {
        readyForm.hidden = true;
    }
}

joinForm.addEventListener("submit", handleJoin);