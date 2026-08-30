# Research: DrYenyen PS4 guide index

Reference: https://github.com/DrYenyen/Guide-Links-For-PS4  
Inspected revision: `9e5231ee9695c5b1baa28f215b9234a11ac9579a`

## Relevant finding

The guide indexes several PPPwn appliances described as automatic jailbreak solutions:

- Raspberry Pi / PI-Pwn
- Luckfox Pico
- OpenWRT routers

These can run automatically when the PS4 powers up because an **external device** watches or serves the PS4's PPPoE connection. They do not make the PS4 shell launch an application.

## Firmware boundary

The linked projects document PPPwn support only through PS4 firmware 11.00. The Luckfox repository explicitly describes itself as 11.00-or-below and now recommends BD-JB instead.

Therefore PPPwn automation is a useful architectural comparison but is not an entry adapter for the firmware-12.00 target.

## Recovery lessons worth retaining

External PPPwn appliances commonly provide:

- an independent enable/disable switch;
- process timeout and retry controls;
- shutdown detection;
- already-jailbroken detection;
- a hardware or web-based manual trigger.

These reinforce the recovery-first design, but their exploit and payload stages must not be imported into the 12.00 project.

## Current entry-path matrix

| Entry path | Target 12.00 | Starts after power-on without opening an app | Recovery input |
|---|---:|---:|---|
| PPPwn appliance | No | Yes, externally | Appliance switch/config |
| WebKit host | Yes | No | Browser control not verified |
| Lua-save game | Yes | No | Not implemented |
| BD-J disc | Yes | No | Circle exit verified |

## Conclusion

No link in this guide demonstrates a PS4 firmware-12.00 mechanism that automatically opens the browser, game, or BD-J Xlet at login. BD-J remains the strongest 12.00 base because it supplies persistent configuration and a verified pre-exploit exit action.
