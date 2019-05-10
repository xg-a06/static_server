const http = require('http')
const https = require('https')
const mime = require('mime')
const utils = require('./utils')
const zlib = require('zlib')
const open = require('open')
const ejs = require('ejs')
const crypto = require('crypto')
const tpl = require('./tpl')
const httpProxy = require('http-proxy')
const CircularJSON = require('circular-json')

class StaticServer {
  constructor(config) {
    this.config = config
    this.proxy = null
  }
  send(filePath, req, res) {
    let { zip, cache } = this.config
    res.statusCode = 200
    res.setHeader('Content-Type', mime.getType(utils.extname(filePath)))
    res.setHeader('Cache-Control', 'no-cache')
    let md5 = crypto.createHash('md5')
    let ifNoneMatch = req.headers['if-none-match']
    let out = utils.createReadStream(filePath)
    out.on('data', function(data) {
      md5.update(data)
    })
    out.on('end', () => {
      let etag = md5.digest('hex')
      if (cache && ifNoneMatch == etag) {
        res.writeHead(304)
        res.end('')
      } else {
        res.setHeader('ETag', etag)
        let acceptEncoding = req.headers['accept-encoding']
        if (zip && acceptEncoding.match(/\bgzip\b/)) {
          res.setHeader('Content-Encoding', 'gzip')
          utils
            .createReadStream(filePath)
            .pipe(zlib.createGzip())
            .pipe(res)
        } else if (zip && acceptEncoding.match(/\bdeflate\b/)) {
          res.setHeader('Content-Encoding', 'deflate')
          utils
            .createReadStream(filePath)
            .pipe(zlib.createDeflate())
            .pipe(res)
        } else {
          utils.createReadStream(filePath).pipe(res)
        }
      }
    })
  }
  async showDir(filePath, pathName, res) {
    let data = await this.generateHtmlData(filePath, pathName)
    res.writeHead(200, {
      'Content-Type': 'text/html;charset=utf-8'
    })
    res.write(ejs.render(tpl, { data: data }))
    res.end()
  }
  async generateHtmlData(filePath, pathName) {
    const files = await utils.readdirPromise(filePath)
    let data = []
    files.forEach(function(filename) {
      try {
        const rt = utils.statSync(utils.joinPath(filePath, filename))
        const isDirectory = rt.isDirectory()
        let className = 'file'
        if (isDirectory) {
          className = 'dir'
        }
        if (pathName[pathName.length - 1] !== '/') {
          pathName += '/'
        }
        data.push({
          className: className,
          path: `${pathName}${filename}`,
          filename: filename
        })
      } catch (err) {
        utils.errorLog(err)
      }
    })
    return data
  }
  async handler(req, res) {
    try {
      let pathName = decodeURIComponent(req.url)
      if (this.config.proxy && Object.keys(this.config.proxy).length > 0) {
        let hasProxy = false,
          option = {}
        Object.keys(this.config.proxy).forEach(key => {
          if (pathName.indexOf(key) === 0) {
            option = this.config.proxy[key]
            hasProxy = true
          }
        })
        if (hasProxy) {
          this.proxy.web(req, res, option)
          return
        }
      }
      let { root, index } = this.config
      const filePath = utils.joinPath(root, pathName)
      const indexPath = utils.joinPath(filePath, index)
      let indexInfo = await utils.existsPromise(indexPath)
      if (indexInfo) {
        this.send(indexPath, req, res)
        return
      }
      let statInfo = await utils.statPromise(filePath)
      if (statInfo.isDirectory()) {
        this.showDir(filePath, pathName, res)
      } else if (statInfo.isFile()) {
        this.send(filePath, req, res)
      }
    } catch (err) {
      utils.errorLog(err)
      res.writeHead(404)
      res.write('Something went wrong.')
      res.end()
    }
  }
  initProxy() {
    let { secure, proxy } = this.config
    if (proxy) {
      let options = {}
      if (secure) {
        // options = {
        //   key: utils.readFileSync('./cert/privatekey.pem'),
        //   cert: utils.readFileSync('./cert/certificate.pem')
        // }
      }
      this.proxy = httpProxy.createProxyServer(options)
      this.proxy.on('error', function(err, req, res) {
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        })
        res.end(`proxy error occurred.${CircularJSON.stringify(err)}`)
      })
    }
  }
  static() {
    return new Promise((resolve, reject) => {
      this.initProxy()
      let { port, ip, host, secure } = this.config
      let server
      if (secure) {
        let options = {
          key: utils.readFileSync(
            utils.joinPath(__dirname, '../cert', 'privatekey.pem')
          ),
          cert: utils.readFileSync(
            utils.joinPath(__dirname, '../cert', 'certificate.pem')
          )
        }
        server = https.createServer(options, this.handler.bind(this))
      } else {
        server = http.createServer(this.handler.bind(this))
      }
      server.listen(port, err => {
        if (err) {
          utils.errorLog(err)
          reject(err)
        } else {
          let protocol = 'http',
            _host = host || ip
          if (secure) {
            protocol = 'https'
          }
          console.info(`Server started on ${protocol}://${_host}:${port}`)
          open(`${protocol}://${_host}:${port}`)
          resolve({
            protocol,
            host: _host,
            port,
            server
          })
        }
      })
    })
  }
}

module.exports = StaticServer
