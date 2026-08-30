(function (root) {
  "use strict";

  var DEFAULTS = {
    countdownSeconds: 8,
    maxFailures: 3,
    successTimeoutMs: 120000,
    storagePrefix: "ps4_autoloader."
  };

  function merge(base, extra) {
    var out = {}, key;
    for (key in base) if (Object.prototype.hasOwnProperty.call(base, key)) out[key] = base[key];
    for (key in extra) if (Object.prototype.hasOwnProperty.call(extra, key)) out[key] = extra[key];
    return out;
  }

  function SafeAutoload(options) {
    options = options || {};
    this.options = merge(DEFAULTS, options);
    this.storage = options.storage || root.localStorage;
    this.launch = options.launch;
    this.onState = options.onState || function () {};
    this.exit = options.exit || function () {};
    this.timer = null;
    this.successTimer = null;
    this.running = false;
    this.cancelled = false;
    this.keyHandler = this.handleKey.bind(this);
  }

  SafeAutoload.prototype.key = function (name) {
    return this.options.storagePrefix + name;
  };

  SafeAutoload.prototype.readBool = function (name) {
    return this.storage.getItem(this.key(name)) === "1";
  };

  SafeAutoload.prototype.readInt = function (name) {
    var value = parseInt(this.storage.getItem(this.key(name)), 10);
    return isNaN(value) ? 0 : value;
  };

  SafeAutoload.prototype.write = function (name, value) {
    this.storage.setItem(this.key(name), String(value));
  };

  SafeAutoload.prototype.isDisabled = function () {
    return this.readBool("disable_autoload");
  };

  SafeAutoload.prototype.setDisabled = function (disabled, reason) {
    this.write("disable_autoload", disabled ? "1" : "0");
    this.write("disabled_reason", disabled ? (reason || "manual") : "");
    this.onState({ state: disabled ? "disabled" : "enabled", reason: reason || "manual" });
  };

  SafeAutoload.prototype.resetFailures = function () {
    this.write("consecutive_failures", "0");
  };

  SafeAutoload.prototype.reEnable = function () {
    this.resetFailures();
    this.setDisabled(false, "manual-reenable");
  };

  SafeAutoload.prototype.handleKey = function (event) {
    var code = event.keyCode || event.which;
    var name = String(event.key || "").toLowerCase();
    // PS4 browser mappings vary by context. Keep OPTIONS configurable and
    // also accept Escape as a test/keyboard fallback.
    if (name === "options" || name === "escape" ||
        (this.options.optionsKeyCode && code === this.options.optionsKeyCode)) {
      this.cancel("options");
    }
  };

  SafeAutoload.prototype.start = function () {
    var self = this, remaining = this.options.countdownSeconds;
    if (typeof this.launch !== "function") throw new Error("A launch adapter is required");

    if (this.isDisabled()) {
      this.onState({
        state: "disabled",
        reason: this.storage.getItem(this.key("disabled_reason")) || "persistent-flag"
      });
      return;
    }

    this.cancelled = false;
    root.addEventListener("keydown", this.keyHandler, true);
    this.onState({ state: "countdown", remaining: remaining });

    this.timer = root.setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        root.clearInterval(self.timer);
        self.timer = null;
        self.beginAttempt();
      } else {
        self.onState({ state: "countdown", remaining: remaining });
      }
    }, 1000);
  };

  SafeAutoload.prototype.beginAttempt = function () {
    var self = this;
    if (this.cancelled || this.running) return;

    this.running = true;
    this.write("attempt_in_progress", "1");
    this.onState({ state: "launching" });

    this.successTimer = root.setTimeout(function () {
      self.fail("success-timeout");
    }, this.options.successTimeoutMs);

    try {
      this.launch({
        success: function () { self.succeed(); },
        failure: function (reason) { self.fail(reason || "adapter-failure"); }
      });
    } catch (error) {
      self.fail(error && error.message ? error.message : "adapter-exception");
    }
  };

  SafeAutoload.prototype.succeed = function () {
    if (!this.running) return;
    this.cleanup();
    this.running = false;
    this.write("attempt_in_progress", "0");
    this.resetFailures();
    this.onState({ state: "success" });
  };

  SafeAutoload.prototype.fail = function (reason) {
    var failures;
    if (!this.running) return;
    this.cleanup();
    this.running = false;
    this.write("attempt_in_progress", "0");
    failures = this.readInt("consecutive_failures") + 1;
    this.write("consecutive_failures", failures);

    if (failures >= this.options.maxFailures) {
      this.setDisabled(true, "failure-threshold");
      this.onState({ state: "locked-out", failures: failures, reason: reason });
    } else {
      this.onState({ state: "failure", failures: failures, reason: reason });
    }
  };

  SafeAutoload.prototype.cancel = function (reason) {
    if (this.cancelled) return;
    this.cancelled = true;
    this.cleanup();
    this.write("attempt_in_progress", "0");
    this.onState({ state: "cancelled", reason: reason || "manual" });
    this.exit();
  };

  SafeAutoload.prototype.manualLaunch = function () {
    this.cancelled = false;
    this.beginAttempt();
  };

  SafeAutoload.prototype.cleanup = function () {
    if (this.timer) root.clearInterval(this.timer);
    if (this.successTimer) root.clearTimeout(this.successTimer);
    this.timer = null;
    this.successTimer = null;
    root.removeEventListener("keydown", this.keyHandler, true);
  };

  root.PS4SafeAutoload = SafeAutoload;
}(this));
