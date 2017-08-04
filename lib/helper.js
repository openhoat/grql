const Promise = require('bluebird')
const yargonaut = require('yargonaut')
const chalk = yargonaut.chalk()
const util = require('util')
const prettyjson = require('prettyjson')
const { Writable } = require('stream')
const { __ } = require('./i18n')

const h = {
  stdout: process.stdout,
  stderr: process.stderr,
  buildWritable: dataContainer => new Writable({
    write(chunk, encoding, callback) {
      if (typeof dataContainer.data !== 'string') {
        dataContainer.data = ''
      }
      dataContainer.data += chunk
      callback()
    }
  }).setDefaultEncoding('utf8'),
  formatData: data => data && (
    data.indexOf('{') !== 0 ?
      `{ ${data} }` :
      data
  ),
  setStdout: dataContainer => {
    h.stdout = h.buildWritable(dataContainer)
  },
  setStderr: dataContainer => {
    h.stderr = h.buildWritable(dataContainer)
  },
  exit: (exitCode = 0) => {
    process.nextTick(() => {
      process.exit(exitCode)
    })
  },
  print: {
    out: (...args) => {
      const msg = util.format(...args)
      h.stdout.write(msg + '\n')
    },
    err: (...args) => {
      const msg = util.format(...args)
      h.stderr.write(msg + '\n')
    }
  },
  readStdinContent: () => {
    let content, stdinReader
    return new Promise(
      resolve => {
        if (process.stdin.isTTY) {
          return resolve()
        }
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
  render: (data, opt = {}) => {
    const { yaml, noColor } = opt
    if (yaml) {
      h.print.out(h.toPrettyJson(data, noColor))
    } else if (typeof data !== 'object') {
      h.print.out(data ? chalk.bold(data) : chalk.cyan.bold(__('empty')))
    } else {
      h.print.out(chalk.bold(JSON.stringify(data, null, 2)))
    }
  },
  toPrettyJson: (data, noColor) => (typeof data === 'undefined' || data === null ?
      __('null') :
      prettyjson.render(data, {
        noColor, emptyArrayMsg: __('(empty array)')
      })
  ),
}

exports = module.exports = h
