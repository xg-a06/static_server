const os = require('os')
const path = require('path')
const fs = require('fs')
const util = require('util')
const chalk = require('chalk')

exports.getIPAddress = () => {
  var ifaces = os.networkInterfaces()
  var ip = ''
  for (var dev in ifaces) {
    ifaces[dev].forEach(function(details) {
      if (ip === '' && details.family === 'IPv4' && !details.internal) {
        ip = details.address
        return
      }
    })
  }
  return ip || '127.0.0.1'
}

exports.errorLog = error => {
  console.log(chalk.red(error))
}
exports.successLog = msg => {
  console.log(chalk.green(msg))
}

fs.statPromise = util.promisify(fs.stat)
fs.readdirPromise = util.promisify(fs.readdir)
fs.existsPromise = util.promisify(fs.exists)

const fsMethods = [
  'openSync',
  'readFileSync',
  'statSync',
  'createReadStream',
  'statPromise',
  'readdirPromise',
  'existsPromise'
]

function delegateFS() {
  for (let method of fsMethods) {
    exports[method] = function() {
      return fs[method].apply(fs, arguments)
    }
  }
}

delegateFS()

const pathMethods = [
  {
    source: 'join',
    target: 'joinPath'
  },
  'extname'
]

function delegatePath() {
  for (let method of pathMethods) {
    if (typeof method === 'object') {
      exports[method.target] = function() {
        return path[method.source].apply(path, arguments)
      }
    } else {
      exports[method] = function() {
        return path[method].apply(path, arguments)
      }
    }
  }
}
delegatePath()
