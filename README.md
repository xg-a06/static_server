# a06-server 随启随用的静态文件服务器

随时随地将你的当前目录或指定目录变成一个静态文件服务器的根目录。支持代理，支持后台运行。

## 安装

```sh
npm install anywhere -g
```

## 执行

```sh
// 当前目录用随机端口启动静态资源服务器
$ a06-server start

// 指定端口
$ a06-server start -p 8000

// 指定域名，默认为当前ip
$ a06-server start -o www.xxx.com

// 指定域名，默认为当前ip
$ a06-server start -o www.xxx.com

// 指定目录，默认为执行命令的目录
$ a06-server start -r d:/test/

// 指定首页，默认为静态资源根目录下的index.html
$ a06-server start -i default.html

// 启用https
$ a06-server start -s

// 启动gzip压缩
$ a06-server start -z

// 启动策略缓存
$ a06-server start -c

// 如果不习惯命令行参数，你可以使用配置文件进行更加复杂的配
// 置，如开启代理,默认会读取静态资源根目录下的./server.config.js
// 你也可以使用--config 指定你的配置文件，配置文件优先级大于命令选项
$ a06-server start --config ./xxx.config.js

// 显示出当前启动的所有静态资源服务器
$ a06-server list

// 结束id为1的静态资源服务器,也可以传all，结束所有静态资源服务器
$ a06-server kill 1

```

## 帮助

```sh
$ a06-server -h
Usage: a06-server [command] [options]

Options:
  -v, --version    output the version number
  -h, --help       output usage informationCommands:
  list             以列表的形式显示所有静态服务  
  kill <id>        关闭指定id的静态资源服务器  
  start [options]  根据配置启动静态服务器

Examples:
  a06-server start -h
  a06-server start -o www.xxx.com -p 19002 -r d:/test/ -i default.html -s -z ---config ./xxx.config.js

$ a06-server start -h
Usage: start [options]

Options:
  -o,--host [hostName]    主机名，默认为当前ip
  -p,--port [portNo]      端口号，默认为 19001
  -r,--root [path]        静态资源根路径，默认为命令行运行路径
  -i,--index [indexName]  静态资源首页，默认为静态资源根目录下的index.html
  -s,--secure             启用https，默认关闭
  -z,--zip                启用压缩，默认关闭
  -c,--cache              启用策略缓存，默认关闭  
  --config [configName]   启用配置文件，默认为根路径下的server.config.js,配置文件优先级大于命令选项
  -h, --help              output usage information
```

## 配置文件server.config.js

配置文件可以配置命令行选项里的所有配置，还可以进行代理配置

```sh
module.exports = {
  port: 19003,
  index: 'index.html',
  secure: true,
  proxy: {
    '/api': {
      target: 'https://www.xxx.com/',
      secure: false //如果代理目标是https,此处设置成false
    }
  }
}
```
More about the [shorthand configuration](https://github.com/chimurai/http-proxy-middleware#shorthand).

**Webpack conofig**
```javascript
// webpack.conofig.js
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:7000',
        changeOrigin: true
      }
    }
  }
}
```

## License
The MIT license.
