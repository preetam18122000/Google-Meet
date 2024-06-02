const socket = io("/");
const main_chat_window = document.getElementById('main_chat_window');
const videoGrids = document.getElementById("vide-grids");
const myVideo = document.getElementById("video");
const chat = document.getElementById("chat");

let OtherUsername = "";
myVideo.muted = true;

//for popup that comes up whenever you load the meeting, to copy the room id, or close it -> it is written in ejs file
window.onload = () => {
    $(document).ready(function () {
        $("#getCodeModal").modal("show");
    })
}

var peer = new Peer(undefined, { //undefined as there is no server path here
    path: "/peerjs",
    host: "/",
    port: "3030"
});


let myVideoStream;
const peers = {}; //for all the people who joins my meet link

var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia; //1,2 ->google and other v8engine, 3 -> mozilla

getUserMedia({
    video: true, // that we will need both video and audio
    audio: true
}).then((stream) => {
    //this handles my screen
    myVideoStream = stream;
    addVideoStream(myVideo, stream, myname); //it will create the video tag, run the video on it, and have the user's name on it -< for me

    socket.on("user-connected", (id, username) =>{
        connectToNewUser(id, stream, username); //to create a new video box of another person
        socket.emit("tellName", myname); //to braodcast everyone that another person have joined the room
    });

    socket.on("user-disconnected", (id)=> {
        if(peers[id]) peers[id].close();
    })
});

peer.on("call", (call) => { //when we get a call from another person
    getUserMedia({  video: true, audio: true }, (stream) => {
        call.answer(stream); //acknowledge the call and pass our stream to another person
        const video = document.createElement("video"); //for me to see another persons video
        call.on("stream", (remoteStream) => {
            addVideoStream (video, remoteStream, ""); //third argument will be the name of the person who joined
        });
    });
});

peer.on("open", (id) => {
    socket.emit("join-room", roomId, id, myname);
});

socket.on("AddName", (username) => {
    OtherUsername = username;
});