#!/usr/bin/env node
const program = require('commander')
const package = require('../package.json')
const cipher = require('../lib/cipher')
const utils = require('../lib/utils')

program
  .version(package.version)
  .option('-d, --debug', 'output extra debugging')
  .option('-c, --config-path <path>', 'input config path', './config.json')
  .option('-t, --type <cipher-type>', 'cipher type[en <=> encipher | de <=> decipher]', 'en')
  .parse(process.argv)

async function main() {
  let debug = program.debug
  if (debug) console.log('use cipher-cli debug mode')
  if (debug) console.log(program.opts())
  if (!program.configPath) throw new Error('configPath is null')
  if (!program.type) throw new Error('type is null')

  let type = program.type
  let configPath = utils.getWholePath(program.configPath)
  if (debug) console.log('configPath: %s', configPath)
  let config = require(configPath)
  if (debug) console.log('config: %j', config)

  let { algorithm, password } = config
  if (type == 'en') {
    let { encipherSource, encipherDest, encipherMode } = config
    let sourcePath = utils.getWholePath(encipherSource)
    let destPath = utils.getWholePath(encipherDest)
    if (debug) {
      console.log('[encipher] sourcePath: %s', sourcePath)
      console.log('[encipher] destPath: %s', destPath)
    }

    await cipher.encipherAdvance(sourcePath, destPath, algorithm, password, algorithm, encipherMode)
  } else {
    let { decipherSource, decipherDir } = config
    let sourcePath = utils.getWholePath(decipherSource)
    let targetPath = utils.getWholePath(decipherDir)
    if (debug) {
      console.log('[decipher] sourcePath: %s', sourcePath)
      console.log('[decipher] targetPath: %s', targetPath)
    }

    await cipher.decipherAdvance(sourcePath, targetPath, password)
  }
}

main()
