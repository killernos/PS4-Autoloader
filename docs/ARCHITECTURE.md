# Architecture

## What is reusable from the PS5 reference

| Reference behavior | PS4 design |
|---|---|
| Automatic exploit-to-payload sequence | Adapter-driven handoff to an existing PS4 host |
| Firmware detection and routing | Host-owned; never duplicated in the safety controller |
| Payload-loader readiness checks | Future PS4 adapter responsibility |
| Persistent update/config files | Deferred until a writable PS4 execution context is verified |
| UI progress reporting | State events from the recovery controller |

## What is not portable

The PS5 reference runs inside a modified YouTube/Cobalt application and depends on PS5-specific offsets, syscalls, kernel exploits, ELF loaders, sandbox paths, and update packaging. None of those components should be copied into the PS4 project.

## Recovery-first state machine

1. Read the persistent disable flag.
2. If enabled, expose only manual launch and re-enable controls.
3. Otherwise show an 8-second cancellation window.
4. OPTIONS or Cancel stops the controller before exploit handoff.
5. Mark the attempt pending immediately before handoff.
6. Accept success only through an explicit host callback.
7. Increment failures on an explicit failure or timeout.
8. At three consecutive failures, persistently disable autoload.
9. Clear the failure count only after confirmed success or manual re-enable.

## Integration contract

The host adapter receives:

```js
{
  success: function () {},
  failure: function (reason) {}
}
```

The existing PS4 host must call exactly one callback. Navigation or countdown completion is not proof of success.

## Open hardware/firmware question

Browser-side JavaScript cannot make the stock PS4 shell open the browser at user login. That requires a separate, verified PS4 entry mechanism. Until one is identified and tested on firmware 12.00, this project must describe itself as the safe controller that runs once its page is opened—not as boot-complete autoload.
