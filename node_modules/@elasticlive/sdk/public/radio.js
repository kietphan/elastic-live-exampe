let roomName = "";
const castButton = document.querySelector("#castButton");
const cast2Button = document.querySelector("#cast2Button");
const closeButton = document.querySelector("#closeButton");
const viewButton = document.querySelector("#viewButton");
const joinButton = document.querySelector("#joinButton");
const listenButton = document.querySelector("#listenButton");
const acceptButton = document.querySelector("#acceptButton");
const info = document.querySelector("#info");
const roomNameInput = "demo";
const localAudioElement = document.querySelector("#localAudio");
const localAudio2Element = document.querySelector("#localAudio2");
const remoteAudioElement = document.querySelector("#remoteAudio");
const remoteAudio2Element = document.querySelector("#remoteAudio2");
let mode = "";
const config = {
  credential: {
    serviceId: "simpleapp",
    key: "27f8ca5ee273153d9a9c5944c766fa097d2e16de4dda425a"
  },
  sdk: {
    logLevel: "VERBOSE",
    audioType: "music"
  },
  view: {
    local: "localAudio",
    remote: "remoteAudio"
  },
  media: {
    video: false,
    audio: {
      deviceId: "default",
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false
    }
  }
};
const config2 = {
  credential: {
    serviceId: "simpleapp",
    key: "27f8ca5ee273153d9a9c5944c766fa097d2e16de4dda425a"
  },
  sdk: {
    logLevel: "VERBOSE"
  },
  view: {
    local: "localAudio2",
    remote: "remoteAudio2"
  },
  audio: { remote: "remoteAudio2" },
  media: {
    video: false,
    audio: {
      deviceId: "default",
      echoCancellation: false,
      autoGainControl: true,
      noiseSuppression: true
    }
  }
};
let remon = new ELive(config);
let remon2 = new ELive(config2);
let livenum = 0;
remon.on("onComplete", msg => {
  console.log("cast is called");
  if (mode === "CAST") {
    livenum = 1;
    info.innerHTML = "A Cast is started. Have fun cast";
    show(cast2Button);
    noshow(castButton);
    noshow(viewButton);
  }
  if (mode === "JOIN") {
    info.innerHTML = "You are linked to the host";
    livenum = 2;
    noshow(viewButton);
  }

  if (mode === "VIEW") {
    livenum = 1;
    info.innerHTML = "Preparation is completed";
    noshow(castButton);
    noshow(cast2Button);
    noshow(viewButton);
    show(listenButton);
  }
});
remon2.on("onComplete", msg => {
  console.log("listen is called");
  livenum = 2;
  if (mode === "CAST" || mode === "VIEW") {
    info.innerHTML = "New guest is come in. Would you approve?";
    noshow(cast2Button);
    show(acceptButton);
  } else if (mode === "JOIN") {
    info.innerHTML = "Are you sure to join the room?";
    show(acceptButton);
  }
});
remon2.on("onClose", () => {
  console.log("remon2 is closed");
});
remon.on("onClose", () => {
  remon.close();
  livenum = 0;
  mode = "";
  window.location.reload();
});
remon.on("onSearch", list => {
  if (!list) return;
  if (list.length == 0) return;
  if (
    (mode === "CAST" || mode === "VIEW") &&
    list.length == 2 &&
    livenum == 1
  ) {
    livenum = 2;
    remon2.watch(roomNameInput + 2);
    info.innerHTML = "There is a room guest. is joining..";
    noshow(joinButton);
    return;
  }
  if (mode === "CAST") return;
  if (mode === "VIEW" && livenum == 1) return;
  if (livenum == 2) return;
  info.innerHTML = "Broadcasting now. Listen or join";
  noshow(castButton);
  show(viewButton);
  noshow(joinButton);
});
listenButton.addEventListener("click", evt => {
  livenum = 1;
  remoteAudioElement.play();
  noshow(listenButton);
  show(joinButton);
  show(closeButton);
});
acceptButton.addEventListener("click", evt => {
  livenum = 2;
  remoteAudio2Element.play();
  localAudio2Element.play();
  noshow(acceptButton);
});
cast2Button.addEventListener("click", evt => {
  noshow(cast2Button);
  localAudioElement.play();
  localAudio2Element.play();
});
viewButton.addEventListener("click", evt => {
  mode = "VIEW";
  remon.watch(roomNameInput);
  noshow(viewButton);
  noshow(joinButton);
  show(closeButton);
});
function show(b) {
  b.style.visibility = "visible";
  b.style.display = "inline";
}
function noshow(b) {
  b.style.visibility = "hidden";
  b.style.display = "none";
}
async function join(id) {
  mode = "JOIN";
  livenum = 2;
  remon2.cast(id);
}
joinButton.addEventListener("click", evt => {
  join(roomNameInput + 2);
  noshow(castButton);
  noshow(viewButton);
  noshow(joinButton);
  show(closeButton);
  evt.preventDefault();
});
castButton.addEventListener("click", evt => {
  remon.cast(roomNameInput);
  livenum = 1;
  mode = "CAST";
  noshow(castButton);
  show(closeButton);
  evt.preventDefault();
});
closeButton.addEventListener("click", evt => {
  remon.close();
  livenum = 0;
  mode = "";
  castButton.disabled = false;
  if (remon2.ctx.isConnectToSig) remon2.close();
  if (mode !== "VIEW") window.location.reload();
  evt.preventDefault();
});

setInterval(remon.search, 2000);
