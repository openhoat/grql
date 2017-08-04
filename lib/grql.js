const path = require('path')
const util = require('util')
const { Writable } = require('stream')
const Promise = require('bluebird')
const _ = require('lodash')
const yargonaut = require('yargonaut')
const chalk = yargonaut.chalk()
const Lokka = require('lokka').Lokka
const { Transport } = require('lokka-transport-http')
const basicAuthHeader = require('basic-auth-header')
const fetchSchema = require('fetch-graphql-schema')
const { __ } = require('./i18n')
const h = require('./helper')
const cmd = require('./cmd')
const config = require('./config').load()
const standalone = !module.parent || module.parent.filename === path.join(__dirname, '..', 'bin', 'grql')

async function exec(opt, ...params) {
  if (typeof opt === 'undefined') {
    opt = {}
  } else if (typeof opt !== 'object') {
    opt = { args: [opt].concat(params) }
  }
  const { stdout, stderr, args = [] } = opt
  const argv = cmd.parse(args)
  try {
    const stdinContent = await h.readStdinContent()
    if (stdout) {
      h.setStdout(stdout)
    }
    if (stderr) {
      h.setStderr(stderr)
    }
    const command = argv._[0]
    if (argv.nocolor) {
      chalk.enabled = false
    }
    const renderOpts = { yaml: argv.yaml, noColor: argv.nocolor }
    if (argv.help) {
      cmd.showHelp(help => {
        h.print.err(help)
      })
      return
    }
    _.set(config, 'settings.defaultEnv', argv.env ||
      _.get(config, 'settings.defaultEnv', 'default')
    )
    const envName = config.settings.defaultEnv
    if (argv.verbose) {
      h.print.out(chalk.gray(__(`using environment %s`, envName)))
    }
    _.set(config, `settings.env.${envName}`, _.get(config, `settings.env.${envName}`, {}))
    const env = config.settings.env[envName]
    Object.assign(env, _.pickBy(_.pick(argv, config.envFields), _.identity))
    const aliasMap = { query: 'queries', 'mutate': 'mutations' }
    const aliasKey = aliasMap[command]
    const data = (data => data && data.trim())(argv._[1] ||
      stdinContent ||
      (aliasKey && _.get(config.settings, `${aliasKey}.${argv.alias}`)))
    if (argv.alias && aliasKey) {
      _.set(config.settings, `${aliasKey}.${argv.alias}`, data)
    }
    const transportOpt = {}
    if (env.user) {
      _.set(transportOpt, 'headers.Authorization', basicAuthHeader(env.user, env.password))
    }
    const transport = new Transport(env.baseurl, transportOpt)
    const client = new Lokka({ transport })
    if (argv.verbose) {
      h.print.out(chalk.gray(__('environment details :')))
      h.render(_.omit(env, 'password'), renderOpts)
      h.print.out(chalk.gray(__('command : ') + chalk.white.bold(command)))
      h.print.out(chalk.gray(__('request headers :')))
      h.render(_.get(transport, '_httpOptions.headers'), renderOpts)
      h.print.out(chalk.gray(__('data :')))
      h.render(data, renderOpts)
    }
    const vars = argv.var && (Array.isArray(argv.var) ? argv.var : [argv.var])
      .reduce((vars, item) => {
        const match = item.match(/(.*)=(.*)/)
        return Object.assign(vars, { [match[1]]: match[2] })
      }, {})
    if (argv.verbose) {
      h.print.out(chalk.gray(__('variables :')))
      h.render(vars, renderOpts)
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
      if (typeof argv.alias !== 'undefined' && !argv.alias) {
        h.print.out(chalk.bold(__('saved queries :')))
        h.render(_.get(config.settings, `queries`), renderOpts)
        h.print.out(chalk.bold(__('saved mutations :')))
        h.render(_.get(config.settings, `mutations`), renderOpts)
      }
      if (!argv.save) {
        throw new Error(__('Error : missing argument (try --help)'))
      }
    }
    if (argv.dryrun) {
      return
    }
    const fragments = _.mapValues(
      _.get(config.settings, 'fragments'),
      value => client.createFragment(value)
    )
    const dataWithFragments = Object.keys(fragments).reduce((data, name) => {
      const re = new RegExp(`\\$\\{${name}\}`)
      return data.replace(re, fragments[name])
    }, data)
    switch (command) {
      case 'schema': {
        const schemaJSON = await fetchSchema(env.baseurl)
        const schema = JSON.parse(schemaJSON)
        const key = ['data', '__schema']
        if (data) {
          key.push(data.split('.'))
        }
        h.render(_.get(schema, key.join('.')), renderOpts)
        break
      }
      case 'fragment': {
        if (data) {
          if (!argv.alias) {
            throw new Error(__('Error : alias missing'))
          }
          _.set(config.settings, `fragments.${argv.alias}`, data)
        } else {
          h.render(_.get(config.settings, 'fragments' + (argv.alias ? `.${argv.alias}` : '')), renderOpts)
        }
        break
      }
      case 'query': {
        const result = await client.query(h.formatData(dataWithFragments), vars)
        h.render(result, renderOpts)
        break
      }
      case 'mutate': {
        const result = await client.mutate(h.formatData(dataWithFragments), vars)
        h.render(result, renderOpts)
        break
      }
      default:
        if (!argv.save) {
          throw new Error(__('Error : unsupported operation'))
        }
    }
    if (argv.save) {
      if (!argv.dryrun) {
        config.save()
      }
      h.print.err(chalk.yellow.bold(__('options successfully saved')))
    }
    return
  } catch (err) {
    h.print.err(chalk.red.bold(err))
    if (argv.verbose) {
      h.print.err(chalk.gray('stack :', err.stack))
    }
    if (!standalone) {
      throw err
    }
  }
}

