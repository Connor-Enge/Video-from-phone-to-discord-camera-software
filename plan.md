# Phone Cam — plan

Use an iPhone as a webcam in Discord on Windows 11. Install one app on the PC, scan one QR code on the phone.

Repo: https://github.com/Connor-Enge/Video-from-phone-to-discord-camera-software

## Decisions (from Q&A)

| Question | Answer |
|---|---|
| Build or use Camo/iVCam | Build our own |
| Phone side | Safari web page, no App Store app |
| Connection | Same Wi-Fi, video goes directly phone to PC |
| Audience | Me and friends: one installer, nothing else to install |
| Phone page hosting | GitHub Pages (real HTTPS), free PeerJS cloud broker for the handshake |
| Windows | 11 only |
| PC stack | Simplest available (chosen below: Electron) |
| v1 features | Camera flip, resolution picker, phone mic as PC mic, auto-start + tray |

## How it works

```
iPhone Safari                         PeerJS cloud                Windows PC (Electron app)
docs/index.html  --- handshake --->   (signalling only)  <---    receiver window (hidden)
      |                                                                |
      +------------- WebRTC video + audio, direct over Wi-Fi --------->+
                                                                       |
                                              canvas -> BGR frames -> softcam.dll -> "Phone Cam" camera -> Discord
                                              audio  -> setSinkId  -> VB-CABLE    -> "CABLE Output" mic -> Discord
```

1. The PC app creates a random ID once (`crypto.randomUUID()`), saves it, and registers with the PeerJS broker under that ID.
2. It shows a QR code for `https://connor-enge.github.io/Video-from-phone-to-discord-camera-software/#<id>`.
3. The phone opens the page, taps Start, allows the camera, and calls that ID. The PC answers.
4. The PC draws each video frame to a canvas and pushes the pixels into the virtual camera.

The ID never changes, so after the first scan a friend can add the page to their Home Screen and never scan again. The ID is the only secret: anyone who has it can send video to that PC, so it is a UUID and the PC accepts one caller at a time.

## Stack

**Electron**, because it removes the most code:

- Chromium's WebRTC is built in and is the same PeerJS code as the phone page.
- Tray icon, start-with-Windows (`app.setLoginItemSettings`) and a one-click installer (`electron-builder`, NSIS) are built in.
- Routing audio to a chosen device is one call (`audio.setSinkId`).

Cost: the installer is about 90 MB. If that matters later, the receiver page ports to a C# + WebView2 shell.

