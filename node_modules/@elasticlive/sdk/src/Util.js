import EliveError from "./Error";
import l from "./Logger";

const util = (() => {
  function validateConfig(ctx) {
    if (
      !ctx.config.credential ||
      !ctx.config.credential.serviceId ||
      !ctx.config.credential.key
    ) {
      // l.e('no credential data')
      // throw new EliveError({ code: "1200", text: "no credential data" });
      ctx.config.credential = {
        serviceId: "SERVICEID1",
        key: "1234567890"
      };
    }
  }

  function getMusicConfiguration() {
    return {
      mandatory: {
        googHighpassFilter: false,
        googEchoCancellation: false,
        googEchoCancellation2: false,
        googAutoGainControl: false,
        googAutoGainControl2: false,
        googNoiseSuppression: false,
        googNoiseSuppression2: false,
        googTypingNoiseDetection: false,
        echoCancellation: false
      },
      optional: [{ googCpuOveruseDetection: false }]
    };
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

  function makeTransactionLog(ctx) {
    const msg = {
      pid: ctx.token,
      svcid: ctx.config.credential.serviceId,
      cid: ctx.channel.id,
      type: ctx.channel.type,
      start_time: ctx.startTime,
      duration: Math.round((ctx.endTime - ctx.startTime) / 1000),
      network: "wifi",
      status: ctx.state
    };
    return msg;
  }

  async function validateDevices(ctx) {
    l.d("start gathering available devices");
    var curVideoDeviceId = -1,
      curAudioDeviceId = -1;
    if (ctx.config.media.video && ctx.config.media.video.deviceId)
      curVideoDeviceId = ctx.config.media.video.deviceId;
    if (ctx.config.media.audio && ctx.config.media.audio.deviceId)
      curAudioDeviceId = ctx.config.media.audio.deviceId;
    await navigator.mediaDevices.enumerateDevices().then(devices => {
      for (var i = 0; i < devices.length; i++) {
        const device = devices[i];
        if (device.kind === "videoinput") {
          var length = ctx.devices.videoInput.push({
            text: device.label,
            id: device.deviceId
          });
          if (device.deviceId === curVideoDeviceId) {
            ctx.devices.currentVideoInput = length - 1;
          }
        } else if (device.kind === "audioinput") {
          var length = ctx.devices.audioInput.push({
            text: device.label,
            id: device.deviceId
          });
          if (device.deviceId === curAudioDeviceId) {
            ctx.devices.currentAudioInput = length - 1;
          }
        } else if (device.kind === "audiooutput") {
          ctx.devices.audioOutput.push({
            text: device.label,
            id: device.deviceId
          });
        }
      }
    });
    if (
      ctx.devices.currentVideoInput === -1 &&
      ctx.devices.videoInput.length > 0
    ) {
      ctx.devices.currentVideoInput = 0;
    }
    if (
      ctx.devices.currentAudioInput === -1 &&
      ctx.devices.audioInput.length > 0
    ) {
      ctx.devices.currentAudioInput = 0;
    }
    l.v(ctx.devices);
    l.d("finish gathering available devices");
  }
  return Object.freeze({
    validateConfig,
    validateDevices,
    getMusicConfiguration,
    makeTransactionLog
  });
})();
export default util;
