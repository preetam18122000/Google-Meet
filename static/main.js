const socket = io("/");
const main__chat__window = document.getElementById("main__chat_window");
const videoGrids = document.getElementById("video-grids");
const myVideo = document.createElement("video");
const chat = document.getElementById("chat");
let OtherUsername = "";

myVideo.muted = true;

//for popup that comes up whenever you load the meeting, to copy the room id, or close it -> it is written in ejs file
window.onload = () => {
    $(document).ready(function() {
        $("#getCodeModal").modal("show");
    });
};

var peer = new Peer(undefined, { //undefined as there is no server path here
    path: "/peerjs",
    host: "/",
    port: "3030",
});

let myVideoStream;
const peers = {}; //for all the people who joins my meet link
//format -> peers[userId] = callObject (provided by peer)

var getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;



navigator.mediaDevices
    .getUserMedia({
        video: true, // that we will need both video and audio
        audio: true,
    })
    .then((stream) => {
            //this handles my screen

        myVideoStream = stream;
        addVideoStream(myVideo, stream, myname); //it will create the video tag, run the video on it, and have the user's name on it -< for me

        socket.on("user-connected", (id, username) => {
            connectToNewUser(id, stream, username); //to create a new video box of another person
            socket.emit("tellName", myname); //to braodcast everyone that another person have joined the room
        });

        socket.on("user-disconnected", (id) => {
            if (peers[id]) peers[id].close();
        });
    });
    peer.on("call", (call) => { //when we get a call from another person
        getUserMedia({ video: true, audio: true },
            function (stream) { //this stream will by my stream
                call.answer(stream); // Answer the call with an A/V stream.
                const video = document.createElement("video"); //for me to see another persons video
                call.on("stream", function(remoteStream) {
                addVideoStream(video, remoteStream, OtherUsername);
            });
        },
        function(err) {
            console.log("Failed to get local stream", err);
        }
    );
});

peer.on("open", (id) => {
    socket.emit("join-room", roomId, id, myname);
});


socket.on("AddName", (username) => {
    OtherUsername = username;
});

const RemoveUnusedDivs = () => {
    const allDivs = videoGrids.getElementsByTagName("div");
    for(const div of allDivs){
        //we have removed video tag on line 83
        //now we will remove all divs which hsve tag of video, but don't have a video tag inside it
        e = div.getElementsByTagName("video").length;
        if(e === 0) div.remove();
    }
}

const connectToNewUser = (userId, streams, myname) => {
    const call = peer.call(userId, streams);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        //       console.log(userVideoStream);
        addVideoStream(video, userVideoStream, myname);
    });
    call.on("close", () => {
        video.remove(); //remove video tag from UI
        RemoveUnusedDivs(); //remove unused divs where video tag is deleted (like above)
    });
    peers[userId] = call;
};

const cancel = () => {
    $("#getCodeModal").modal("hide");
};

const copy = async() => {
    const roomid = document.getElementById("roomid").innerText;
    await navigator.clipboard.writeText(roomid);
};
const invitebox = () => {
    $("#getCodeModal").modal("show");
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        document.getElementById("mic").style.color = "red";
    } else {
        document.getElementById("mic").style.color = "white";
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

const VideomuteUnmute = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    console.log(getUserMedia);
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        document.getElementById("video").style.color = "red";
    } else {
        document.getElementById("video").style.color = "white";
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};


const addVideoStream = (videoEl, stream, name) => {
    videoEl.srcObject = stream;
    videoEl.addEventListener("loadedmetadata", () => {
        //it means the video tag is ready to play the video

        videoEl.play();
    });
    //to show the name
    const h1 = document.createElement("h1");
    const h1name = document.createTextNode(name);
    h1.appendChild(h1name);
    const videoGrid = document.createElement("div");
    videoGrid.classList.add("video-grid");
    videoGrid.appendChild(h1);
    videoGrids.appendChild(videoGrid);
    videoGrid.append(videoEl);
    RemoveUnusedDivs();
    //if multiple users have joined, we should divide the UI between them
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
        for (let index = 0; index < totalUsers; index++) {
            document.getElementsByTagName("video")[index].style.width =
                100 / totalUsers + "%";
        }
    }
};