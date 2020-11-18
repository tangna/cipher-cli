const cipher = require('../lib/cipher')
const utils = require('../lib/utils')
const { expect } = require('chai')
const config = require('../config/compress.json')
const fs = require('fs')
const path = require('path')

const encipherPerFilePath = utils.getWholePath('./data/encipher-per-file')
const encipherOneFilePath = utils.getWholePath('./data/encipher-one-file')
const encipherOneDirPath = utils.getWholePath('./data/encipher-one-dir')
const decipherPerFilePath = utils.getWholePath('./data/decipher-per-file')
const decipherOneFilePath = utils.getWholePath('./data/decipher-one-file')
const decipherOneDirPath = utils.getWholePath('./data/decipher-one-dir')

describe('cipher', function () {
  before(async function () {
    if (fs.existsSync(encipherPerFilePath)) {
      fs.readdirSync(encipherPerFilePath).forEach(file => {
        fs.unlinkSync(path.join(encipherPerFilePath, './', file))
      })
    }

    if (fs.existsSync(encipherOneFilePath)) {
      fs.readdirSync(encipherOneFilePath).forEach(file => {
        fs.unlinkSync(path.join(encipherOneFilePath, './', file))
      })
    }

    if (fs.existsSync(encipherOneDirPath)) {
      fs.readdirSync(encipherOneDirPath).forEach(file => {
        fs.unlinkSync(path.join(encipherOneDirPath, './', file))
      })
    }
  })

  it('encipher folder with perFile', async function () {
    let { encipherSource, algorithm, password } = config
    let encipherMode = 'perFile'
    let sourcePath = utils.getWholePath(encipherSource)
    let destPath = encipherPerFilePath
    await cipher.encipherAdvance(sourcePath, destPath, algorithm, password, algorithm, encipherMode)

    let files = fs.readdirSync(destPath)
    expect(files.length).to.be.equal(2)
    for (const f of files) {
      expect(f.endsWith('.tz')).to.be.true
    }
  })

  it('encipher folder with oneFile', async function () {
    let { encipherSource, algorithm, password } = config
    let encipherMode = 'oneFile'
    let sourcePath = utils.getWholePath(encipherSource)
    let destPath = encipherOneFilePath
    await cipher.encipherAdvance(sourcePath, destPath, algorithm, password, algorithm, encipherMode)

    let files = fs.readdirSync(destPath)
    expect(files.length).to.be.equal(1)
    for (const f of files) {
      expect(f.endsWith('.tz')).to.be.true
    }
  })

  it('encipher folder with oneDir', async function () {
    let { encipherSource, algorithm, password } = config
    let encipherMode = 'oneFile'
    let sourcePath = utils.getWholePath(encipherSource)
    let destPath = encipherOneDirPath
    await cipher.encipherAdvance(sourcePath, destPath, algorithm, password, 9, encipherMode)

    let files = fs.readdirSync(destPath)
    expect(files.length).to.be.equal(1)
    for (const f of files) {
      expect(f.endsWith('.tz')).to.be.true
    }
  })

  it('decipher folder with perFile', async function () {
    let { password } = config
    let sourcePath = encipherPerFilePath
    let destPath = decipherPerFilePath
    await cipher.decipherAdvance(sourcePath, destPath, password)

    let files = fs.readdirSync(destPath)
    expect(files.length).to.be.equal(2)
    for (const f of files) {
      expect(f.endsWith('.txt')).to.be.true
    }
  })

  it('decipher folder with oneFile', async function () {
    let { password } = config
    let sourcePath = encipherOneFilePath
    let destPath = decipherOneFilePath
    await cipher.decipherAdvance(sourcePath, destPath, password)

    let files = fs.readdirSync(destPath)
    expect(files.length).to.be.equal(2)
    for (const f of files) {
      expect(f.endsWith('.txt')).to.be.true
    }
  })

  it('decipher folder with oneDir', async function () {
    let { password } = config
    let sourcePath = encipherOneDirPath
    let destPath = decipherOneDirPath
    await cipher.decipherAdvance(sourcePath, destPath, password)

    let files = fs.readdirSync(destPath)
    expect(files.length).to.be.equal(2)
    for (const f of files) {
      expect(f.endsWith('.txt')).to.be.true
    }
  })
})
