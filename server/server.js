const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

let waitingUser = null;
let onlineUsers = 0;

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    onlineUsers++;
    io.emit("onlineCount", onlineUsers);

    // Matchmaking
    if (waitingUser) {

        console.log("MATCHED:", waitingUser.id, socket.id);

        socket.partner = waitingUser;
        waitingUser.partner = socket;

        socket.emit("matched");
        waitingUser.emit("matched");

        waitingUser = null;

    } else {

        console.log("WAITING:", socket.id);

        waitingUser = socket;
        socket.emit("waiting");
    }

    // Messages
    socket.on("message", (msg) => {

        if (socket.partner) {
            socket.partner.emit("message", msg);
        }

    });

    // Typing indicator
socket.on("typing", () => {

    console.log("TYPING:", socket.id);

    if (socket.partner) {
        socket.partner.emit("typing");
    }

});

    // Next stranger
    socket.on("next", () => {

        console.log("NEXT CLICKED:", socket.id);

        const oldPartner = socket.partner;

        if (oldPartner) {

            oldPartner.partner = null;
            oldPartner.emit("partnerDisconnected");

            if (waitingUser === null) {
                waitingUser = oldPartner;
                oldPartner.emit("waiting");
            }
        }

        socket.partner = null;

        if (waitingUser && waitingUser !== socket) {

            socket.partner = waitingUser;
            waitingUser.partner = socket;

            socket.emit("matched");
            waitingUser.emit("matched");

            waitingUser = null;

        } else {

            waitingUser = socket;
            socket.emit("waiting");
        }
    });

    // Disconnect
    socket.on("disconnect", () => {

        console.log("Disconnected:", socket.id);

        onlineUsers--;
        io.emit("onlineCount", onlineUsers);

        if (waitingUser === socket) {
            waitingUser = null;
        }

        if (socket.partner) {

            socket.partner.emit("partnerDisconnected");

            socket.partner.partner = null;

            waitingUser = socket.partner;
        }
    });

});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});