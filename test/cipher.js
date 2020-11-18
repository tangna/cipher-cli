const cipher = require('../lib/cipher')
const utils = require('../lib/utils')
const { expect } = require('chai')
const config = require('../config/compress.json')
const fs = require('fs')
const path = require('path')

describe('cipher', function () {
  before(async function () {
    let { encipherDest } = config
    let destPath = utils.getWholePath(encipherDest)
    fs.readdirSync(destPath).forEach(file => {
      fs.unlinkSync(path.join(destPath, './', file))
    })
  })

  it('encipher folder with perFile', async function () {
    let { encipherSource, encipherDest, algorithm, password } = config
    let encipherMode = 'perFile'
    let sourcePath = utils.getWholePath(encipherSource)
    let destPath = utils.getWholePath(encipherDest)
    await cipher.encipherAdvance(sourcePath, destPath, algorithm, password, algorithm, encipherMode)
  })

  it('encipher folder with oneFile', async function () {
    let { encipherSource, encipherDest, algorithm, password } = config
    let encipherMode = 'oneFile'
    let sourcePath = utils.getWholePath(encipherSource)
    let destPath = utils.getWholePath(encipherDest)
    await cipher.encipherAdvance(sourcePath, destPath, algorithm, password, algorithm, encipherMode)
  })

  it.skip('encipher folder', async function () {
    let { algorithm, password } = config
    let encipherMode = 'oneFile'
    let sourcePath = utils.getWholePath('data/input/test')
    let destPath = utils.getWholePath('data/encipher-folder')
    await cipher.encipherAdvance(sourcePath, destPath, algorithm, password, 9, encipherMode)
  })

  it('decipher folder', async function () {
    let { decipherSource, decipherDir, password } = config
    let sourcePath = utils.getWholePath(decipherSource)
    let destPath = utils.getWholePath(decipherDir)
    await cipher.decipherAdvance(sourcePath, destPath, password)
  })
})