**Virtual camera: [softcam](https://github.com/tshino/softcam)** (MIT, DirectShow). One DLL that the installer registers with `regsvr32`, with a three-function C API (`scCreateCamera`, `scSendFrame`, `scDeleteCamera`) called from Electron through `koffi` (FFI, no native build step in our repo). Windows 11's own virtual camera API was the other candidate, but it means writing and maintaining a C++ media source; softcam is prebuilt parts and also runs on Windows 11.

**Dependencies:** `electron`, `electron-builder`, `peerjs`, `koffi`, `qrcode`. Nothing else.

## Files

```
docs/index.html        phone page (GitHub Pages serves /docs); single file, PeerJS from CDN
app/main.js            tray, auto-start, window, settings
app/receiver.html      PeerJS answer side, canvas frame pump, QR code, audio sink
app/package.json       deps and scripts
app/camera.js          softcam via koffi, RGBA to BGR, self-check
app/electron-builder.yml  installer config
app/build/installer.nsh  regsvr32 softcam.dll on install, unregister on uninstall
app/vendor/softcam.dll built once from softcam source, committed
README.md              3-step setup for friends
```

## Milestones

Each one ends with a check that has to pass before the next starts.

### 0. Spike: does Discord see the camera? (do this first)
The whole project depends on it. Build softcam, `regsvr32` it, run its bundled sender example.
- **Check:** "Phone Cam" (or the sample's name) appears in Discord > Voice & Video > Camera and shows the test pattern.
- **If it fails:** swap in Unity Capture or the OBS virtual camera DLL (both DirectShow, same role). Only if all three fail, write a Windows 11 `MFCreateVirtualCamera` source.

### 1. Phone to PC video in a window
`docs/index.html` with a Start button and `getUserMedia`; `receiver.html` shows the incoming stream in a `<video>`. QR code from the saved ID.
- **Check:** scan the QR, tap Start, see the phone camera in the PC window, under about 300 ms delay.

### 2. Video into the virtual camera
Per frame (`requestVideoFrameCallback`): draw to a fixed-size canvas with letterboxing, `getImageData`, convert RGBA to BGR, `scSendFrame`.
- Run the receiver with `backgroundThrottling: false`, otherwise frames stop when the window is hidden.
- Leave row order (top-down or bottom-up) and channel order as constants at the top of the file: this is the part that comes out upside down or blue on the first try.
- When no phone is connected, send a "Phone Cam: not connected" card so Discord does not show a frozen frame.
- **Check:** Discord shows the live phone camera. Rotate the phone: picture letterboxes, nothing stretches.
- **Self-check:** one `assert`-based test of the RGBA to BGR function on a 2x2 image.

### 3. Phone controls
- Flip button: new `getUserMedia({facingMode})`, then `sender.replaceTrack`.
- Resolution (720p / 1080p): chosen in the PC tray menu, since the virtual camera's size is fixed when it is created. The PC sends the choice to the phone over the PeerJS data connection, the phone calls `track.applyConstraints`, and the PC recreates the camera at that size. Default 720p.
- `navigator.wakeLock.request('screen')` so the phone does not sleep.
- Auto-reconnect on the phone when the call drops.
- **Check:** flip and resolution change mid-call without restarting anything in Discord.

### 4. Tray, auto-start, installer
- Tray menu: Show QR, Resolution, Start with Windows, Quit. Closing the window hides to tray.
- `electron-builder` NSIS, per-machine install so the `regsvr32` step has admin rights.
- **Check:** on a clean Windows 11 machine (or VM): run the installer, reboot, tray icon is there, camera works in Discord.

### 5. Phone mic as PC mic
Windows has no way to create a microphone without a kernel audio driver, so this reuses [VB-CABLE](https://vb-audio.com/Cable/).
- Phone adds `audio: true`. The PC looks for an output device named "CABLE Input" and `setSinkId`s the call audio to it. Discord's input device is then "CABLE Output".
- If VB-CABLE is missing, the tray shows "Set up phone mic" linking to the official download. It is not bundled: redistribution needs VB-Audio's permission.
- **Check:** a friend in a Discord call hears the phone mic, with no echo of PC audio.

### 6. Ship
README with three steps (install, scan, pick "Phone Cam" in Discord), enable GitHub Pages on `/docs`, upload the installer to GitHub Releases.

## Parallel split (3 sessions)

Three sessions work in the same folder at the same time. Each owns its files and edits nothing else. Nobody commits or pushes; Connor does that.

| Session | Owns | Milestones |
|---|---|---|
| A. Phone page | `docs/index.html`, `README.md` | phone half of 1, 3, 5; README from 6 |
| B. PC app | `app/main.js`, `app/receiver.html`, `app/package.json` | PC half of 1, 3, 5; frame pump from 2; tray and auto-start from 4 |
| C. Camera and installer | `app/camera.js`, `app/camera.test.js`, `app/vendor/`, `app/electron-builder.yml`, `app/build/` | 0; softcam half of 2; installer from 4 |

If a session needs a dependency or script added to `app/package.json`, it tells Connor, who passes it to session B.

### Contract between sessions

These are fixed. A session that needs one changed stops and says so instead of changing it.

**Phone URL (A and B):** `https://connor-enge.github.io/Video-from-phone-to-discord-camera-software/#<id>`. The phone page reads the ID from `location.hash`.

**PeerJS (A and B):** both sides use the default PeerJS cloud broker with no custom config.
- PC: `new Peer(id)`, answers every incoming call with no stream of its own, and drops the previous call when a new one arrives.
- Phone: `new Peer()`, then `peer.call(id, stream)` with one video track and one audio track, and `peer.connect(id)` for a data connection.
- PC to phone over the data connection, sent on open and whenever the setting changes: `{ "type": "resolution", "height": 720 }` (720 or 1080). The phone applies it with `applyConstraints` at 16:9, 30 fps.
- Phone to PC: no messages.

**Camera module (B and C):** `app/camera.js`, loaded in the receiver window with `require('./camera')`.
- `start(width, height)`: create the virtual camera. Calling it again with a new size recreates it.
- `send(rgba)`: one frame as a `Uint8ClampedArray` of `width * height * 4` bytes, RGBA, top row first (exactly what `getImageData().data` returns). Conversion to whatever softcam wants happens inside.
- `stop()`: remove the camera.
- All three are synchronous and throw on failure.

Because the receiver window uses `require`, it runs with `nodeIntegration: true` and `contextIsolation: false`, so it must load only local files: PeerJS and the QR library come from `node_modules`, never a CDN.

**Testing without the other sessions:**
- A and B: the phone page also works in desktop Chrome from `http://localhost` with a laptop webcam, so neither needs GitHub Pages or an iPhone until the end. For that, the PC app accepts a dev override of the QR base URL through the `PHONECAM_URL` environment variable.
- B before C is finished: use a throwaway local `camera.js` whose functions do nothing, and do not keep it once C's exists.
- C before B is finished: drive `camera.js` from a small script that sends a moving colour pattern.

### Integration (after all three finish)

One session runs the whole thing: push, enable GitHub Pages on `/docs`, scan the QR with a real iPhone, confirm every milestone check from 1 to 5 in Discord, then build the installer and try it on a clean Windows 11 machine.

## Known limits (accepted for v1)

- **Mic needs a second install.** The camera is one installer; the mic also needs VB-CABLE. This is the one place "nothing else to install" does not hold.
- **SmartScreen warning.** The installer is unsigned, so friends see "Windows protected your PC" and click More info > Run anyway. Fix is a code-signing certificate (paid) when it gets annoying.
- **Safari must stay open and on screen.** iOS stops the camera when Safari is backgrounded or the phone locks. Only a native app fixes this.
- **Internet is needed to connect**, for the page and the broker. Video itself stays on the LAN. If PeerJS's free broker goes away, self-host one on a free Cloudflare Worker; the phone and PC code change by one config line.
- **Guest and dorm Wi-Fi may not work.** Networks that block device-to-device traffic need a TURN relay, which is not included.
- **Local addresses.** Chromium hides LAN IPs behind mDNS names, which Safari sometimes fails to resolve. If milestone 1 will not connect, disable it with `app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns')`.

## Not doing

USB connection, native iOS app, Android-specific work (the page will probably work in Chrome on Android anyway), Windows 10, multiple phones, recording, filters, auto-update, CI.
