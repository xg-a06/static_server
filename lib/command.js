const program = require('commander')
const chalk = require('chalk')
const { version } = require('../package.json')

module.exports = () => {
  return new Promise((resolve, reject) => {
    program
      .command('list')
      .description(chalk.blue('以列表的形式显示所有静态服务'))
      .action(() => {
        resolve({
          cmd: 'list'
        })
      })
    program
      .command('kill <id>')
      .description(chalk.blue('关闭指定id的静态资源服务器'))
      .action(id => {
        resolve({
          cmd: 'kill',
          data: id
        })
      })
    program
      .version(version, '-v, --version')
      .command('start')
      .description(chalk.blue('根据配置启动静态服务器'))
      .option('-o,--host [hostName]', chalk.blue('主机名，默认为当前ip'))
      .option('-p,--port [portNo]', chalk.blue('端口号，默认为 19001'))
      .option(
        '-r,--root [path]',
        chalk.blue('静态资源根路径，默认为命令行运行路径')
      )
      .option(
        '-i,--index [indexName]',
        chalk.blue('静态资源首页，默认为静态资源根目录下的index.html')
      )
      .option('-s,--secure ', chalk.blue('启用https，默认关闭'))
      .option('-z,--zip ', chalk.blue('启用压缩，默认关闭'))
      .option('-c,--cache ', chalk.blue('启用策略缓存，默认关闭'))
      .option(
        '--config [configName]',
        chalk.blue(
          '启用配置文件，默认为根路径下的server.config.js,配置文件优先级大于命令行选项'
        )
      )
      .action(option => {
        resolve(option)
      })

    program.on('--help', function() {
      console.log('')
      console.log('Examples:')
      console.log(chalk.blue('  a06-server') + ' start -h')
      console.log(
        chalk.blue('  a06-server') +
          ' start -o www.xxx.com -p 19002 -r d:/test/ -i default.html -s -z -c --config ./xxx.config.js'
      )
    })
    program.parse(process.argv)
  })
}
