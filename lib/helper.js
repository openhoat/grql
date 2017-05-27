const Promise = require('bluebird')
const chalk = require('chalk')
const util = require('util')
const prettyjson = require('prettyjson')
const { __ } = require('./i18n')

const h = {
  exit: (exitCode = 0) => {
    process.nextTick(() => {
      process.exit(exitCode)
    })
  },
  print: {
    out: (...args) => {
      const msg = util.format(...args)
      process.stdout.write(msg + '\n')
    },
    err: (...args) => {
      const msg = util.format(...args)
      process.stderr.write(msg + '\n')
    }
  },
  readStdinContent: () => {
    let content, stdinReader
    return new Promise(
      resolve => {
        stdinReader = () => {
          const chunk = process.stdin.read()
          if (chunk === null) {
            resolve(content)
            return
          }
          content = (content || '') + chunk
        }
        process.stdin.setEncoding('utf8')
        process.stdin.on('readable', stdinReader)
        process.stdin.on('end', () => {
          resolve(content)
        })
      })
      .finally(() => {
        stdinReader && process.stdin.removeListener('readable', stdinReader)
        process.stdin.destroy()
      })
  },
  toPrettyJson: data => prettyjson.render(data, {emptyArrayMsg: __('(empty array)')}),
  render: (data, yaml) => {
    if (yaml) {
      h.print.out(h.toPrettyJson(data))
    } else if (typeof data !== 'object') {
      h.print.out(data ? chalk.bold(data) : chalk.cyan.bold('empty'))
    } else {
      h.print.out(chalk.bold(JSON.stringify(data, null, 2)))
    }
  }
}

exports = module.exports = h
