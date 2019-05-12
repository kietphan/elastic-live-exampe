import ELiveError from "./Error";
import l from "./Logger";

export default class Device {
  constructor(ctx) {
    this.ctx = ctx;
  }

  async captureScreen() {
    this.ctx.localStream = await navigator.mediaDevices.getDisplayMedia({
      video: true
    });
    this.ctx.transceivers[1].sender.replaceTrack(
      this.ctx.localStream.getTracks()[0]
    );
    this.ctx.localStream.addTrack(this.ctx.transceivers[0].sender.track);
    this.ctx.localVideo.srcObject = this.ctx.localStream;
  }

  stopCaptureScreen() {
    showLocalVideo();
  }

  async validateDevices() {
    l.d("start gathering available devices");
    var curVideoDeviceId = -1,
      curAudioDeviceId = -1;
    if (this.ctx.config.media.video && this.ctx.config.media.video.deviceId)
      curVideoDeviceId = this.ctx.config.media.video.deviceId;
    if (this.ctx.config.media.audio && this.ctx.config.media.audio.deviceId)
      curAudioDeviceId = this.ctx.config.media.audio.deviceId;

    await navigator.mediaDevices.enumerateDevices().then(devices => {
      for (var i = 0; i < devices.length; i++) {
        const device = devices[i];
        if (device.kind === "videoinput") {
          var length = this.ctx.devices.videoInput.push({
            text: device.label,
            id: device.deviceId
          });
          if (device.deviceId === curVideoDeviceId) {
            this.ctx.devices.currentVideoInput = length - 1;
          }
        } else if (device.kind === "audioinput") {
          var length = this.ctx.devices.audioInput.push({
            text: device.label,
            id: device.deviceId
          });
          if (device.deviceId === curAudioDeviceId) {
            this.ctx.devices.currentAudioInput = length - 1;
          }
        } else if (device.kind === "audiooutput") {
          this.ctx.devices.audioOutput.push({
            text: device.label,
            id: device.deviceId
          });
        }
      }
    });
    if (
      this.ctx.devices.videoInput.length === 0 ||
      this.ctx.devices.audioInput.length === 0
    ) {
      throw new ELiveError({ code: "1500", text: "there is no input device" });
    }
    if (
      this.ctx.devices.currentVideoInput === -1 &&
      this.ctx.devices.videoInput.length > 0
    ) {
      this.ctx.devices.currentVideoInput = 0;
    }
    if (
      this.ctx.devices.currentAudioInput === -1 &&
      this.ctx.devices.audioInput.length > 0
    ) {
      this.ctx.devices.currentAudioInput = 0;
    }
    if (document.querySelector("#" + this.ctx.config.view.local))
      this.ctx.localVideo = document.querySelector(
        "#" + this.ctx.config.view.local
      );
    if (document.querySelector("#" + this.ctx.config.view.remote)) {
      this.ctx.remoteMedia = document.querySelector(
        "#" + this.ctx.config.view.remote
      );
    }
    if (document.querySelector("#" + this.ctx.config.view.remote2)) {
      this.ctx.remoteMedia2 = document.querySelector(
        "#" + this.ctx.config.view.remote2
      );
    }
    l.d(
      "finish gathering available devices: ${JSON.stringify(this.ctx.devices)}"
    );
  }

  setVideoInput(deviceId) {
    l.d("start to set video input with " + deviceId);
    const devNumber = this.findDevice(deviceId, this.ctx.devices.videoInput);
    if (devNumber == -1) {
      throw new ELiveError({
        code: "1500",
        text: "incorrect video device. input a right video device id."
      });
      return;
    }
    this.ctx.devices.currentVideoInput = devNumber;
    this.ctx.config.media.video.deviceId = this.ctx.devices.videoInput[
      devNumber
    ].id;
    l.d("finish to set video input with " + deviceId);
  }

  setAudioInput(deviceId) {
    l.d("start to set audio input with " + deviceId);
    const devNumber = this.findDevice(deviceId, this.ctx.devices.audioInput);
    if (devNumber == -1) {
      throw new ELiveError({
        code: "1500",
        text: "incorrect audio device. input a right audio device id."
      });
      return;
    }
    this.ctx.devices.currentAudioInput = devNumber;
    this.ctx.config.media.audio.deviceId = this.ctx.devices.audioInput[
      devNumber
    ].id;
    l.d("finish to set audio input with " + deviceId);
  }

