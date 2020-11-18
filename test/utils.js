const utils = require('../lib/utils')
const { expect } = require('chai')
const path = require('path')

describe('utils', function () {
  it('should get absolute path', function () {
    let filePath = './utils.js'
    let rt = utils.getWholePath(filePath)
    let realPath = path.join(process.cwd(), filePath)
    expect(rt).to.be.equal(realPath)
  })

  it('should get basename', function () {
    let fileName = './utils.js'
    let rt = utils.getFileName(fileName)
    let realName = fileName.slice(2)
    expect(rt).to.be.equal(realName)
  })
})
