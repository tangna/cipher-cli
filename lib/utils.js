const path = require('path')

module.exports = {
  getWholePath(filePath) {
    if (path.isAbsolute(filePath)) return filePath

    return path.resolve(process.cwd(), filePath)
  },

  getFileName(filePath) {
    return path.basename(filePath)
  },
}
