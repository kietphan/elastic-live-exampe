// const SIGURL = "wss://demo.remotemonster.com/ws1235";
const SIGURL = "ws://localhost:1235/sig";
const con = new WebSocket(SIGURL);
const constraints = { video: true, audio: true };
const pcConfig = {
  iceServers: [
    { urls: ["stun:stun.services.mozilla.com"] },
    { urls: ["stun:stun.l.google.com:19302"] }
  ],
  sdpSemantics: "unified-plan"
};
const pcConfig2 = {
  mandatory: {
    googHighpassFilter: false,
    googEchoCancellation: false,
    googEchoCancellation2: false,
    googAutoGainControl: false,
    googAutoGainControl2: false,
    googNoiseSuppression: false,
    googNoiseSuppression2: false,
    googTypingNoiseDetection: false,
    echoCancellation: false,
    googAudioMirroring: true
  },
  optional: [{ googCpuOveruseDetection: false }]
};
let pc;
let member;
let id;
let translist = [];
let runtimeStatus = 0;
const senderStream = new MediaStream();
let audioTrack;
let pcList = {};
let curPc;
let audioContext;
let audioSource;
const remoteAudioElement = document.querySelector("#remoteAudio");

con.onopen = function(event) {
  const registerMsg = createInitMsg();
  audioContext = new AudioContext();
  con.send(JSON.stringify(registerMsg));
};
con.onmessage = async function(event) {
  const msg = JSON.parse(event.data);
  let desc;
  console.log(msg);
  switch (msg.command) {
    case "onRegister":
      member = msg.member;
      break;
    case "onCast":
      console.log("onCast is called");
      pc = new RTCPeerConnection(pcConfig, pcConfig2);
      pc.onicecandidate = gotIceCandidate;
      pc.ontrack = gotRemoteStream;
      pc.oniceconnectionstatechange = gotIceEvents;
      pc.to = msg.from;
      break;
    case "onWatch":
      console.log(`onWatch is called chid:${msg.channel.id}`);
      curPc = new RTCPeerConnection(pcConfig, pcConfig2);
      pcList[msg.from] = { pc: curPc };
      pcList[msg.from].pc.onicecandidate = event => {
        con.send(
          JSON.stringify({
            command: "ice",
            token: id,
            to: pcList[msg.from].pc.to,
            body: JSON.stringify(event.candidate)
          })
        );
      };
      pcList[msg.from].pc.oniceconnectionstatechange = event => {
        if (!pcList[msg.from].pc) return;
        console.log(
          `${msg.from} status: ${pcList[msg.from].pc.iceConnectionState}`
        );
        if (pcList[msg.from].pc.iceConnectionState === "connected") {
          console.log("connected");
          //translist = pcList[msg.from].pc.getTransceivers()
          // runtimeStatus = 0
        } else if (pcList[msg.from].pc.iceConnectionState === "disconnected") {
          // pc를 별도로 다 해야하는군.
          Array.from(pcList[msg.from].pc.getTransceivers()).forEach(
            o => (o.direction = "inactive")
          );
          pcList[msg.from].pc.close();
          delete pcList[msg.from];
        }
      };
      pcList[msg.from].pc.to = msg.from;
      pcList[msg.from].pc
        .addTransceiver("audio")
        .sender.replaceTrack(senderStream.getAudioTracks()[1]);
      if (senderStream.getVideoTracks().length > 0)
        pcList[msg.from].pc
          .addTransceiver("video")
          .sender.replaceTrack(senderStream.getVideoTracks()[0]);
      // senderStream.getTracks().forEach(track => pcList[msg.from].pc.addTrack(track, senderStream))
      Array.from(pcList[msg.from].pc.getTransceivers()).forEach(
        o => (o.direction = "sendonly")
      );
      desc = await pcList[msg.from].pc.createOffer({
        voiceActivityDetection: false
      });
      desc.sdp = replaceCodec(desc.sdp, /m=video(:?.*)?/, "H264");
      // desc.sdp = setMediaBitrate(desc.sdp, 'video', 1500)
      // desc.sdp = replaceAlias(desc.sdp)
      console.debug(desc.sdp);
      // desc.sdp = deleteExt(desc.sdp)
      await gotDescription(pcList[msg.from].pc, desc);
      break;
    case "onSdp":
      console.log(`onSdp: ${msg.body}`);
      desc = new RTCSessionDescription(JSON.parse(msg.body));
      // pc.to = msg.from
      if (msg.pctype === "DC") {
        console.log("sdp for dc");
        return;
      }
      if (pcList[msg.from]) {
        curPc = pcList[msg.from].pc;
      } else if (pc.to === msg.from) {
        curPc = pc;
      }
      await curPc
        .setRemoteDescription(desc)
        .then(() => {
          console.log("remote description is set");
        })
        .catch(e => {
          console.err("remote description is wrong");
        });

      if (desc.type === "offer") {
        await curPc
          .createAnswer()
          .then(desc => {
            // desc.sdp = replaceAlias(desc.sdp)
            curPc.setLocalDescription(desc).then(() => {
              console.log("local description is set");
              const msg = {
                command: "sdp",
                token: id,
                body: JSON.stringify(desc)
              };
              msg.to = curPc.to;
              con.send(JSON.stringify(msg));
            });
          })
          .catch(e => {
            console.err("failed to create answer", e);
          });
      }
      // offer인 경우 양방향 통신이거나 방송자쪽이며
      // answer인 경우 viewer쪽임
      break;
    case "onIce":
      const candidate = new RTCIceCandidate(JSON.parse(msg.body));
      console.log("candidate: ", JSON.stringify(candidate));
      if (pcList[msg.from]) {
        curPc = pcList[msg.from].pc;
      } else if (pc.to === msg.from) {
        curPc = pc;
      }
      if (msg.pctype && msg.pctype === "DC") return;
      else curPc.addIceCandidate(candidate);
      break;
  }
};
function gotIceCandidate(event) {
  console.log("got local icecandidate and send it to server");
  if (event.candidate != null) {
    const msg = {
      command: "ice",
      token: id,
      to: pc.to,
      body: JSON.stringify(event.candidate)
    };
    con.send(JSON.stringify(msg));
  }
}

