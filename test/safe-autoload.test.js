const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const test = require("node:test");

function makeStorage(seed) {
  const values = Object.assign({}, seed);
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value) { values[key] = String(value); },
    values
  };
}

function loadController(storage) {
  const listeners = {};
  const root = {
    localStorage: storage,
    addEventListener(name, fn) { listeners[name] = fn; },
    removeEventListener(name) { delete listeners[name]; },
    setInterval() { return 1; },
    clearInterval() {},
    setTimeout() { return 2; },
    clearTimeout() {}
  };
  root.window = root;
  root.globalThis = root;
  vm.runInNewContext(fs.readFileSync("src/safe-autoload.js", "utf8"), root);
  return { Controller: root.PS4SafeAutoload, listeners };
}

test("persistent disable flag blocks automatic launch", () => {
  const storage = makeStorage({ "ps4_autoloader.disable_autoload": "1" });
  const { Controller } = loadController(storage);
  let launched = false;
  const states = [];
  const loader = new Controller({
    storage,
    launch() { launched = true; },
    onState(info) { states.push(info.state); }
  });
  loader.start();
  assert.equal(launched, false);
  assert.equal(states.at(-1), "disabled");
});

test("interrupted third attempt locks out autoload", () => {
  const storage = makeStorage({
    "ps4_autoloader.attempt_in_progress": "1",
    "ps4_autoloader.consecutive_failures": "2"
  });
  const { Controller } = loadController(storage);
  const states = [];
  const loader = new Controller({
    storage,
    launch() {},
    onState(info) { states.push(info.state); }
  });
  loader.start();
  assert.equal(storage.values["ps4_autoloader.disable_autoload"], "1");
  assert.equal(storage.values["ps4_autoloader.consecutive_failures"], "3");
  assert.equal(states.at(-1), "locked-out");
});

test("confirmed success clears failure count", () => {
  const storage = makeStorage({ "ps4_autoloader.consecutive_failures": "2" });
  const { Controller } = loadController(storage);
  let callbacks;
  const loader = new Controller({
    storage,
    launch(value) { callbacks = value; }
  });
  loader.manualLaunch();
  callbacks.success();
  assert.equal(storage.values["ps4_autoloader.consecutive_failures"], "0");
  assert.equal(storage.values["ps4_autoloader.attempt_in_progress"], "0");
});

test("manual re-enable clears lockout and failures", () => {
  const storage = makeStorage({
    "ps4_autoloader.disable_autoload": "1",
    "ps4_autoloader.consecutive_failures": "3"
  });
  const { Controller } = loadController(storage);
  const loader = new Controller({ storage, launch() {} });
  loader.reEnable();
  assert.equal(storage.values["ps4_autoloader.disable_autoload"], "0");
  assert.equal(storage.values["ps4_autoloader.consecutive_failures"], "0");
});
