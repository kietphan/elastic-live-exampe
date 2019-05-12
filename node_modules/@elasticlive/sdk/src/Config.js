/**
 * <h1>schema of config</h1>
 * @example
 * {
 *  // credential is an authentication information from ELive.
 *  // It consists of the serviceId and key.
 *  credential: {
 *    serviceId: 'dummyid',
 *    key: 'dummykey'
 *  },
 *  // view is a set of tags that will execute media on an HTML document.
 *  // You can define a video tag or an audio tag for local and remote.
 *  // If you want to specify the stream itself rather than the tag, use localStream.
 *  view: {
 *    local: 'localVideoTagId'|'localAudioTagId'
 *    remote: 'remoteVideoTagId'|'remoteAudioTagId'
 *    localStream: 'localStreamFromCanvas'
 *  },
 *  // You can use 'rtc' when you'd like to set specifically for the WebRTC PeerConnection constructor option used by ELive.
 *  // please refer to https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection#RTCConfiguration_dictionary
 *  rtc: {
 *    iceServers: {}
 *    opt: {}
 *    dataOpt: {}
 *  },
 *  // You can use 'media' when you'd like to set specifically for the HTML5 GetUserMedia method option used by ELive.
 *  // Please refer to https://developer.mozilla.org/en/docs/Web/API/MediaStreamConstraints
 *  media: {
 *    video: true,
 *    audio: true
 *  },
 *  // 'sdk' is an option for developers and some special features.
 *  sdk: {
 *    logLevel: 'ERROR|WARN|INFO|DEBUG|TRACE',
 *    // default value is 'voice'.
 *    // Set it to music so that you can hear a variety of sounds, such as music, rather than a human voice.
 *    audioType: 'voice|music',
 *    mode: 'dev|prod' // When you want to test it on localhost, change to dev mode.
 *  }
 * }
 * </code></pre>
 */
var config = (() => {
  return {
    credential: {
      serviceId: undefined,
      key: undefined
    },
    view: {
      local: undefined,
      remote: undefined,
      remote2: undefined
    },
    rtc: {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      opt: {},
      dataOpt: {
        optional: [
          {
            RtpDataChannels: true
          }
        ]
      },
      sdpSemantics: "unified-plan"
    },
    media: {
      // correspond to getusermedia option format
      video: { frameRate: { min: 20, max: 30 } },
      audio: { channelCount: 2 }
    },
    sdk: {
      url: {
        // sig: "wss://signal.remotemonster.com/ws",
        // sig: "wss://demo.remotemonster.com/sig",
        auth: "https://auth.remotemonster.com/auth",
        // auth: "https://signal.remotemonster.com/rest/init",
        log: "https://signal.remotemonster.com:2001/topics",
        channelLog: ""
      },
      logLevel: "INFO",
      audioType: "voice",
      mode: "prod",
      coachId: undefined, // if defined, it is a primary coach.
      country: undefined // default: 'KR'
    }
  };
})();
export default config;
