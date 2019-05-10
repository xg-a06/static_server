const { joinPath, getIPAddress, statPromise } = require('./utils')

const defaultConfig = {
  host: '',
  port: parseInt(Math.random() * 5000 + 15000),
  root: process.cwd(),
  index: 'index.html',
  secure: false,
  zip: false,
  cache: false,
  ip: getIPAddress(),
  config: 'server.config.js'
}

exports.getConfig = configs => {
  let config = Object.assign({}, defaultConfig, configs)
  return new Promise((resolve, reject) => {
    let configPath = joinPath(config.root, config.config)
    statPromise(configPath)
      .then(() => {
        const customConfig = require(configPath)
        config = Object.assign({}, config, customConfig)
        resolve(config)
      })
      .catch(err => {
        resolve(config)
      })
  })
}
exports.defaultConfig = defaultConfig
