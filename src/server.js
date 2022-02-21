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

const handleListen = () => console.log(`Listening on http://localhost:3000`)

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

httpServer.listen(3000, handleListen);