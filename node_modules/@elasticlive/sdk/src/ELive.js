"use strict";
import platform from "platform";
import deepmerge from "deepmerge";
import EventEmitter from "events";

import Context from "./Context";
import Signal from "./Signal";
import ELiveError from "./Error";
import auth from "./Auth";
import Config from "./Config";
import l from "./Logger";
import util from "./Util";
import Device from "./Device";
import Health from "./Health";

/**
 * <p>Main class for ElasticLive. It can help to make P2P call and broadcast room. It can also join the broadcast room and adjust constraints.</p>
 * <p>The order of using ELive is as follows.
 * <ul><li>Create a Config object.</li>
 * <li>Create an ELive object.</li>
 * <li>Call the call () method for communication, call the cast () method for creating a broadcast, and call the watch method when watching a broadcast.</li>
 * <li>Execute callback with elive.on ('event').</li>
 * <li>Exit the ELive object. by close ()</li>
 * </p>
 * <h1>Callback events</h1>
 * <p>ELive callback events include the following.</p>
 * <li>onDisplayUserMedia: event that occurs when taking control of the local media device.</li>
 * <li>onCall: event that occurs when the call method is succeeds. If the other peer is not yet connected, real connection is established when the onComplete event.</li>
 * <li>onComplete: event that occurs when two peers connect to each other via the call method with same room name.</li>
 * <li>onCast: event that occurs when the cast method is succeeds.</li>
 * <li>onWatch: event that occurs when the watch method is succeeds.</li>
 * <li>onMessage: event that occurs when the other peer send a message to this peer.</li>
 * <li>onSearch: event that occurs when the search methos is succeeds.</li>
 * <h1>Basic example</h1>
 * @example
 * const elive = new ELive({...})
 * elive.call('demo')
 * elive.on('onCall|onCast|onWatch|onComplete', (msg) => {})
 * ...
 * elive.close()
 *
 */
class ELive extends EventEmitter {
  /**
   * Constructor of ELive
   * @example
   * const elive = new ELive({
   *  confidential:{
   *    serviceId:'dummyId',
   *    key:'dummyKey'
   *  },
   *  view:{
   *    local: 'localVideo',
   *    remote: 'remoteVideo'
   *  }
   * })
   *
   * @param {config} config - please refer the config page
   */
  constructor(config) {
    super();
    try {
      /**@ignore */
      this.version = __VERSION__;
    } catch (e) {}
    if (!config)
      throw new ELiveError({ code: "1200", text: "no config object" });
    // if (config.sdk && config.sdk.mode === "dev")
    //   config.sdk.url = { sig: "ws://localhost:1235/sig" };
    /**@ignore */
    this.ctx = new Context();
    this.ctx.version = this.version;
    this.ctx.elive = this;
    this.ctx.config = deepmerge(Config, config);
    l.init(this.ctx);
    this.ctx.callEvent = this.onEvent;
    /**@ignore */
    this.devManager = new Device(this.ctx);
    this.ctx.signaler = new Signal(this.ctx);
    if (this.ctx.config.sdk.audioType === "music") {
      this.ctx.config.rtc.opt = util.getMusicConfiguration();
    }
    util.validateConfig(this.ctx);
    this.search = this.search.bind(this);
    this.ctx.health = new Health(this.ctx);
  }

  //// main functions
  /**
   * Create or join a 1:1 room.
   * You can receive a 'onCall' and 'onComplete' callback events.
   * @param {string} name - name of 1:1 room
   */
  async call(name) {
    if (!this.ctx.remoteStream) this.ctx.remoteStream = new MediaStream();
    this.ctx.purpose = "P2P";
    if (this.ctx.devices.audioInput.length == 0)
      await this.devManager.validateDevices();
    await auth(this.ctx);
    await this.devManager.showLocalVideo();
    await this.ctx.signaler.init();
    this.ctx.signaler.call(name);
    // make sendrecv room for call
    l.d(`finish to call the ${name} room`);
  }

