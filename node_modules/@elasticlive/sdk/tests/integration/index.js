"use strict";
const { spawn } = require("child_process");
const waitForServer = require("./waitforserver");
const webdriver = require("./webdriver");

/**
 * Run a Test. Selenium will be used to navigate to the Test
 * Application and ensure twilio-video.js can be used.
 * @param {FrameworkTestOptions} options
 * @returns {void}
 * @throws {Error}
 */
function runTest(options) {
  options = getOptions(options);
  const name = options.name;
  const host = options.host;
  const port = options.port;
  const path = options.path;
  const start = options.start;
  const timeout = options.timeout;

  describe(name, function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(timeout);

    let server;
    let driver;
    before(() => {
      server = spawn(start.command, start.args, {
        cwd: path,
        detached: true,
        // eslint-disable-next-line no-process-env
        env: Object.assign({}, start.env, process.env),
        stdio: "inherit"
      });

      // NOTE(mroberts): Always test with Chrome until we can fix Firefox.
      // driver = process.env.BROWSER === 'firefox'
      //   ? webdriver.buildWebDriverForFirefox()
      //   : webdriver.buildWebDriverForChrome();
      driver = webdriver.buildWebDriverForChrome();

      return waitForServer(host, port, timeout);
    });

    after(() => {
      process.kill(-server.pid);
      return driver.quit();
    });

    beforeEach(() => {
      return driver.get(`http://${host}:${port}`);
    });

    it("Connects to and disconnects from a Room", () => {
      return waitUntilDisconnectedOrError(driver);
    });
  });
}

/**
 * Wait until the Test Application connects to and connects from a
 * {@link Room}.
 * @param {WebDriver} driver
 * @returns {Promise<void>}
 */
function waitUntilConnected(driver) {
  return webdriver.waitUntilElementLocatedAndTextMatches(
    driver,
    "p",
    /^Connected$/
  );
}

/**
 * Wait until the Test Application errors.
 * @param {WebDriver} driver
 * @returns {Promise<void>}
 */
function waitUntilError(driver) {
  return webdriver.waitUntilElementLocatedAndTextMatches(
    driver,
    "code",
    /Error/
  );
}

/**
 * Wait until the Test Application connects to and disconnects from a
 * {@link Room}, or errors. Successfully connecting to and disconnecting from a
 * {@link Room} resolves the Promise; an error rejects the Promise.
 * @param {WebDriver} driver
 * @returns {Promise<void>}
 */
function waitUntilDisconnectedOrError(driver) {
  return Promise.race([
    waitUntilConnected(driver),
    waitUntilError(driver).then(() => {
      throw new Error("Test Application errored");
    })
  ]);
}

/**
 * Get {@link FrameworkTestOptions}.
 * @param {object} options
 * @returns {FrameworkTestOptions}
 * @throws {Error}
 */
function getOptions(options) {
  options = Object.assign(
    {},
    {
      host: "localhost",
      port: 3000,
      timeout: 120000,
      start: {},
      test: {}
    },
    options
  );

  if (!options.name) {
    throw new Error("name is required");
  } else if (!options.path) {
    throw new Error("path is required");
  }

  options.start = Object.assign(
    {},
    {
      command: "npm",
      args: ["start"],
      env: {}
    },
    options.start
  );

  options.test = Object.assign(
    {},
    {
      command: "npm",
      args: ["test"],
      env: {}
    },
    options.test
  );

  return options;
}

module.exports = runTest;
