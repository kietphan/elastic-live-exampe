export default class Context {
  constructor() {
    this.token;
    this.serviceId;
    this.config;
    this.version;
    this.channel = {
      id: undefined,
      name: undefined,
      peers: [],
      startTime: undefined,
      status: undefined,
      type: undefined, // P2P, CAST, VIEW
      members: []
    };
    this.localVideo;
    this.remoteMedia;
    this.remoteMedia2;
    this.localStream; // = new MediaStream();
    this.remoteStream; // = new MediaStream();
    this.transceivers = null;
    this.devices = {
      currentVideoInput: -1,
      currentAudioInput: -1,
      videoInput: [],
      audioInput: [],
      audioOutput: []
    };
    this.peerConnection;
    this.dataConnection;
    this.state; // INIT, WAIT, CONNECT, COMPLETE, CLOSE, FAIL
    this.isConnectToSig = false;

    this.elive;
    this.callEvent; // 내부 이벤트를 API 외부에 전달위한 메소드. name, param 으로 이루어짐
    this.eventManager;
    this.mediaManager;
    this.signaler;
    this.messaging;

    this.country = undefined;
    this.purpose = "P2P";
    this.startTime = 0;
    this.endTime = 0;
    this.health = undefined;
  }
}
