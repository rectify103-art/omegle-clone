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

    // =========================
    // WEBRTC SIGNALING
    // =========================

    socket.on("offer", (offer) => {
        if (socket.partner) {
            socket.partner.emit("offer", offer);
        }
    });

    socket.on("answer", (answer) => {
        if (socket.partner) {
            socket.partner.emit("answer", answer);
        }
    });

    socket.on("ice-candidate", (candidate) => {
        if (socket.partner) {
            socket.partner.emit("ice-candidate", candidate);
        }
    });

    // =========================
    // MATCHMAKING
    // =========================

    if (waitingUser) {

        console.log("MATCHED:", waitingUser.id, socket.id);

        socket.partner = waitingUser;
        waitingUser.partner = socket;

        // New user becomes initiator
        socket.emit("matched", {
            initiator: true
        });

        waitingUser.emit("matched", {
            initiator: false
        });

        waitingUser = null;

    } else {

        console.log("WAITING:", socket.id);

        waitingUser = socket;
        socket.emit("waiting");
    }

    // =========================
    // CHAT MESSAGES
    // =========================

    socket.on("message", (msg) => {

        if (socket.partner) {
            socket.partner.emit("message", msg);
        }

    });

    // =========================
    // TYPING
    // =========================

    socket.on("typing", () => {

        if (socket.partner) {
            socket.partner.emit("typing");
        }

    });

    // =========================
    // NEXT STRANGER
    // =========================

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

            socket.emit("matched", {
                initiator: true
            });

            waitingUser.emit("matched", {
                initiator: false
            });

            waitingUser = null;

        } else {

            waitingUser = socket;
            socket.emit("waiting");

        }

    });

    // =========================
    // DISCONNECT
    // =========================

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

            socket.partner.emit("waiting");
        }

    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});