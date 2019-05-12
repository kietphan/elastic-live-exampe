"use strict";
import EventEmitter from "events";
import SigMsgHandler from "./SigMsgHandler";
import l from "./Logger";
import ELiveError from "./Error";

class Signal extends EventEmitter {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.onMessageHandler = null;
    this.ws;
    this.MAX_RETRIES = 11;
  }
  init() {
    l.d("start signaler init");
    this.ctx.isConnectToSig = false;
    this.ctx.sigMsgHandler = SigMsgHandler(this.ctx);
    this.ws = new WebSocket(this.ctx.config.sdk.url.sig);
    this.ws.onopen = () => {
      l.i("Sig: success connect to sig server");
      this.ctx.isConnectToSig = true;
      this.ctx.callEvent({ name: "init", param: {} });
    };
    this.ws.onerror = e => {
      throw new ELiveError({ code: "1400", text: "websocket is failed" }, e);
    };
    this.ws.onclose = e => {
      l.i("websocket is closed");
    };
    this.ws.onmessage = this.onMessageHandler;
    l.d("finished signaler init");
  }

  onMessage(handler) {
    this.onMessageHandler = handler;
  }

  async call(roomId) {
    await this._sendCommand("call", roomId, "P2P");
  }

  async cast(roomId) {
    await this._sendCommand("cast", roomId, "BROADCAST");
  }

  async watch(roomId) {
    await this._sendCommand("watch", roomId, "BROADCAST");
  }

  async search(id) {
    await this.waitForConnection();
    const msg = this.createMessage({ command: "search" });
    this.send(msg);
  }

  async _sendCommand(command, roomId, type) {
    await this.waitForConnection();
    l.i("start " + command);
    this.ctx.channel.id = roomId;
    this.ctx.channel.type = type;
    const msg = this.createMessage({ command });
    l.v(msg);
    this.send(msg);
  }

  send(msg) {
    const m = JSON.stringify(msg);
    if (!this.ws) return;
    try {
      this.ws.send(m);
    } catch (e) {
      throw new ELiveError({ code: "1400", text: "send error" }, e);
    }
  }

  close() {
    l.d("signaler is close");
    this.ws.close();
    this.ctx.isConnectToSig = false;
  }

  createMessage({ command, body }) {
    return {
      command,
      token: this.ctx.token,
      serviceId: this.ctx.config.credential.serviceId,
      channel: this.ctx.channel,
      body
    };
  }
  async waitForConnection() {
    for (let i = 5; i <= this.MAX_RETRIES; i++) {
      if (this.ctx.isConnectToSig === true) {
        return;
      } else {
        const timeout = Math.pow(2, i);
        l.d("wating for init %i", i);
        await this.wait(timeout);
      }
    }
  }
  wait(timeout) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, timeout);
    });
  }
}

export default Signal;
// module.exports.Signal;
