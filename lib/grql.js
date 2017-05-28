const path = require('path')
const util = require('util')
const { Writable } = require('stream')
const Promise = require('bluebird')
const _ = require('lodash')
const chalk = require('chalk')
const Lokka = require('lokka').Lokka
const { Transport } = require('lokka-transport-http')
const basicAuthHeader = require('basic-auth-header')
const fetchSchema = require('fetch-graphql-schema')
const { __ } = require('./i18n')
const h = require('./helper')
const cmd = require('./cmd')
const config = require('./config').load()
const standalone = !module.parent || module.parent.filename === path.join(__dirname, '..', 'bin', 'grql')

const grql = (...args) => Promise.resolve()
  .then(() => {
    if (standalone) {
      return h.readStdinContent()
        .then(content => {
          config.stdinContent = content
        })
    }
  })
  .then(() => {
    if (!standalone) {
      grql.stdout = grql.stderr = ''
      h.stdout = new Writable({
        write(chunk, encoding, callback) {
          grql.stdout = grql.stdout + chunk
          callback()
        }
      })
      h.stdout.setDefaultEncoding('utf8')
      h.stderr = new Writable({
        write(chunk, encoding, callback) {
          grql.stderr = grql.stderr + chunk
          callback()
        }
      })
      h.stderr.setDefaultEncoding('utf8')
    }
    const argv = cmd.parse(args)
    return Promise.resolve()
      .then(() => {
        if (argv.nocolor) {
          chalk.enabled = false
        }
        if (argv.help) {
          return cmd.showHelp(help => {
            h.print.err(help)
          })
        }
        _.set(config, 'settings.defaultEnv', argv.env ||
          _.get(config, 'settings.defaultEnv', 'default')
        )
        const envName = config.settings.defaultEnv
        if (argv.verbose) {
          h.print.out(chalk.gray(`using environment '${envName}'`))
        }
        _.set(config, `settings.env.${envName}`, _.get(config, `settings.env.${envName}`, {}))
        const env = config.settings.env[envName]
        Object.assign(env, _.pickBy(_.pick(argv, config.envFields), _.identity))
        if (argv.verbose) {
          h.print.out(chalk.gray('environment details :'))
          h.render(_.omit(env, 'password'), argv.yaml)
        }
        if (typeof argv.schema !== 'undefined') {
          return fetchSchema(env.baseurl)
            .then(data => {
              const schema = JSON.parse(data)
              const key = ['data', '__schema']
              if (argv.schema) {
                key.push(argv.schema.split('.'))
              }
              h.render(_.get(schema, key.join('.')), argv.yaml)
            })
        }
        const data = argv._[0] || config.stdinContent || (argv.query && _.get(config.settings, `queries.${argv.query}`))
        const transportOpt = {}
        if (env.user) {
          _.set(transportOpt, 'headers.Authorization', basicAuthHeader(env.user, env.password))
        }
        const transport = new Transport(env.baseurl, transportOpt)
        const client = new Lokka({transport})
        if (argv.fragment) {
          _.set(config.settings, `fragments.${argv.fragment}`, data)
        } else if (argv.query) {
          if (data) {
            _.set(config.settings, `queries.${argv.query}`, data)
          } else {
            throw new Error(__("Error: query '%s' not found", argv.query))
          }
        }
        if (argv.verbose) {
          h.print.out(chalk.gray('request headers :'))
          h.render(_.get(transport, '_httpOptions.headers'), argv.yaml)
        }
        if (argv.save) {
          !argv.dryrun && config.save()
          h.print.err(chalk.yellow.bold(__('options successfully saved')))
        }
        if (!argv.fragment && data) {
          const fragmentRe = /(\$\{[^\}]+\})/g
          const fragmentMatch = data.match(fragmentRe) || []
          const queryData = fragmentMatch.reduce((data, fragmentRef) => {
            const fragmentNameMatch = fragmentRef.match(/\$\{([^\}]+)\}/)
            const fragmentName = fragmentNameMatch && fragmentNameMatch[1]
            const fragment = fragmentName && client.createFragment(_.get(config.settings, `fragments.${fragmentName}`))
            return fragment ? data.replace(fragmentRef, fragment) : data
          }, data)
          if (argv.verbose) {
            h.print.out(chalk.gray('data :'))
            h.render(queryData, argv.yaml)
          }
          const vars = argv.var && (Array.isArray(argv.var) ? argv.var : [argv.var])
              .reduce((vars, item) => {
                const match = item.match(/(.*)=(.*)/)
                return Object.assign(vars, {[match[1]]: match[2]})
              }, {})
          if (argv.verbose) {
            h.print.out(chalk.gray('variables :'))
            h.render(vars, argv.yaml)
          }
          if (argv.dryrun) {
            return
          }
          return client[argv.mutation ? 'mutate' : 'query'](queryData, vars)
            .then(result => {
              h.render(result, argv.yaml)
            })
        }
        if (argv._.length < 1) {
          if (typeof argv.env !== 'undefined' && !argv.env) {
            h.print.out(chalk.bold(__('environments :')))
            h.print.out(Object.keys(config.settings.env)
              .map(item => util
                .format(
                  '[%s] %s',
                  item === envName ? chalk.cyan.bold('o') : ' ',
                  chalk.bold(item)
                ))
              .join('\n'))
            return
          }
          if (typeof argv.query !== 'undefined' && !argv.query) {
            h.print.out(chalk.bold('saved queries :'))
            h.render(_.get(config.settings, `queries`), argv.yaml)
            return
          }
          if (!argv.save) {
            throw new Error(__('Error : missing argument'))
          }
        }
      })
      .then(() => {
        if (!standalone) {
          return _.pick(grql, ['stdout', 'stderr'])
        }
      })
      .catch(err => {
        h.print.err(chalk.red.bold(err))
        if (argv.verbose) {
          h.print.err(chalk.gray('stack :', err.stack))
        }
        throw err
      })
  })

exports = module.exports = grql
exports.__ = __

if (standalone) {
  grql(...process.argv.slice(2))
    .catch(() => {
      h.exit(1)
    })
}
