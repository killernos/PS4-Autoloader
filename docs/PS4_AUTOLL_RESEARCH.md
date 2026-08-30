# Research: 0x1iii1ii/ps4_autoLL

Reference: https://github.com/0x1iii1ii/ps4_autoLL  
Inspected revision: `efcd77a2e00e12d5d249ea1c45b51a9799f07410`

## Finding

This project supplies a real PS4-native alternative entry path for firmware 12.00: a modified save for supported Lua-based games. Opening a compatible game causes its injected save script to load `main.lua`, establish Lua/native primitives, run Lapse, copy or reuse `payload.bin`, and terminate the game process.

Its PS4 kernel-offset table groups firmware `12.00` and `12.02` and marks that entry tested.

## What it solves

- Avoids requiring the PS4 web browser as the exploit host.
- Runs the exploit after the user launches a supported vulnerable game.
- Loads HEN/GoldHEN from USB on first use and stores it as `/data/payload.bin`.
- Detects an already-jailbroken marker to avoid rerunning the exploit.

## What it does not solve

- It does not start at console boot or user login.
- The user must open one of its supported games.
- It has only a fixed one-second wait before Lapse; there is no cancellation window.
- It does not implement an OPTIONS escape path.
- It does not count consecutive failed launches or persistently disable autoload.
- Its README describes it as early software that may contain bugs.
- The repository has no declared LICENSE file, so its source must not be copied into this repository without permission or license clarification.

## Recommended integration direction

Treat Lua-save loading as an independent entry adapter:

```text
Supported game
  -> injected save
  -> recovery gate
  -> unchanged ps4_autoLL / remote_lua_loader runtime
  -> explicit jailbreak verification
  -> payload
```

The recovery gate should run before `load_and_run_lua(... "lapse.lua")`. It must not change the exploit implementation or its offsets.

A practical first experiment on firmware 12.00 is:

1. Prepare a compatible game/save exactly as the upstream project documents.
2. Verify the unmodified upstream loader works repeatedly on the test console.
3. Identify the controller input API available to the game's Lua environment.
4. Confirm whether OPTIONS can be read before the exploit starts.
5. Identify a writable location that survives game restarts for the disable flag and failure counter.
6. Only then implement the recovery gate in a separately maintained adapter.

## Decision

Keep both entry candidates:

| Adapter | User action | 12.00 evidence | Boot/login automatic |
|---|---|---:|---:|
| WebKit host | Open browser/page | Existing known-good host | No |
| Lua-save host | Open supported game | Upstream marks offsets tested | No |

Neither reference currently demonstrates a stock PS4 mechanism that automatically opens an application immediately after login.
