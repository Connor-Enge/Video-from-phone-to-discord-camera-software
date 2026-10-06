// node camera.test.js
const assert = require('assert')
const { convert } = require('./camera')

// 2x2: red, green / blue, white
const rgba = [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]
const bgr = [0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255]
assert.deepStrictEqual([...convert(rgba, 2, 2, new Uint8Array(12))], bgr)
console.log('ok')