  async switchCamera() {
    l.d("start to switch camera");
    if (this.ctx.devices.videoInput.length < 2) return;
    if (
      ++this.ctx.devices.currentVideoInput ===
      this.ctx.devices.videoInput.length
    )
      this.ctx.devices.currentVideoInput = 0;
    this.showLocalVideo(
      this.ctx.devices.videoInput[this.ctx.devices.currentVideoInput].id
    );
    this.ctx.config.media.video.deviceId = {
      exact: [
        this.ctx.devices.videoInput[this.ctx.devices.currentVideoInput].id
      ]
    };
    l.d("finish to switch camera");
  }

  muteRemote(isMute) {
    if (!this.ctx.transceivers) return;
    this.ctx.transceivers[1].receiver.track.enabled = !isMute;
    this.ctx.transceivers[0].receiver.track.enabled = !isMute;
  }
  muteLocal(isMute) {
    if (!this.ctx.transceivers) return;
    this.ctx.transceivers[1].sender.track.enabled = !isMute;
    this.ctx.transceivers[0].sender.track.enabled = !isMute;
  }

  async showLocalVideo(deviceId) {
    l.d(`start to show localvideo with dev id ${deviceId}`);
    var stream;
    if (deviceId) {
      this.setVideoInput(deviceId);
    }
    stream = await navigator.mediaDevices.getUserMedia(this.ctx.config.media);
    if (!stream)
      throw new ELiveError({ code: "1500", text: "can not get user media" });
    // if (this.ctx.config.media.video && this.ctx.config.media.video !==false) {
    this.ctx.localVideo.srcObject = stream; //localVideo는 이제 localMedia로 이름을 바꾸는 것이 나을 듯.
    // }
    this.ctx.localStream = stream;
    this.ctx.callEvent({ name: "onDisplayUserMedia", param: stream });
    // this.ctx.evtMgr.dispatchEvent('onEvent', {name:'onDisplayUserMedia', param: stream, ctx: this.ctx})
    if (this.ctx.transceivers !== null && this.ctx.transceivers.length > 1) {
      this.ctx.transceivers[1].sender.replaceTrack(
        this.ctx.localStream.getVideoTracks()[0]
      );
    }
    l.d(`finish to show localvideo with dev id ${deviceId}`);
  }

  findDevice(deviceId, devlist) {
    l.d(`start find device ${deviceId}`);
    for (var i = 0; i < devlist.length; i++) {
      const dev = devlist[i];
      if (dev.id === deviceId) return i;
    }
    l.d(`finish find device ${deviceId}`);
    return -1;
  }

  setResolution(width, height) {
    this.ctx.config.media.video.width = width;
    this.ctx.config.media.video.height = height;
    this.applyRuntime("video");
  }

  setFrameRate(frameRate) {
    this.ctx.config.media.video.frameRate = frameRate;
    this.applyRuntime("video");
  }
  // setVolume(volume) {this.devManager.setVolume(volume)}
  setAgc(isAgc) {
    this.ctx.config.media.audio.autoGainControl = isAgc;
    this.applyRuntime("audio");
  }
  setChannelCount(count) {
    this.ctx.config.media.audio.channelCount = count;
    this.applyRuntime("audio");
  }
  setEchoCancellation(isAec) {
    this.ctx.config.media.audio.echoCancellation = isAec;
    this.applyRuntime("audio");
  }
  setLatency(latency) {
    this.ctx.config.media.audio.latency = latency;
    this.applyRuntime("audio");
  }
  setNoiseSuppression(ns) {
    this.ctx.config.media.audio.noiseSuppression = ns;
    this.applyRuntime("audio");
  }
  setSampleRate(sampleRate) {
    this.ctx.config.media.audio.sampleRate = sampleRate;
    this.applyRuntime("audio");
  }
  setSampleSize(sampleSize) {
    this.ctx.config.media.audio.sampleSize = sampleSize;
    this.applyRuntime("audio");
  }
  setVolume(volume) {
    this.ctx.config.media.audio.volume = sampleRate;
    this.applyRuntime("audio");
    if (this.ctx.transceivers)
      this.ctx.transceivers[0].receiver.track.applyConstraints({
        volume: volume
      });
  }
  applyRuntime(audioOrVideo) {
    if (this.ctx.transceivers)
      if (audioOrVideo === "video")
        this.ctx.transceivers[1].sender.track.applyConstraints(
          this.ctx.config.media.video
        );
      else if (audioOrVideo === "audio")
        this.ctx.transceivers[0].sender.track.applyConstraints(
          this.ctx.config.media.audio
        );
  }
}
