const path = require('path')
const chalk = require('chalk')
const Lokka = require('lokka').Lokka
const { Transport } = require('lokka-transport-http')
const basicAuthHeader = require('basic-auth-header')
const prettyjson = require('prettyjson')
const _ = require('lodash')
const h = require('./helper')
const config = require('./config').load()
const cmd = require('./cmd')
const { __ } = require('./i18n')

h.readStdinContent()
  .then(content => {
    config.stdinContent = content
    const argv = cmd.argv
    _.set(config, 'settings.defaultConfiguration', argv.conf || _.get(config, 'settings.defaultConfiguration', 'default'))
    const confName = config.settings.defaultConfiguration
    _.set(config, `settings.configurations.${confName}`, _.get(config, `settings.configurations.${confName}`, {}))
    const conf = config.settings.configurations[confName]
    Object.assign(conf, _.pickBy(_.pick(argv, config.configurationFields), _.identity))
    const data = argv._[0] || config.stdinContent || (argv.query && _.get(config.settings, `queries.${argv.query}`))
    if (argv.intro) {
      conf.introspectionQueryFile = path.relative(process.cwd(), argv.intro)
    }
    if (argv.query && data) {
      _.set(config.settings, `queries.${argv.query}`, data)
    }
    if (argv.save) {
      config.save()
      h.print.err(chalk.yellow.bold('options successfully saved'))
    }
    if (data) {
      const transportOpt = {}
      if (conf.user) {
        _.merge(transportOpt, {
          headers: {
            'Authorization': basicAuthHeader(conf.user, conf.password)
          }
        })
      }
      const client = new Lokka({transport: new Transport(conf.baseUrl, transportOpt)})
      return client.query(data).then(result => {
        if (argv.yaml) {
          h.print.out(prettyjson.render(result, {emptyArrayMsg: __('(empty array)')}))
        } else if (typeof result !== 'object') {
          h.print.out(result ? chalk.bold(data) : chalk.cyan.bold('empty'))
        } else {
          h.print.out(chalk.bold(JSON.stringify(result, null, 2)))
        }
      })
    }
    if (argv._.length < 1) {
      return cmd.showHelp(help => {
        h.print.err(help)
        return h.exit(1)
      })
    }
  })
  .catch(err => {
    h.print.err(chalk.red.bold(err))
    h.exit(1)
  })
