const net = require('net')
const MSG_TYPE = require('../const')
const StaticServer = require('./server')
const CircularJSON = require('circular-json')
const clients = {}
const server = net.createServer()
let id = 1
server.on('connection', function(socket) {
  socket.on('data', function(data) {
    try {
      const msg = JSON.parse(data.toString())
      switch (msg.type) {
        case MSG_TYPE.REGISTER:
          if (clients[msg.data.port]) {
            socket.write(
              CircularJSON.stringify({
                type: MSG_TYPE.EXIST
              })
            )
            return
          }
          new StaticServer(msg.data)
            .static()
            .then(result => {
              clients[`${id++}`] = result
              socket.write(
                CircularJSON.stringify({
                  type: MSG_TYPE.SUCCESS,
                  data: msg.data
                })
              )
            })
            .catch(err => {
              socket.write(CircularJSON.stringify(err))
            })
          break
        case MSG_TYPE.LIST:
          const data = Object.keys(clients).map(key => {
            return {
              id: key,
              protocol: clients[key].protocol,
              host: clients[key].host,
              port: clients[key].port
            }
          })
          socket.write(
            CircularJSON.stringify({
              type: MSG_TYPE.LIST,
              data: data
            })
          )
          break
        case MSG_TYPE.KILL:
          if (msg.data === 'all') {
            Object.keys(clients).forEach(key => {
              clients[key] && clients[key].server.close()
              delete clients[key]
            })
          } else {
            clients[msg.data] && clients[msg.data].server.close()
            delete clients[msg.data]
          }
          socket.write(
            CircularJSON.stringify({
              type: MSG_TYPE.KILL,
              data: msg.data
            })
          )
          break
        default:
          break
      }
    } catch (error) {
      socket.write(CircularJSON.stringify(error))
    }
  })
  socket.on('error', function(err) {
    console.log(1, err)
  })
  socket.on('close', function(isErrorClose) {
    console.log(3, isErrorClose)
  })
})

server.listen(23333, '127.0.0.1', function() {
  console.log('服务器开始监听成功,等待客户连接中。。。')
})
