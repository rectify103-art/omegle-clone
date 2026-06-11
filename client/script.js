console.log("SCRIPT LOADED");

const socket = io("https://omegle-clone-s600.onrender.com");

socket.on("connect", () => {
    console.log("CONNECTED TO SERVER", socket.id);
});

socket.on("connect_error", (err) => {
    console.error("CONNECTION ERROR:", err);
});

const input = document.getElementById("msg");

input.addEventListener("input", () => {
    socket.emit("typing");
});

const chat = document.getElementById("chat");

const statusEl = document.getElementById("status");



function addMessage(text, type) {
    
    const div = document.createElement("div");

    div.classList.add("message");
    div.classList.add(type);

    div.textContent = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}




document.getElementById("clear").addEventListener("click", () => {
    chat.innerHTML = "";
})

input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        document.getElementById("send").click();
    }
});

socket.on("waiting", () => {
    statusEl.innerText = "Waiting for stranger...";
});

socket.on("matched", () => {
    statusEl.innerText = "Connected to stranger";
});

socket.on("message", (msg) => {
    addMessage(msg, "stranger");
});


document.getElementById("send").addEventListener("click", () => {

    if (!input.value.trim()) return;

    addMessage(input.value, "you");

    socket.emit("message", input.value);

    input.value = "";
});

document.getElementById("next").addEventListener("click", () => {

    console.log("NEXT BUTTON CLICKED");

    chat.innerHTML = "";

    socket.emit("next");

});

socket.on("partnerDisconnected", () => {
    statusEl.innerText = "Stranger left. Waiting...";
});

socket.on("onlineCount", (count) => {
    document.getElementById("onlineUsers").innerText =
        `Online: ${count}`;
});

const typingEl = document.getElementById("typing");

socket.on("typing", () => {

    console.log("TYPING RECEIVED");

    typingEl.innerText = "Stranger is typing...";

    clearTimeout(window.typingTimer);

    window.typingTimer = setTimeout(() => {
        typingEl.innerText = "";
    }, 1000);

});