const MSG_TYPE = require('../const')
const command = require('./command')
const { getConfig } = require('./config')
const utils = require('./utils')
const { spawn } = require('child_process')
const StaticServer = require('./server')
const net = require('net')
const Table = require('cli-table2')

const table = new Table({
  chars: {
    top: '═',
    'top-mid': '╤',
    'top-left': '╔',
    'top-right': '╗',
    bottom: '═',
    'bottom-mid': '╧',
    'bottom-left': '╚',
    'bottom-right': '╝',
    left: '║',
    'left-mid': '╟',
    mid: '─',
    'mid-mid': '┼',
    right: '║',
    'right-mid': '╢',
    middle: '│'
  }
})
table.push(['ID', 'Protocol', 'Host', 'Port'])
class App {
  constructor() {
    this.mainHandler = null
  }
  async start() {
    this.mainHandler = await this.checkWatch()
    if (this.mainHandler === null) {
      await this.startWatch()
      this.mainHandler = await this.checkWatch()
    }
    const config = await command().then(options => {
      if (options.cmd) {
        return options
      } else {
        let { host, port, root, index, secure, zip, cache, config } = options
        let initConfig = this.checkConfig({
          host,
          port,
          root,
          index,
          secure,
          zip,
          cache,
          config
        })
        return getConfig(initConfig)
      }
    })
    if (config.cmd === 'list') {
      this.mainHandler.write(
        JSON.stringify({
          type: MSG_TYPE.LIST
        })
      )
    } else if (config.cmd === 'kill') {
      this.mainHandler.write(
        JSON.stringify({
          type: MSG_TYPE.KILL,
          data: config.data
        })
      )
    } else {
      this.mainHandler.write(
        JSON.stringify({
          type: MSG_TYPE.REGISTER,
          data: config
        })
      )
    }
  }
  checkWatch() {
    return new Promise((resolve, reject) => {
      const client = net.createConnection({
        port: 23333
      })
      client.on('connect', function() {
        resolve(client)
      })
      client.on('data', function(data) {
        const msg = JSON.parse(data.toString())
        switch (msg.type) {
          case MSG_TYPE.EXIST:
            utils.errorLog('port already in use')
            break
          case MSG_TYPE.LIST:
            msg.data.forEach(item => {
              table.push([item.id, item.protocol, item.host, item.port])
            })
            console.log(table.toString())
            break
          case MSG_TYPE.KILL:
            if (msg.data === 'all') {
              utils.successLog(`All servers has been stoped`)
            } else {
              utils.successLog(`ID ${msg.data} server has been stoped`)
            }
            break
          case MSG_TYPE.SUCCESS:
            let { port, ip, host, secure } = msg.data
            let protocol = 'http',
              _host = host || ip
            if (secure) {
              protocol = 'https'
            }
            utils.successLog(`Server started on ${protocol}://${_host}:${port}`)
            break
          default:
            break
        }
        process.exit(0)
      })
      client.on('error', function(data) {
        resolve(null)
      })
    })
  }
  startWatch() {
    return new Promise(async (resolve, reject) => {
      let timerId = 0
      // let stdout = utils.openSync(
      //   utils.joinPath(__dirname, 'check_out.log'),
      //   'w'
      // )
      // let stderr = utils.openSync(
      //   utils.joinPath(__dirname, 'check_error.log'),
      //   'w'
      // )
      const main = spawn('node', [utils.joinPath(__dirname, 'watch.js')], {
        detached: true
        // stdio: ['ignore', stdout, stderr]
      })
      main.on('error', code => {
        clearTimeout(timerId)
        resolve(false)
      })
      main.on('close', code => {
        clearTimeout(timerId)
        resolve(false)
      })
      timerId = setTimeout(() => {
        resolve(true)
      }, 200)
    })
  }
  server(config) {
    new StaticServer(config).static()
  }
  checkConfig(config) {
    let result = {}
    Object.keys(config).forEach(key => {
      if (config[key]) {
        result[key] = config[key]
      }
    })
    return result
  }
}

module.exports = App
