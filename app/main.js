const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, shell } = require('electron')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

if (!app.requestSingleInstanceLock()) {
  app.quit()
  return
}

// The receiver plays the call with no click, and usually while hidden.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

const VBCABLE_URL = 'https://vb-audio.com/Cable/'
// Auto-start launches straight to the tray; the same args identify our login item.
const LOGIN = { args: ['--hidden'] }

const settingsFile = path.join(app.getPath('userData'), 'settings.json')
let settings = {}
try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')) } catch {}
const firstRun = !settings.id
if (firstRun) settings.id = crypto.randomUUID()
if (settings.height !== 1080) settings.height = 720
const save = () => fs.writeFileSync(settingsFile, JSON.stringify(settings))
if (firstRun) save()

let win, tray, quitting = false, hasCable = true

function showWindow() {
  win.show()
  win.focus()
}

// ponytail: drawn in code so the tray needs no image file; swap for a real .ico if the app gets one
function trayIcon() {
  const n = 32, buf = Buffer.alloc(n * n * 4)
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (Math.hypot(x - 15.5, y - 15.5) < 14) buf.writeUInt32LE(0xff3ddc84, (y * n + x) * 4)
  return nativeImage.createFromBitmap(buf, { width: n, height: n })
}

function setHeight(height) {
  settings.height = height
  save()
  win.webContents.send('resolution', height)
}

function buildMenu() {
  const resolution = (label, height) => ({
    label, type: 'radio', checked: settings.height === height, click: () => setHeight(height),
  })
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show QR', click: showWindow },
    { label: 'Resolution', submenu: [resolution('720p', 720), resolution('1080p', 1080)] },
    { label: 'Set up phone mic', visible: !hasCable, click: () => shell.openExternal(VBCABLE_URL) },
    {
      label: 'Start with Windows', type: 'checkbox',
      // unpackaged, the login item would be a bare electron.exe
      enabled: app.isPackaged,
      checked: app.getLoginItemSettings(LOGIN).openAtLogin,
      click: item => app.setLoginItemSettings({ ...LOGIN, openAtLogin: item.checked }),
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]))
}

app.on('second-instance', showWindow)
app.on('before-quit', () => { quitting = true })

app.whenReady().then(() => {
  if (firstRun && app.isPackaged) app.setLoginItemSettings({ ...LOGIN, openAtLogin: true })

  win = new BrowserWindow({
    width: 420,
    height: 680,
    show: !process.argv.includes('--hidden'),
    title: 'Phone Cam',
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false, backgroundThrottling: false },
  })
  win.removeMenu()
  // The window has Node access, so it never leaves receiver.html.
  win.webContents.on('will-navigate', e => e.preventDefault())
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.on('close', e => {
    if (quitting) return
    e.preventDefault()
    win.hide()
  })
  win.loadFile(path.join(__dirname, 'receiver.html'), { query: { id: settings.id, height: String(settings.height) } })

  tray = new Tray(trayIcon())
  tray.setToolTip('Phone Cam')
  tray.on('click', showWindow)
  buildMenu()

  ipcMain.on('cable', (_, found) => {
    hasCable = found
    buildMenu()
  })
})
