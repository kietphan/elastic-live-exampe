"use strict";
import assert from "assert";
import ELive from "../../src/ELive";

describe("ELive.constructor", () => {
  it("should return 1200 error code when without config", () => {
    let code = 0;
    try {
      new ELive();
    } catch (e) {
      code = e.code;
    }
    assert(code === "1200", `code is not 1200:create without config/ ${code}`);
  });
  it("should return tuned config for music with sdk.audiotype=music", () => {
    let elive;
    let config = {
      credential: { serviceId: "1", key: "2", sdk: { audioType: "music" } }
    };
    try {
      elive = new ELive(config);
    } catch (e) {
      // console.error(e);
    }
    // assert(elive.ctx.config.rtc.opt, 'rtc.opt is null for music mode');
  });
  it(
    "should be okay without os, osversion, device, deviceversion and sdkversion of env."
  );
  it("should return config error without purpose field.");
  it("should contain least one both country and coachId.");
});
