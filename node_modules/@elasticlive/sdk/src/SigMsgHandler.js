import l from "./Logger";
import EliveError from "./Error";
import Messaging from "./Messaging.js";
import util from "./Util";

function SigMsgHandler(ctx) {
  const sigEvents = {
    onCall(msg) {
      l.i(`start onCall with chid:${msg.channel.id}`);
      if (!msg.pctype || msg.pctype !== "DC") ctx.channel = msg.channel;
      ctx.role = "CALLER";
      ctx.callEvent({ name: "onCall", param: { channel: ctx.channel } });
      ctx.peerConnection = new RTCPeerConnection(
        ctx.config.rtc,
        ctx.config.rtc.opt
      );
      ctx.peerConnection.onicecandidate = handleIceCandidate;
      ctx.localStream
        .getTracks()
        .forEach(track => ctx.peerConnection.addTrack(track, ctx.localStream));
      ctx.peerConnection.ontrack = handleTrack;
      ctx.messaging = new Messaging(ctx);
      ctx.messaging.listening();
      ctx.dataConnection.onicecandidate = handleDcIceCandidate;
      ctx.peerConnection.oniceconnectionstatechange = handleIceConnectionEvent;
    },
    onCallee(msg) {
      l.i(`start onCallee with chid:${msg.channel.id}`);
      if (!msg.pctype || msg.pctype !== "DC") ctx.channel = msg.channel;
      ctx.role = "CALLEE";
      ctx.callEvent({ name: "onCall", param: { channel: ctx.channel } });
      ctx.peerConnection = new RTCPeerConnection(
        ctx.config.rtc,
        ctx.config.rtc.opt
      );
      ctx.peerConnection.onicecandidate = handleIceCandidate;
      ctx.localStream
        .getTracks()
        .forEach(track => ctx.peerConnection.addTrack(track, ctx.localStream));
      ctx.peerConnection.ontrack = handleTrack;
      ctx.peerConnection.oniceconnectionstatechange = handleIceConnectionEvent;
      ctx.peerConnection.to = ctx.channel.master;
      ctx.peerConnection.onnegotiationneeded = handleRenegoEvent;
      ctx.messaging = new Messaging(ctx);
      ctx.messaging.startOffer();
      ctx.dataConnection.onicecandidate = handleDcIceCandidate;
      ctx.peerConnection
        .createOffer({ offerToReceiveAudio: 1, offerToReceiveVideo: 1 })
        .then(desc => {
          desc.sdp = replaceCodec(desc.sdp, /m=video(:?.*)?/, "H264");
          // desc.sdp = desc.sdp.replace('a=fmtp:111 minptime=10;useinbandfec=1',
          //   'a=fmtp:111 minptime=20;useinbandfec=1;maxaveragebitrate=256000;stereo=1;sprop-stereo=1;cbr=1')
          desc.sdp = desc.sdp.replace(
            "a=fmtp:111 minptime=10;useinbandfec=1",
            // 'a=fmtp:111 useinbandfec=0;minptime=5;maxptime=20;maxplaybackrate=48000;sprop-maxcapturerate=48000;maxaveragebitrate=400000;stereo=1;cbr=1')
            "a=fmtp:111 useinbandfec=1;minptime=10;stereo=1;cbr=1;maxaveragebitrate=400000"
          );
          if (ctx.config.media.video.bitrate) {
            desc.sdp = setMediaBitrate(
              desc.sdp,
              "video",
              ctx.config.media.video.bitrate
            );
          }
          ctx.peerConnection.setLocalDescription(desc).then(() => {
            l.d("local description setted");
            const msg = ctx.signaler.createMessage({
              command: "sdp",
              body: JSON.stringify(desc)
            });
            msg.to = ctx.channel.master;
            l.d(`local offer msg: ${JSON.stringify(msg)}`);
            ctx.signaler.send(msg);
          });
        });
    },
    onCast(msg) {
      if (msg.status > 3099) {
        ctx.callEvent({
          name: "error",
          param: new EliveError({ code: msg.status, text: msg.desc })
        });
        return;
      }
      l.i(`start onCast with chid: ${msg.channel.id}`);
      ctx.channel = msg.channel;
      ctx.callEvent({ name: "onCast", param: { channel: ctx.channel } });
      ctx.role = "CASTOR";
      ctx.peerConnection = new RTCPeerConnection(
        ctx.config.rtc,
        ctx.config.rtc.opt
      );
      ctx.peerConnection.onicecandidate = handleIceCandidate;
      ctx.localStream.getTracks().forEach(track =>
        ctx.peerConnection.addTransceiver(track, {
          direction: "sendonly",
          streams: [ctx.localStream]
        })
      );
      // Array.from(ctx.peerConnection.getTransceivers()).forEach(o => (o.direction = 'sendonly'))
      ctx.peerConnection.ontrack = handleTrack;
      ctx.peerConnection.oniceconnectionstatechange = handleIceConnectionEvent;
      ctx.peerConnection.to = ctx.channel.members[0].id;
      ctx.peerConnection.onnegotiationneeded = handleRenegoEvent;
      // ctx.messaging = new Messaging(ctx)
      // ctx.messaging.startOffer()
      // ctx.dataConnection.onicecandidate = handleDcIceCandidate
      ctx.peerConnection
        .createOffer({
          offerToReceiveAudio: 0,
          offerToReceiveVideo: 0,
          voiceActivityDetection: false
        })
        .then(desc => {
          desc.sdp = replaceCodec(desc.sdp, /m=video(:?.*)?/, "H264");
          if (ctx.config.media.video.bitrate) {
            desc.sdp = setMediaBitrate(
              desc.sdp,
              "video",
              ctx.config.media.video.bitrate
            );
          }
          // desc.sdp = desc.sdp.replace('a=fmtp:111 minptime=10;useinbandfec=1',
          //   'a=fmtp:111 minptime=20;useinbandfec=1;maxaveragebitrate=256000;stereo=1;sprop-stereo=1;cbr=1')
          desc.sdp = desc.sdp.replace(
            "a=fmtp:111 minptime=10;useinbandfec=1",
            //'a=fmtp:111 minptime=20;maxaveragebitrate=128000;stereo=1;cbr=1')
            "a=fmtp:111 useinbandfec=1;minptime=10;stereo=1;cbr=1;maxaveragebitrate=128000"
          );
          l.d(`local offer: ${JSON.stringify(desc)}`);
          ctx.peerConnection.setLocalDescription(desc).then(() => {
            l.d("local description setted");
            const msg = ctx.signaler.createMessage({
              command: "sdp",
              body: JSON.stringify(desc)
            });
            msg.to = ctx.channel.members[0].id;
            ctx.signaler.send(msg);
          });
        });
      ctx.health.start();
    },
    onWatch(msg) {
      l.i(`start onWatch with chid: ${msg.channel.id}`);
      ctx.channel = msg.channel;
      ctx.callEvent({ name: "onWatch", param: { channel: ctx.channel } });
      ctx.role = "VIEWER";
      ctx.peerConnection = new RTCPeerConnection(
        ctx.config.rtc,
        ctx.config.rtc.opt
      );
      ctx.peerConnection.onicecandidate = handleIceCandidate;
      ctx.peerConnection.ontrack = handleTrack;
      ctx.peerConnection.oniceconnectionstatechange = handleViewerIceConnectionEvent;
      ctx.peerConnection.to = ctx.channel.members[0].id;
      ctx.peerConnection.onnegotiationneeded = handleRenegoEvent;
    },
    onSearch(msg) {
      l.d(`onSearch ${JSON.stringify(msg.body)}`);
      if (!msg.body) return;
      var roomList = new Set();
      msg.body.forEach(item => {
        roomList.add(item.id);
      });
      msg.body = [...roomList];
      ctx.callEvent({ name: "onSearch", param: msg.body });
    },
    pong(msg) {},
    async onSdp(msg) {
      l.d(`onSdp: ${msg.body}`);
      const desc = new RTCSessionDescription(JSON.parse(msg.body));

      ctx.peerConnection.to = msg.from;
      if (msg.pctype === "DC") {
        if (desc.type === "offer") ctx.messaging.startAnswer(desc);
        else ctx.messaging.setRemoteDesciption(desc);
        return;
      }
      ctx.peerConnection
        .setRemoteDescription(desc)
        .then(() => {
          l.i("remote description is set");
        })
        .catch(e => {
          throw new EliveError({
            code: "1300",
            text: "remote description is wrong"
          });
        });

      if (desc.type === "offer") {
        ctx.peerConnection
          .createAnswer()
          .then(desc => {
            desc.sdp = desc.sdp.replace(
              "a=fmtp:111 ",
              "a=fmtp:111 useinbandfec=1;minptime=10;stereo=1;cbr=1;maxaveragebitrate=128000"
            );
            // 'a=fmtp:111 maxaveragebitrate=128000;stereo=1;sprop-stereo=1;cbr=1;')
            ctx.peerConnection.setLocalDescription(desc).then(() => {
              l.d("local description is set");
              const msg = ctx.signaler.createMessage({
                command: "sdp",
                body: JSON.stringify(desc)
              });
              msg.to = ctx.peerConnection.to;
              ctx.signaler.send(msg);
            });
          })
          .catch(e => {
            throw new EliveError(
              { code: "1300", text: "failed to create answer" },
              e
            );
          });
      }
    },
    async onIce(msg) {
      const candidate = new RTCIceCandidate(JSON.parse(msg.body));
      l.d("candidate: ", JSON.stringify(candidate));
      if (msg.pctype && msg.pctype === "DC")
        ctx.dataConnection.addIceCandidate(candidate);
      else ctx.peerConnection.addIceCandidate(candidate);
    }
  };

  function handleEvent(event) {
    const msg = JSON.parse(event.data);
    const type = msg.command;
    l.d(`-> msg: ${msg.command}`, msg);
    sigEvents[type](msg);
  }

  function setMediaBitrate(sdp, media, bitrate) {
    var lines = sdp.split("\n");
    var line = -1;
    for (var i = 0; i < lines.length; i++) {
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
    var newLines = lines.slice(0, line);
    newLines.push("b=AS:" + bitrate);
    newLines = newLines.concat(lines.slice(line, lines.length));
    return newLines.join("\n");
  }

  function replaceCodec(sdp, mLineReg, preferCodec) {
    var mLine,
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

    for (var i = 3; i < mLineSplit.length; i++) {
      if (mLineSplit[i] !== sdpCodec) {
        newMLine.push(mLineSplit[i]);
      }
    }
    return sdp.replace(mLine, newMLine.join(" "));
  }

  function handleIceCandidate(event) {
    console.log("ice candidate is created");
    console.log(event.candidate);
    const msg = ctx.signaler.createMessage({
      command: "ice",
      body: JSON.stringify(event.candidate)
    });
    msg.to = ctx.peerConnection.to;
    ctx.signaler.send(msg);
  }

  function handleDcIceCandidate(event) {
    console.log("ice candidate for dc is created");
    console.log(event.candidate);
    const msg = ctx.signaler.createMessage({
      command: "ice",
      body: JSON.stringify(event.candidate)
    });
    msg.to = ctx.peerConnection.to;
    msg.pctype = "DC";
    ctx.signaler.send(msg);
  }

  function handleViewerIceConnectionEvent(event) {
    if (!ctx || ctx.state === "CLOSE") return;
    l.i(`ice con evt: ${ctx.peerConnection.iceConnectionState}`);
    if (ctx.peerConnection.iceConnectionState === "connected") {
      if (ctx.remoteStream.getAudioTracks().length > 1) {
        ctx.remoteMedia.srcObject = new MediaStream([
          ctx.remoteStream.getAudioTracks()[0]
        ]);
        if (ctx.remoteMedia2)
          ctx.remoteMedia2.srcObject = new MediaStream([
            ctx.remoteStream.getAudioTracks()[1]
          ]);
      } else {
        ctx.remoteMedia.srcObject = ctx.remoteStream;
      }
      ctx.state = "COMPLETE";
      ctx.startTime = new Date().getTime();
      ctx.callEvent({ name: "onComplete", param: { channel: ctx.channel } });
    } else if (ctx.peerConnection.iceConnectionState === "closed") {
      if (ctx.state !== "CLOSE") {
        ctx.elive.close();
        ctx.endTime = new Date().getTime();
        l.t(ctx, util.makeTransactionLog(ctx));
      }
    } else if (ctx.peerConnection.iceConnectionState === "failed") {
      if (ctx.state === "CLOSE") return;
      ctx.state = "FAIL";
      ctx.endTime = new Date().getTime();
      l.t(ctx, util.makeTransactionLog(ctx));
      throw new EliveError({ code: "1300", text: "ice connecting is failed" });
    } else if (ctx.peerConnection.iceConnectionState === "disconnected") {
      // 상대 peer에 의해 rtc con이 종료되었을 경우
      if (ctx.state !== "CLOSE") {
        ctx.state = "CLOSE";
        ctx.endTime = new Date().getTime();
        l.t(ctx, util.makeTransactionLog(ctx));
        //ctx.elive.close()
      }
      ctx.callEvent({ name: "onClose", param: {} });
    }
  }

  function handleIceConnectionEvent(event) {
    if (!ctx || ctx.state === "CLOSE") return;
    l.i(`ice con evt: ${ctx.peerConnection.iceConnectionState}`);
    switch (ctx.peerConnection.iceConnectionState) {
      case "connected":
        if (ctx.channel.type === "P2P") {
          ctx.signaler.close();
          ctx.isConnectToSig = false;
          ctx.remoteMedia.srcObject = ctx.remoteStream;
        }
        ctx.state = "COMPLETE";
        ctx.startTime = new Date().getTime();
        ctx.transceivers = ctx.peerConnection.getTransceivers();
        ctx.callEvent({ name: "onComplete", param: { channel: ctx.channel } });
        break;
      case "closed":
        if (ctx.state !== "CLOSE") {
          ctx.elive.close();
          ctx.endTime = new Date().getTime();
          l.t(ctx, util.makeTransactionLog(ctx));
        }
        break;
      case "failed":
        ctx.state = "FAIL";
        ctx.endTime = new Date().getTime();
        l.t(ctx, util.makeTransactionLog(ctx));
        throw new EliveError({
          code: "1300",
          text: "ice connecting is failed"
        });
        break;
      case "disconnected": // 상대 peer에 의해 rtc con이 종료되었을 경우
        if (ctx.state !== "CLOSE") {
          ctx.endTime = new Date().getTime();
          l.t(ctx, util.makeTransactionLog(ctx));
          ctx.elive.close();
        }
        break;
      default:
    }
  }

  function handleRenegoEvent(event) {
    l.w("negotiation is needed");
  }

  function handleTrack(event) {
    l.d("received track");
    console.dir(event);
    if (event.type === "track") {
      ctx.remoteStream.addTrack(event.track);
      ctx.transceivers = ctx.peerConnection.getTransceivers();
      // if (ctx.config.media.video === false) {
      //   ctx.remoteMedia.srcObject = ctx.remoteStream
      //   ctx.transceivers = ctx.peerConnection.getTransceivers()
      //   return
      // }
      // if (ctx.remoteStream.getTracks().length === 2) {
      //   ctx.remoteMedia.srcObject = ctx.remoteStream;
      //   ctx.transceivers = ctx.peerConnection.getTransceivers()
      // }
    }
  }

  function onError(event) {
    l.e(event);
  }

  ctx.signaler.onMessage(handleEvent);
}
export default SigMsgHandler;
