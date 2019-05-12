import l from "./Logger";
import ELiveError from "./Error";

export default class Messaging {
  constructor(ctx) {
    this.ctx = ctx;
    this.pc = new RTCPeerConnection(ctx.config.rtc);
    this.ctx.dataConnection = this.pc;
    this.channel;
  }

  startAnswer(desc) {
    l.i(`start answer for dc`);
    this.pc
      .setRemoteDescription(desc)
      .then(() => {
        l.d("remote description(offer) for dc is set");
      })
      .catch(e => {
        console.error(e);
        throw new ELiveError({
          code: "1300",
          text: "remote description for dc is wrong"
        });
      });

    if (desc.type === "offer") {
      this.pc
        .createAnswer()
        .then(desc => {
          this.pc.setLocalDescription(desc).then(() => {
            l.d("local description(answer) for dc is set");
            const msg = this.ctx.signaler.createMessage({
              command: "sdp",
              body: JSON.stringify(desc)
            });
            msg.to = this.ctx.peerConnection.to;
            msg.pctype = "DC";
            this.ctx.signaler.send(msg);
          });
        })
        .catch(e => {
          throw new ELiveError(
            { code: "1300", text: "failed to create answer for dc" },
            e
          );
        });
    }
  }

  close() {
    l.d(`datachannel is close`);
    this.pc.close();
    this.ctx.dataConnection = null;
    this.channel = null;
  }

  setRemoteDesciption(desc) {
    this.pc
      .setRemoteDescription(desc)
      .then(() => {
        l.i("remote description(answer) is set");
      })
      .catch(e => {
        console.error(e);
        throw new ELiveError({
          code: "1300",
          text: "remote description(answer) is wrong"
        });
      });
  }
  startOffer() {
    l.d("startOffer is started");
    this.channel = this.pc.createDataChannel("chat");
    this.channel.onopen = e => l.d("datachannel is connected");
    this.channel.onmessage = e =>
      this.ctx.callEvent({ name: "onMessage", param: e.data });

    this.pc.createOffer().then(desc => {
      this.pc.setLocalDescription(desc).then(() => {
        l.d("local description for dc is set");
        const msg = this.ctx.signaler.createMessage({
          command: "sdp",
          body: JSON.stringify(desc)
        });
        msg.to = this.ctx.channel.master;
        msg.pctype = "DC";
        l.v(msg);
        this.ctx.signaler.send(msg);
      });
    });
  }

  listening() {
    l.d("listening is started");
    this.pc.ondatachannel = event => {
      this.channel = event.channel;
      console.log(this.channel);
      this.channel.onopen = e => l.d("datachannel is connected");
      this.channel.onmessage = e =>
        this.ctx.callEvent({ name: "onMessage", param: e.data });
    };
  }

  sendMessage(msg) {
    l.d(`sendMessage: ${msg}`);
    if (this.channel) this.channel.send(msg);
  }
}