  /**
   * Create a broadcast room.
   * You can receive a 'onCast' callback event.
   * @param {string} name - name of broadcast room
   */
  async cast(name) {
    if (!this.ctx.localStream) this.ctx.localStream = new MediaStream();
    this.ctx.purpose = "CAST";
    if (this.ctx.devices.audioInput.length == 0)
      await this.devManager.validateDevices();
    await auth(this.ctx);
    await this.devManager.showLocalVideo();
    await this.ctx.signaler.init();
    this.ctx.signaler.cast(name);
    l.d(`finish to cast the ${name} room`);
  }

  /**
   * Participate to a broadcast room as a viewer.
   * You can receive a 'onWatch' callback event.
   * @param {string} name - name of broadcast room
   */
  async watch(name) {
    if (!this.ctx.remoteStream) this.ctx.remoteStream = new MediaStream();
    this.ctx.purpose = "CAST";
    this.ctx.remoteMedia = document.querySelector(
      "#" + this.ctx.config.view.remote
    );
    // this.ctx.remoteMedia2 = document.querySelector(
    //   "#" + this.ctx.config.view.remote2
    // );
    await auth(this.ctx);
    await this.ctx.signaler.init();
    this.ctx.signaler.watch(name);
    l.d(`finish to call the ${name} room`);
  }

  /**
   * Close all connection
   */
  async close() {
    if (this.ctx.state === "CLOSE" && this.ctx.peerConnection === null) return;
    this.ctx.state = "CLOSE";
    this.ctx.endTime = new Date().getTime();
    l.t(this.ctx, util.makeTransactionLog(this.ctx));
    this.ctx.isConnectToSig = false;
    if (this.ctx.messaging) this.ctx.messaging.close();
    this.ctx.signaler.close();
    if (this.ctx.peerConnection)
      await this.ctx.peerConnection
        .getTransceivers()
        .forEach(t => (t.direction = "inactive"));
    if (!this.ctx.peerConnection) return;
    this.ctx.peerConnection.close();
    this.ctx.peerConnection = null;
    if (this.ctx.remoteStream)
      this.ctx.remoteStream
        .getTracks()
        .forEach(t => this.ctx.remoteStream.removeTrack(t));
    this.ctx.transceivers = null;
    this.ctx.callEvent({
      name: "onClose",
      param: { channel: this.ctx.channel }
    });
    this.ctx.health.stop();
  }

  /**
   * Send a message to a peer. It can be used for text messaging and data transfer.
   * It is only available in P2P mode yet.
   * @param {string} msg
   */
  sendMessage(msg) {
    this.ctx.messaging.sendMessage(msg);
  }
  /**
   * <p>Method for callback event to sdk users.</p>
   * <p>ELive callback events include the following.</p>
   * <li>onDisplayUserMedia: event that occurs when taking control of the local media device.</li>
   * <li>onCall: event that occurs when the call method is succeeds. If the other peer is not yet connected, real connection is established when the onComplete event.</li>
   * <li>onComplete: event that occurs when two peers connect to each other via the call method with same room name.</li>
   * <li>onCast: event that occurs when the cast method is succeeds.</li>
   * <li>onWatch: event that occurs when the watch method is succeeds.</li>
   * <li>onMessage: event that occurs when the other peer send a message to this peer.</li>
   * <li>onSearch: event that occurs when the search methos is succeeds.</li>
   * @param {EventEmitter.message} message
   */
  onEvent(message) {
    this.elive.emit(message.name, message.param);
  }

