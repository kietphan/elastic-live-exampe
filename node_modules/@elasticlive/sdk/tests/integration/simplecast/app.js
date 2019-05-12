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
    local: "localVideo1"
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
    remote: "remoteVideo1"
  },
  media: {
    video: { deviceId: "default" },
    audio: { deviceId: "default" }
  }
};
try {
  const elive1 = new ELive(config1);
  const elive2 = new ELive(config2);
  elive1.cast("integrationTest_cast");
  elive1.on("onComplete", function(msg) {
    elive2.watch("integrationTest_cast");
    elive2.on("onComplete", function(msg2) {
      elive2.close();
      elive1.close();
      root.innerHTML = "<p>Connected</p>";
    });
  });

  // root.innerHTML = '<p>Connected</p>';
} catch (e) {
  console.error(e);
  throw e;
}
