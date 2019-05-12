"use strict";

const root = document.getElementById("root");

const config1 = {
  credential: {
    serviceId: "simpleapp",
    key: "27f8ca5ee273153d9a9c5944c766fa097d2e16de4dda425a"
  },
  sdk: {
    logLevel: "VERBOSE",
    mode: "dev"
  },
  view: {
    local: "localVideo1",
    remote: "remoteVideo1"
  },
  media: {
    video: { deviceId: "default" },
    audio: { deviceId: "default" }
  }
};
const config2 = {
  credential: {
    serviceId: "simpleapp",
    key: "27f8ca5ee273153d9a9c5944c766fa097d2e16de4dda425a"
  },
  sdk: {
    logLevel: "VERBOSE",
    mode: "dev"
  },
  view: {
    local: "localVideo2",
    remote: "remoteVideo2"
  },
  media: {
    video: { deviceId: "default" },
    audio: { deviceId: "default" }
  }
};
try {
  const elive1 = new ELive(config1);
  const elive2 = new ELive(config2);
  elive1.call("integrationTest");
  elive1.on("onComplete", function(msg) {
    elive1.close();
    elive2.close();
    root.innerHTML = "<p>Connected</p>";
  });
  setTimeout(function() {
    elive2.call("integrationTest");
  }, 2000);
  // root.innerHTML = '<p>Connected</p>';
} catch (e) {
  console.error(e);
  throw e;
}
