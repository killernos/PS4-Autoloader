# Research: BUSHIGAN/GoldHEN-Auto-Loader-AIO

Reference: https://github.com/BUSHIGAN/GoldHEN-Auto-Loader-AIO  
Inspected revision: `a9f07b03be3a3460172f2db9130698abfe654da8`

## Why this reference matters

This is a PS4 BD-J Xlet implementation with substantially more of the required recovery plumbing than the PS5 or Lua-save references:

- real DualShock/remote button events through `UserEventListener`;
- Circle exits the Xlet before exploit execution;
- persistent autoload configuration at `/data/bdj_autoload.cfg`;
- a menu control to enable or disable autoload;
- firmware routing: Lapse through 12.02 and Poops through 12.52;
- explicit PS4 12.00 offsets and patch shellcode;
- MIT license.

The user must still launch the BD-J disc. It does not start automatically when the PS4 boots or when a user signs in.

## Existing safety behavior

Upstream starts a two-second timer when persistent autoload is enabled. Circle cancels the timer and exits. Up/down resets the timer. The exploit reports a numeric result.

Missing behavior:

- five-to-ten-second recovery window;
- interrupted-attempt detection;
- consecutive-failure counter;
- automatic lockout after three failures;
- safe default after a corrupt/unreadable configuration;
- a distinct re-enable action that also clears failure state.

## Adapter supplied here

`bdj-adapter/src/org/bdj/recovery/RecoveryConfig.java` provides persistent state without modifying exploit code. It uses:

```text
/data/ps4_autoloader_recovery.cfg
```

State fields are `ENABLED`, `PENDING`, and `FAILURES`.

## Minimal upstream integration

At Xlet initialization:

```java
RecoveryConfig.State recovery = RecoveryConfig.recoverInterruptedAttempt();
autoLoadEnabled = recovery.enabled && !recovery.isLockedOut();
```

Use an eight-second countdown:

```java
countdown = 8;
```

Immediately before `Lapse.main(console)` or `Poops.main(console)`:

```java
if (!RecoveryConfig.beginAttempt()) {
    console.println("Autoload disabled after repeated failures.");
    return;
}
```

After the existing exploit returns:

```java
if (r == 0) RecoveryConfig.confirmSuccess();
else RecoveryConfig.confirmFailure();
```

When the menu enables autoload, call `RecoveryConfig.enable()`. When it disables autoload, call `RecoveryConfig.disable()`.

Circle remains the guaranteed pre-exploit escape action. OPTIONS support can be added only after its BD-J key code is confirmed on real PS4 hardware; Circle already provides a verified safe input in upstream code.

## Entry-path conclusion

| Entry | Starts exploit after | Persistent config | Verified cancel input | Boot/login automatic |
|---|---|---:|---:|---:|
| WebKit | Opening page | Browser storage | Not yet | No |
| Lua save | Opening game | Not implemented | No | No |
| BD-J AIO | Launching disc | Yes | Circle | No |

BD-J is currently the strongest base for a safe PS4 12.00 autoloader, provided the user accepts launching the disc rather than having the shell open it automatically.