  //// functions for configurations
  setVideoQuality(quality) {}
  /// local video
  /** Set the framerate value. It is selectable from 10 to 30. */
  setFrameRate(frameRate) {
    this.devManager.setFrameRate(frameRate);
  }
  /** Set the resolution value. It is selectable from 240p to 1280p. Default value is a (640,480) */
  setResolution(width, height) {
    this.devManager.setResolution(width, height);
  }
  /// local audio
  /** Set the AutoGainControl value. Default value is a true. */
  setAgc(isAgc) {
    this.devManager.setAgc(isAgc);
  }
  /** Set the number of audio channel. Default value is 2. */
  setChannelCount(count) {
    this.devManager.setChannelCount(count);
  }
  /** Set the echo canellation value. Default value is a true. */
  setEchoCancellation(isAec) {
    this.devManager.setEchoCancellation(isAec);
  }
  /** Set the echo latency of audio. */
  setLatency(latency) {
    this.devManager.setLatency(latency);
  }
  /** Set the noise suppression value. Default value is a true. */
  setNoiseSuppression(ns) {
    this.devManager.setNoiseSuppression(ns);
  }
  setSampleSize(sampleSize) {
    this.devManager.setSampleSize(sampleSize);
  }
  setSampleRate(sampleRate) {
    this.devManager.setSampleRate(sampleRate);
  }
  /** volume value should be number from 0.0 to 1.0. */
  setVolume(volume) {
    this.devManager.setVolume(volume);
  }

  //// device management functions
  /** Capture the screen and use it as the source of local media. */
  async captureScreen() {
    this.devManager.captureScreen();
  }
  /** Stop the captureScreen */
  stopCaptureScreen() {
    this.devManager.stopCaptureScreen();
  }
  /** Use a specific video input device as local media. You can gather a device list from getDevices()*/
  async setVideoInput(deviceId) {
    if (this.ctx.devices.audioInput.length == 0)
      await this.devManager.validateDevices();
    this.devManager.setVideoInput(deviceId);
  }
  /** Use a specific audio input device as local media. You can gather a device list from getDevices()*/
  async setAudioInput(deviceId) {
    if (this.ctx.devices.audioInput.length == 0)
      await this.devManager.validateDevices();
    this.devManager.setAudioInput(deviceId);
  }
  /** Use this when you want to display the local input device in the local video tag before calling call or cast method. */
  async showLocalVideo(deviceId) {
    if (this.ctx.devices.audioInput.length == 0)
      await this.devManager.validateDevices();
    await this.devManager.showLocalVideo(deviceId);
  }
  /** If there is more than one camera, switch it. */
  async switchCamera() {
    if (this.ctx.devices.audioInput.length == 0)
      await this.devManager.validateDevices();
    this.devManager.switchCamera();
  }
  /**
   * Mute remote media
   * @param {boolean} isMute
   */
  muteRemote(isMute) {
    this.devManager.muteRemote(isMute);
  }
  /**
   * Mute local media
   * @param {boolean} isMute
   */
  muteLocal(isMute) {
    this.devManager.muteLocal(isMute);
  }

  /** Get list of all local media devices such as video, speaker and mic. */
  getDevices() {
    return this.ctx.devices;
  }

  //// functions for information
  /** Get the quality of the stream realtime. WebRTC is variable in quality depending on network conditions.*/
  getHealth() {}
  getState() {}
  /** Get a room id */
  getRoomId() {
    return this.ctx.channel.id;
  }

  /**
   * Search the room of the current service. If there is no parameter, it searches all rooms of the service.
   * @param {string} id - search keyword for room
   */
  async search(id) {
    this.ctx.purpose = "CAST";
    if (!this.ctx) return;
    if (this.ctx.signaler && !this.ctx.isConnectToSig) {
      await auth(this.ctx);
      await this.ctx.signaler.init();
    }
    if (this.ctx && this.ctx.signaler) this.ctx.signaler.search(id);
  }

  status() {
    var status = {
      version: this.version,
      platform: platform.name,
      platformVersion: platform.version
    };
    return status;
  }
}
try {
  ELive.version = __VERSION__;
  ELive.env = __ENV__;
} catch (e) {
  ELive.version = "3.0.0";
  ELive.env = {};
}

export default ELive;
