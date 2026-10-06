# Phone Cam

Use your iPhone as the camera in Discord on a Windows 11 PC. No app to install on the phone.

## Setup

**1. Install on the PC.** Download `Phone Cam Setup.exe` from the [latest release](https://github.com/Connor-Enge/Video-from-phone-to-discord-camera-software/releases/latest) and run it. Windows will say "Windows protected your PC". That is expected: click **More info**, then **Run anyway**.

**2. Scan with the phone.** Phone Cam opens with a QR code. Point the iPhone camera at it, open the link in Safari, tap **Start**, and allow the camera and microphone.

**3. Pick it in Discord.** In Discord go to **User Settings > Voice & Video > Camera** and choose **Phone Cam**. Turn your camera on in a call as usual.

That's it. Phone Cam starts with Windows and sits in the tray (the small icons next to the clock), so next time you only need to open the page on your phone and tap Start.

## Handy things

- **Skip the QR code next time.** The link never changes. In Safari tap **Share > Add to Home Screen** and open it from there.
- **Switch front and back camera** with the **Flip camera** button on the phone.
- **Change quality** (720p or 1080p) by right-clicking the Phone Cam tray icon on the PC.
- **Lost the QR code?** Right-click the tray icon and choose **Show QR**.

## Using the phone as your microphone (optional)

This needs one more free install on the PC:

1. Install [VB-CABLE](https://vb-audio.com/Cable/) and restart the PC.
2. In Discord go to **Voice & Video > Input Device** and choose **CABLE Output**.

If you skip this, the camera still works and Discord keeps using your normal microphone.

## Things to know

- **Keep Safari open and on screen.** If you switch apps or lock the phone, iPhone turns the camera off. Open Safari again and it comes back; if it does not, tap Start.
- **Phone and PC must be on the same Wi-Fi.** Guest, hotel, and dorm networks often block devices from talking to each other, and Phone Cam will not connect on those.
- **You need internet to connect**, even though the video itself never leaves your Wi-Fi.
- **One phone at a time.** If a second phone connects, it replaces the first.
- **Plug the phone in.** The screen stays on while streaming, which uses battery.
- **Anyone with your link can send video to your PC**, so do not share your QR code or link.

## If it does not work

| The phone says | Try this |
|---|---|
| No PC linked | Open the page by scanning the QR code, not by typing the address. |
| Can't find the PC | Check that Phone Cam is running on the PC (look for the tray icon) and that the PC is online. |
| Reconnecting, and never Live | Check both devices are on the same Wi-Fi and it is not a guest network. |
| Camera or microphone is blocked | On the iPhone: **Settings > Apps > Safari > Camera** and **Microphone**, set to Ask or Allow, then reload the page. |
| Live, but Discord shows "not connected" or black | In Discord, pick a different camera and then pick **Phone Cam** again. |
