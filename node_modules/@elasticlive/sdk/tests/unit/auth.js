"use strict";
import assert from "assert";
import auth from "../../src/Auth";

describe("auth", () => {
  it("should return a context with token and urls", async () => {
    const ctx = {
      config: {
        credential: {
          key: "27f8ca5ee273153d9a9c5944c766fa097d2e16de4dda425a",
          serviceId: "simpleapp"
        },
        sdk: {
          country: "KR",
          url: { auth: "https://auth.remotemonster.com/auth" }
        },
        rtc: { iceServers: [] }
      },
      version: "3.0.0",
      purpose: "P2P"
    };
    await auth(ctx);
    assert(ctx.token, "token is not null");
    assert(ctx.config.sdk.url.sig, "sig url is not null");
    assert(ctx.config.sdk.url.channelLog, "logging url is not null");
  });
  it("should return 2200 error code without serviceid and key.");
  it("should return 2200 error code when auth server is wrong.");
  it(
    "should be okay without os, osversion, device, deviceversion and sdkversion of env."
  );
  it("should return config error without purpose field.");
  it("should contain least one both country and coachId.");
});
