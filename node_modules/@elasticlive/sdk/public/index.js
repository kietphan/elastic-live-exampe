const config = {
  credential: {
    serviceId: "simpleapp",
    key: "27f8ca5ee273153d9a9c5944c766fa097d2e16de4dda425a"
  },
  sdk: {
    logLevel: "VERBOSE",
    coachId: "KR-ELIVE-COACH-1"
    // mode: "dev"
    // audioType: 'music'
  },
  view: {
    local: "localVideo",
    remote: "remoteVideo"
  },
  audio: {
    remote: "remoteAudio"
  },
  media: {
    video: { deviceId: "default" },
    audio: { deviceId: "default" }
  }
};
const live = new ELive(config);
live.on("onDisplayUserMedia", stream => {
  console.log("success to get stream from user media");
});
live.on("init", () => {
  console.log("init is called to the app");
});
live.on("onMessage", msg => {
  console.log(`msg is ${msg}`);
});
live.on("onSearch", msg => {
  console.log(`search result is ${msg}`);
});
live.on("onComplete", msg => {
  console.log("oncomplete is called");
  document.querySelector("#switchCamera").disabled = false;
  document.querySelector("#close").disabled = false;
  document.querySelector("#captureScreen").disabled = false;
});
document.querySelector("#switchCamera").addEventListener("click", evt => {
  // If you have more than one camera, you can run the switchCamera () method
  live.switchCamera();
  evt.preventDefault();
});
document.querySelector("#captureScreen").addEventListener("click", evt => {
  live.captureScreen();
  evt.preventDefault();
});
document.querySelector("#call").addEventListener("click", evt => {
  live.call("demo");
  evt.preventDefault();
});
document.querySelector("#cast").addEventListener("click", evt => {
  live.cast("demoCast");
  evt.preventDefault();
});
document.querySelector("#view").addEventListener("click", evt => {
  live.watch("demoCast");
  evt.preventDefault();
});
document.querySelector("#Hi").addEventListener("click", evt => {
  live.sendMessage(document.querySelector("#chatbox").value);
  evt.preventDefault();
});
document.querySelector("#close").addEventListener("click", evt => {
  live.close();
  evt.preventDefault();
});
document.querySelector("#search").addEventListener("click", evt => {
  live.search();
  evt.preventDefault();
});
document.querySelector("#voiceCast").addEventListener("click", evt => {
  config.media.video = false;
  config.view.local = "localAudio";
  live = new ELive(config);
  live.cast("demoCast");
  evt.preventDefault();
});
document.querySelector("#listen").addEventListener("click", evt => {
  config.media.video = false;
  config.view.remote = "remoteAudio";
  config.view.local = "localAudio";
  live = new ELive(config);
  live.watch("demoCast");
  evt.preventDefault();
});
