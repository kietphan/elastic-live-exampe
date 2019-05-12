import l from "./Logger";
import platform from "platform";
import EliveError from "./Error";

// import ipinfo from "ipinfo";
// ipinfo((err, cloc) => {
//   console.log(cloc.country);
// })
export default async function Auth(ctx) {
  l.d(`start auth with context`);
  const messageBody = {
    credential: {
      key: ctx.config.credential.key,
      serviceId: ctx.config.credential.serviceId
    },
    env: {
      os: platform.os.family,
      osVersion: platform.os.version || "0",
      device: platform.name,
      deviceVersion: platform.version || "0",
      sdkVersion: ctx.version,
      purpose: ctx.purpose,
      country:
        ctx.config.sdk && ctx.config.sdk.country
          ? ctx.config.sdk.country
          : "KR",
      mode: ctx.config.sdk.mode
    }
  };
  if (ctx.config.sdk.coachId) messageBody.env.coachId = ctx.config.sdk.coachId;
  const message = {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(messageBody)
  };
  try {
    const respObject = await fetch(ctx.config.sdk.url.auth, message);
    const response = await respObject.json();

    Object.keys(response).forEach(responseJsonKey => {
      switch (responseJsonKey) {
        case "iceServers":
          response[responseJsonKey].forEach(server =>
            ctx.config.rtc.iceServers.push(server)
          );
          break;
        case "token":
          ctx.token = response[responseJsonKey];
          break;
        case "coach":
          ctx.config.sdk.url.sig = response[responseJsonKey].url;
          break;
        case "channelLogUrl":
          ctx.config.sdk.url.channelLog = response[responseJsonKey];
          break;
        default:
      }
    });
  } catch (e) {
    console.error(e);
    throw new EliveError({
      code: 1600,
      text: `Auth is failed with id:${ctx.config.credential.serviceId}/ key:${
        ctx.config.credential.key
      }`
    });
  }
  if (!ctx.token)
    throw new EliveError({
      code: 1600,
      text: `failed to auth with id: ${
        ctx.config.credential.serviceId
      } and key: ${ctx.config.credential.key}`
    });
  l.d("success auth");
}
