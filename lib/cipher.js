const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const stream = require('stream')
const archiver = require('archiver')
const unzipper = require('unzipper')
const utils = require('./utils')

const FILE_HEADER = Buffer.from('cipher-cli')
const FILE_VERSION = Buffer.from('v1.0.0')
const FILE_EXTENSION = '.tz'
const HEAD_MAX_SIZE = 100 //头部字最大字节数，用于读取头部信息
const SALT_LENGTH = 32
const IV_LENGTH = 16

/**
 * 格式:
 * head: 头部格式，固定为 ff ee dd cc
 * algorithmLen：算法长度，1 Bytes
 * algorithm: 算法名称，algorithmLen Bytes
 * iv: 初始向量，16 Bytes
 * saltLen：盐长度，1 Bytes
 * salt: 盐，saltLen Bytes
 */
module.exports = {
  async encipher(source, destFile, algorithm, password, compressLevel = 9) {
    if (!path.isAbsolute(source)) throw new Error(`${source} is not absolute path`)
    if (!fs.existsSync(source)) throw new Error(`${source} not exist`)
    let outputFile = destFile + FILE_EXTENSION
    if (fs.existsSync(outputFile)) throw new Error(`${outputFile} already exist`)
    let dir = path.dirname(outputFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)

    let keyLen = this._getAlgorithmKeyLen(algorithm)
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    const headStream = this._getHeadStream(algorithm, salt, iv)
    const key = crypto.scryptSync(password, salt, keyLen)
    const cipher = crypto.createCipheriv(algorithm, key, iv)

    let outputStream = fs.createWriteStream(outputFile)
    let archive = archiver('zip', {
      zlib: { level: compressLevel }, // Sets the compression level.
    })
    archive.pipe(cipher).pipe(headStream).pipe(outputStream)

    if (fs.lstatSync(source).isDirectory()) {
      // compress folder
      archive.directory(source, false)
    } else {
      // compress file
      archive.file(source, { name: path.basename(destFile) })
    }

    await archive.finalize()
    return outputFile
  },

  async decipher(sourceFile, destDir, password) {
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir)
    if (!path.isAbsolute(destDir)) throw new Error(`${destDir} is not absolute path`)
    if (!fs.statSync(destDir).isDirectory()) throw new Error(`${destDir} is not directory`)

    let fd = fs.openSync(sourceFile)
    let buffer = Buffer.alloc(HEAD_MAX_SIZE)
    fs.readSync(fd, buffer, 0, HEAD_MAX_SIZE, 0)

    let dataIndex = 0 //读取数据的指针
    dataIndex = FILE_HEADER.length
    let headerTmp = buffer.slice(0, dataIndex)
    if (Buffer.compare(FILE_HEADER, headerTmp)) throw new Error('error header')

    let versionLen = buffer[dataIndex]
    dataIndex += 1
    let version = buffer.slice(dataIndex, dataIndex + versionLen)
    dataIndex += versionLen
    if (!this._checkVersion(version)) throw new Error('major version not support')

    let algorithmLen = buffer[dataIndex]
    dataIndex += 1
    let algorithm = buffer.slice(dataIndex, dataIndex + algorithmLen).toString()
    dataIndex += algorithmLen

    let ivLen = buffer[dataIndex]
    dataIndex += 1
    let iv = buffer.slice(dataIndex, dataIndex + ivLen)
    dataIndex += ivLen

    let saltLen = buffer[dataIndex]
    dataIndex += 1
    let salt = buffer.slice(dataIndex, dataIndex + saltLen)
    dataIndex += saltLen

    let keyLen = this._getAlgorithmKeyLen(algorithm)
    const key = crypto.scryptSync(password, salt, keyLen)
    const decipher = crypto.createDecipheriv(algorithm, key, iv)

    const zip = fs
      .createReadStream(sourceFile, { start: dataIndex })
      .pipe(decipher)
      .pipe(unzipper.Parse({ forceStream: true }))
    for await (const entry of zip) {
      let fPath = destDir + '/' + entry.path
      entry.pipe(fs.createWriteStream(fPath))
    }
  },

  async encipherAdvance(source, dest, algorithm, password, compressLevel = 9, encipherMode = 'oneFile') {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest)
    if (fs.statSync(source).isFile()) {
      dest = path.join(dest, utils.getFileName(source))
      return await this.encipher(source, dest, algorithm, password, compressLevel)
    }

    if (encipherMode == 'oneFile') {
      dest = path.join(dest, utils.getFileName(source))
      return await this.encipher(source, dest, algorithm, password, compressLevel)
    }

    // perFile mode
    let files = fs.readdirSync(source)
    for (const file of files) {
      let filePath = path.join(source, file)
      let destPath = path.join(dest, utils.getFileName(file))
      await this.encipher(filePath, destPath, algorithm, password, compressLevel)
    }
  },

  async decipherAdvance(source, destDir, password) {
    if (fs.statSync(source).isFile()) {
      await this.decipher(source, destDir, password)
      return
    }

    let files = fs.readdirSync(source)
    for (const file of files) {
      let filePath = path.join(source, file)
      await this.decipher(filePath, destDir, password)
    }
  },

  _getAlgorithmKeyLen(algorithm) {
    let ciphers = crypto.getCiphers()
    if (!ciphers.includes(algorithm)) throw new Error(`error algorithm: ${algorithm}`)
    let algorithmArgs = algorithm.split('-')
    if (algorithmArgs.length < 3) throw new Error(`not support algorithm: ${algorithm}`)

    let keyLen = algorithmArgs[1] / 8
    if (![16, 24, 32].includes(keyLen)) throw new Error(`error algorithmLen: ${algorithm}, should ${[16, 24, 32].join(',')}`)

    let algorithmLen = algorithm.length
    if (algorithmLen < 1 || algorithmLen > 255) throw new Error('error algorithm length: %d', algorithmLen)

    return keyLen
  },

  _getHeadStream(algorithm, salt, iv) {
    let passStream = new stream.PassThrough()
    passStream.push(FILE_HEADER)
    passStream.push(Buffer.alloc(1).fill(FILE_VERSION.length))
    passStream.push(FILE_VERSION)
    passStream.push(Buffer.alloc(1).fill(algorithm.length))
    passStream.push(Buffer.from(algorithm))
    passStream.push(Buffer.alloc(1).fill(iv.length))
    passStream.push(iv)
    passStream.push(Buffer.alloc(1).fill(salt.length))
    passStream.push(salt)

    return passStream
  },

  _checkVersion(version) {
    let realVersion = version.toString()
    let curVersion = FILE_VERSION.toString()
    if (realVersion.split('.')[0] != curVersion.split('.')[0]) {
      return false
    }

    return true
  },
}