function gotIceEvents(event) {
  if (pc.iceConnectionState === "connected") {
    translist = pc.getTransceivers();
    runtimeStatus = 0;

    audioSource = audioContext.createMediaStreamSource(senderStream);
    let biquadFilter = audioContext.createBiquadFilter();
    biquadFilter.type = "lowshelf";
    biquadFilter.frequency.value = 1000;
    biquadFilter.gain.value = 35;
    audioSource.connect(biquadFilter);
    // biquadFilter.connect(audioContext.destination)
    let filteredStream = audioContext.createMediaStreamDestination();
    senderStream.addTrack(filteredStream.stream.getAudioTracks()[0]);
    // remoteAudioElement.srcObject = new MediaStream(filteredStream.stream.getAudioTracks())
    // senderStream.addTrack(remoteAudioElement.audioTracks[0])
  } else if (pc.iceConnectionState === "disconnected") {
    pc.close();
    con.close();
    window.location.reload();
  }
}

async function gotDescription(thispc, desc) {
  try {
    await thispc.setLocalDescription(desc);
  } catch (e) {
    console.error(e);
  } finally {
    console.log("send sdp to server");
    const msg = { command: "sdp", token: id, body: JSON.stringify(desc) };
    msg.to = thispc.to;
    con.send(JSON.stringify(msg));
  }
}

function gotRemoteStream(event) {
  senderStream.addTrack(event.track);
  // audioTrack = event.track.clone();
  console.log("got remote stream");
}

function createInitMsg() {
  id = `SL${uuidv4()}`.replace(/-/g, "");
  member = {
    id,
    role: "broadcast",
    users: 0,
    maxUsers: 10
  };
  return {
    command: "register",
    token: id,
    member
  };
}

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

function deleteExt(sdp) {
  let lines = sdp.split("\n");
  let line = 1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf("m=video") === 0) {
      line = i;
      break;
    }
  }
  for (let i = line; i < lines.length; i++) {
    if (lines[i].indexOf("a=extmap") === 0) {
      line = i;
      lines.splice(line, 9);
      break;
    }
  }
  for (let i = line; i < lines.length; i++) {
    if (lines[i].indexOf("ccm fir") > 0) {
      line = i;
      lines.splice(line, 1);
      break;
    }
  }
  return lines.join("\n");
}
function replaceAlias(sdp) {
  let lines = sdp.split("\n");
  let line = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf("WMS") > 0) {
      lines[i] = "a=msid-semantic: WMS member";
      break;
    }
  }
  return lines.join("\n");
}

function setMediaBitrate(sdp, media, bitrate) {
  let lines = sdp.split("\n");
  let line = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf("m=" + media) === 0) {
      line = i;
      break;
    }
  }
  if (line === -1) {
    console.debug("Could not find the m line for", media);
    return sdp;
  }
  console.debug("Found the m line for", media, "at line", line);

  // Pass the m line
  line++;

  // Skip i and c lines
  while (lines[line].indexOf("i=") === 0 || lines[line].indexOf("c=") === 0) {
    line++;
  }

  // If we're on a b line, replace it
  if (lines[line].indexOf("b") === 0) {
    console.debug("Replaced b line at line", line);
    lines[line] = "b=AS:" + bitrate;
    return lines.join("\n");
  }

  // Add a new b line
  console.debug("Adding new b line before line", line);
  let newLines = lines.slice(0, line);
  newLines.push("b=AS:" + bitrate);
  newLines = newLines.concat(lines.slice(line, lines.length));
  return newLines.join("\n");
}

function replaceCodec(sdp, mLineReg, preferCodec) {
  let mLine,
    newMLine = [],
    sdpCodec,
    mLineSplit,
    reg = new RegExp("a=rtpmap:(\\d+) " + preferCodec + "/\\d+");

  mLine = sdp.match(mLineReg);
  if (!mLine) {
    return sdp;
  }

  sdpCodec = sdp.match(reg);
  if (!sdpCodec) {
    return sdp;
  }

  mLine = mLine[0];
  sdpCodec = sdpCodec[1];

  mLineSplit = mLine.split(" ");
  newMLine.push(mLineSplit[0]);
  newMLine.push(mLineSplit[1]);
  newMLine.push(mLineSplit[2]);
  newMLine.push(sdpCodec);

  for (let i = 3; i < mLineSplit.length; i++) {
    if (mLineSplit[i] !== sdpCodec) {
      newMLine.push(mLineSplit[i]);
    }
  }
  return sdp.replace(mLine, newMLine.join(" "));
}

///// 주기적으로 signal서버에 자신의 stat을 전달해줄 필요가 있음.
