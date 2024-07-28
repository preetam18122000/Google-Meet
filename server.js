const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 3030;
const server = require('http').Server(app);
const socketIo = require('socket.io');
const io = socketIo(server);
const { v4: uuidv4 } = require('uuid');
const { ExpressPeerServer } = require('peer'); //you will have to run two servers - one for the port, other for peerjs
const url = require('url');
const peerServer = ExpressPeerServer(server, {
    debug: true //for development purpose
});
const path = require('path');

//middlewares
app.set("view engine", "ejs");   //to use ejs files or to use view engine
app.use("/public", express.static(path.join(__dirname, "static")));
app.use('/peerjs', peerServer); //any url starting with /peerjs will call this function

//routes
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, "static", "index.html")); //this get call will render out initial html
})

app.get('/join', (req,res) => { //if a person is coming to /join, then we should redirect it to any specific meeting id
    res.redirect(
        url.format({
            pathname: `/join/${uuidv4()}`,
            query: req.query
        })
    );
});

app.get('/joinold', (req, res) => {
    res.redirect(
        url.format({
            pathname: `/join/${req.query.meeting_id}`,
            query: req.query
        })
    );
});

app.get("/join/:rooms", (req, res) => {
    res.render("room", { roomid: req.params.rooms, Myname: req.query.name });
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomid, id, myName) => {
        socket.join(roomid);
        socket.to(roomid).emit("user-connected", id, myName);

        socket.on("tellName", (myName) => {
            socket.to(roomid).emit("AddName", myName);
        });

        socket.on("disconnect", () => {
            socket.to(roomid).emit("user-disconnected", id);
        });
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});