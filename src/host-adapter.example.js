(function (root) {
  "use strict";

  // Replace this function body with the smallest possible handoff to the
  // existing PS4 exploit host. Do not copy or modify exploit internals here.
  root.launchKnownGoodPS4Host = function (callbacks) {
    var event;

    if (typeof root.startKnownGoodExploit === "function") {
      Promise.resolve(root.startKnownGoodExploit()).then(function (result) {
        if (result === true) callbacks.success();
        else callbacks.failure("exploit-did-not-confirm-success");
      }, function (error) {
        callbacks.failure(error && error.message ? error.message : "exploit-rejected");
      });
      return;
    }

    event = new CustomEvent("ps4-autoloader:launch", {
      detail: {
        success: callbacks.success,
        failure: callbacks.failure
      }
    });
    root.dispatchEvent(event);
  };
}(this));
