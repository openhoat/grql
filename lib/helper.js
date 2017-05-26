const Promise = require('bluebird')
const util = require('util')
const request = require('request')
const assert = require('assert')
const { buildClientSchema, introspectionQuery } = require('graphql/utilities')
const requestAsync = Promise.promisify(request, {multiArgs: true})

const helper = {
  exit: (exitCode = 0) => {
    process.nextTick(() => {
      process.exit(exitCode)
    })
  },
  fetchGraphqlSchema: (config, customIntrospectionQuery) => Promise.resolve()
    .then(() => {
      const opt = {
        method: 'POST',
        url: config.baseurl,
        body: {query: customIntrospectionQuery || introspectionQuery},
        json: true,
      }
      return requestAsync(opt)
    })
    .spread((res, body) => {
      assert(res.statusCode >= 200 && res.statusCode <= 299,
        `Error: cannot load schema (status code : ${res.statusCode}`
      )
      assert(body.data, 'Error: no data in loaded schema')
      return buildClientSchema(body.data)
    }),
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
}

exports = module.exports = helper
