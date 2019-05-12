import l from "./Logger.js";

class Health {
  constructor(ctx) {
    this.interval = 5000;
    this.statsReportTimer = null;
    this.context = ctx;
  }
  stop() {
    this._clear();
  }

  start() {
    this._clear();
    this.statsReportTimer = window.setInterval(() => {
      this.context.signaler.send(
        this.context.signaler.createMessage({ command: "ping", body: {} })
      );
    }, this.interval);
  }

  _clear() {
    if (this.statsReportTimer) {
      window.clearInterval(this.statsReportTimer);
      this.statsReportTimer = null;
    }
  }
}
export default Health;
