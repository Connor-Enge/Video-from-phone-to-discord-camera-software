const koffi = require('koffi')
const path = require('path')

// softcam takes 24-bit pixels. If the picture comes out blue-tinted or upside down, flip these.
const BLUE_FIRST = true // byte order B, G, R
const TOP_DOWN = true // first row sent is the top of the picture

// Packaged, the DLL sits beside app.asar (a DLL cannot be loaded from inside the archive).
const dir = __dirname.includes('app.asar') ? process.resourcesPath : __dirname
const lib = koffi.load(path.join(dir, 'vendor', 'softcam.dll'))
const scCreateCamera = lib.func('void *scCreateCamera(int width, int height, float framerate)')
const scDeleteCamera = lib.func('void scDeleteCamera(void *camera)')
const scSendFrame = lib.func('void scSendFrame(void *camera, const uint8_t *image)')

let cam = null, w = 0, h = 0, bgr = null

function convert(rgba, width, height, out) {
  const r = BLUE_FIRST ? 2 : 0, b = 2 - r
  for (let y = 0; y < height; y++) {
    let s = y * width * 4
    let d = (TOP_DOWN ? y : height - 1 - y) * width * 3
    for (let x = 0; x < width; x++, s += 4, d += 3) {
      out[d + r] = rgba[s]
      out[d + 1] = rgba[s + 1]
      out[d + b] = rgba[s + 2]
    }
  }
  return out
}

function stop() {
  if (cam) scDeleteCamera(cam)
  cam = null
}

function start(width, height) {
  stop()
  // framerate 0: softcam does no pacing of its own, so send() never sleeps
  cam = scCreateCamera(width, height, 0)
  if (!cam) throw new Error('could not create the virtual camera (is Phone Cam already running, or the size not a multiple of 4?)')
  w = width
  h = height
  bgr = new Uint8Array(w * h * 3)
}

function send(rgba) {
  if (!cam) throw new Error('camera not started')
  if (rgba.length !== w * h * 4) throw new Error(`frame is ${rgba.length} bytes, expected ${w * h * 4}`)
  scSendFrame(cam, convert(rgba, w, h, bgr))
}

module.exports = { start, send, stop, convert }
