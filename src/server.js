import path from 'path';
const __dirname = path.resolve();

import http from "http";
import {Server} from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/src/views");
app.use("/public", express.static(__dirname + "/src/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:${app.get('port')||3000}`)

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

let rooms = 0;

function counter(roomName) {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
  }

wsServer.on("connection", (socket) => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        if (counter(roomName) == 1) {
            socket.emit("player1", "player1");
        } else if (counter(roomName) == 2) {
            socket.emit("player2", "player2");
        } else {
            socket.emit("observer", "observer");
        }

    });
    socket.on("leave_room", (roomName) => {
        socket.leave(roomName);
        socket.emit("leaved");
    })

});


httpServer.listen(process.env.PORT||3000, handleListen);