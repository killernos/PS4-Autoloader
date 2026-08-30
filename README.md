# PS4 Autoloader

Experimental PS4 autoload orchestration project, inspired by the startup flow of [itsPLK/ps5-y2jb-autoloader](https://github.com/itsPLK/ps5-y2jb-autoloader).

> [!IMPORTANT]
> The PS5 project is a reference, not a drop-in PS4 port. Its YouTube/Cobalt entry point, offsets, kernel exploit, ELF loader, filesystem paths, and package/update format are PS5-specific.

## Goal

Build a recovery-first wrapper around an existing, known-good PS4 WebKit/Lapse host. The wrapper will:

- show a cancellation window before starting;
- allow OPTIONS or an on-screen Cancel control to stop the attempt;
- count consecutive unconfirmed launches;
- disable autoload after three unconfirmed launches;
- persist a manual `disable_autoload` flag;
- provide explicit re-enable and manual-launch controls;
- hand off to the exploit host without copying or changing its exploit runtime.

This repository does **not yet make the PS4 browser open automatically at login**. A verified PS4 launch entry point is still required for that capability. The first milestone is the safe browser-side controller and adapter contract.

## Safety rule

A launch is considered successful only when the existing exploit host explicitly calls the success callback. A page load, countdown completion, or navigation by itself is not success.

## Status

Initial architecture scaffold is being prepared on the `feat/recovery-first-scaffold` branch.

## License

MIT for original code in this repository. Referenced or integrated third-party projects retain their own licenses.
