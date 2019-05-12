"use strict";
import assert from "assert";
import Signal from "../../src/Signal";
import Context from "../../src/Context";

describe("Signal.init", () => {
  it("should check proper ctx.config.sdk.url.sig", () => {
    const ctx = new Context();
    ctx.config = { sdk: { url: {} } };
    ctx.config.sdk.url.sig = "http://wronghost.com";
    const sig = new Signal(ctx);
    ctx.signaler = sig;
    // sig.init();
  });
  it("should callback elive.on('init'... when ws is connected");
  it("should callback elive.on('error'... when ws is error");
  it("castor should receivced call back when ws is close or error");
});
