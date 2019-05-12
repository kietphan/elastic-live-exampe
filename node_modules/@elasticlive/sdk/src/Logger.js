const logger = (() => {
  const logLevelPreset = [
    "SILENT",
    "ERROR",
    "WARN",
    "INFO",
    "DEBUG",
    "VERBOSE"
  ];
  let level;
  let ctx;
  let url;

  function init(c) {
    ctx = c;
    level = ctx.config.sdk.logLevel;
    url = ctx.config.sdk.url.log;
  }

  /**
   * Log a ERROR message to console log
   */
  function e(...message) {
    if (level === "SILENT") {
      return;
    }
    console.error(...message);
  }

  /**
   * Log a WARN message to console log.
   * @param  {...any} message
   */
  function w(...message) {
    if (level === "SILENT" || level === "ERROR") {
      return;
    }
    console.warn(...message);
  }

  /**
   * Log a INFO message to console.log. It is default level.
   * @param  {...any} message
   */
  function l(...message) {
    i(...message);
  }

  /**
   * Log a INFO message to console log. It is default level.
   * @param  {...any} message
   */
  function i(...message) {
    if (level === "SILENT" || level === "ERROR" || level === "WARN") {
      return;
    }
    console.info(...message);
  }

  /**
   * Log a transaction message to elasticlive server.
   * @param {*} ctx
   * @param {*} message
   */
  function t(ctx, message) {
    if (ctx.role === "CALLER" || ctx.role === "CASTOR") return;
    fetch(ctx.config.sdk.url.channelLog, {
      method: "POST",
      body: JSON.stringify(message),
      headers: { "Content-Type": "application/json" }
    }).catch(e => {
      console.error(e);
    });
  }

  /**
   * Log a message to elasticlive log server
   * @param  {...any} message
   */
  function evt(message, errorCode) {
    const evtMsg = {
      topic: "log",
      messages: {
        log: message,
        logLevel: errorCode ? "error" : "info",
        sdkVersion: ctx.version,
        svcId: ctx.serviceId,
        pId: ctx.token,
        chId: ctx.channel.id,
        errorCode: errorCode || "2000"
      }
    };
    fetch(ctx.config.sdk.url.log, {
      method: "PUT",
      mode: "cors",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(evtMsg)
    });
  }

  /**
   * Log a debug message to console log
   * @param  {...any} message
   */
  function d(...message) {
    if (
      level === "SILENT" ||
      level === "ERROR" ||
      level === "WARN" ||
      level === "INFO"
    ) {
      return;
    }
    console.debug(...message);
  }
  /**
   * Log a verbose message to console log. It is most detailed log method.
   * @param  {...any} object
   */
  function v(...object) {
    if (
      level === "SILENT" ||
      level === "ERROR" ||
      level === "WARN" ||
      level === "INFO" ||
      level === "DEBUG"
    ) {
      return;
    }
    console.trace(...object);
  }

  return Object.freeze({
    init,
    e,
    w,
    l,
    i,
    d,
    v,
    t,
    evt
  });
})();

export default logger;