const grql2 = async (...args) => {
  if (standalone) {
    config.stdinContent = await h.readStdinContent()
  } else {
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
      const command = argv._[0]
      if (argv.nocolor) {
        chalk.enabled = false
      }
      const renderOpts = _.pick(argv, ['yaml', 'nocolor'])
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
        h.print.out(chalk.gray(__(`using environment %s`, envName)))
      }
      _.set(config, `settings.env.${envName}`, _.get(config, `settings.env.${envName}`, {}))
      const env = config.settings.env[envName]
      Object.assign(env, _.pickBy(_.pick(argv, config.envFields), _.identity))
      const aliasMap = { query: 'queries', 'mutate': 'mutations' }
      const aliasKey = aliasMap[command]
      const data = argv._[1] ||
        config.stdinContent ||
        (aliasKey && _.get(config.settings, `${aliasKey}.${argv.alias}`))
      if (argv.alias && aliasKey) {
        _.set(config.settings, `${aliasKey}.${argv.alias}`, data)
      }
      const transportOpt = {}
      if (env.user) {
        _.set(transportOpt, 'headers.Authorization', basicAuthHeader(env.user, env.password))
      }
      const transport = new Transport(env.baseurl, transportOpt)
      const client = new Lokka({ transport })
      if (argv.verbose) {
        h.print.out(chalk.gray(__('environment details :')))
        h.render(_.omit(env, 'password'), renderOpts)
        h.print.out(chalk.gray(__('command : ') + chalk.white.bold(command)))
        h.print.out(chalk.gray(__('request headers :')))
        h.render(_.get(transport, '_httpOptions.headers'), renderOpts)
        h.print.out(chalk.gray(__('data :')))
        h.render(data, renderOpts)
      }
      const vars = argv.var && (Array.isArray(argv.var) ? argv.var : [argv.var])
        .reduce((vars, item) => {
          const match = item.match(/(.*)=(.*)/)
          return Object.assign(vars, { [match[1]]: match[2] })
        }, {})
      if (argv.verbose) {
        h.print.out(chalk.gray(__('variables :')))
        h.render(vars, renderOpts)
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
        if (typeof argv.alias !== 'undefined' && !argv.alias) {
          h.print.out(chalk.bold(__('saved queries :')))
          h.render(_.get(config.settings, `queries`), renderOpts)
          h.print.out(chalk.bold(__('saved mutations :')))
          h.render(_.get(config.settings, `mutations`), renderOpts)
        }
        if (!argv.save) {
          throw new Error(__('Error : missing argument (try --help)'))
        }
      }
      if (argv.dryrun) {
        return
      }
      const fragments = _.mapValues(_.get(config.settings, 'fragments'),
        value => client.createFragment(value))
      return Promise.resolve()
        .then(() => {
          switch (command) {
            case 'schema':
              return fetchSchema(env.baseurl)
                .then(schemaJSON => {
                  const schema = JSON.parse(schemaJSON)
                  const key = ['data', '__schema']
                  if (data) {
                    key.push(data.split('.'))
                  }
                  h.render(_.get(schema, key.join('.')), renderOpts)
                })
            case 'fragment':
              if (data) {
                if (!argv.alias) {
                  throw new Error(__('Error : alias missing'))
                }
                _.set(config.settings, `fragments.${argv.alias}`, data)
              } else {
                h.render(_.get(config.settings, 'fragments' + (argv.alias ? `.${argv.alias}` : '')), renderOpts)
              }
              return
            case 'query':
              return client.query(data, vars)
                .then(result => {
                  h.render(result, renderOpts)
                })
            case 'mutate':
              return client.mutate(data, vars)
                .then(result => {
                  h.render(result, renderOpts)
                })
            default:
              if (!argv.save) {
                throw new Error(__('Error : unsupported operation'))
              }
          }
        })
        .then(() => {
          if (argv.save) {
            !argv.dryrun && config.save()
            h.print.err(chalk.yellow.bold(__('options successfully saved')))
          }
        })
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
}

module.exports = {
  __,
  exec,
}
