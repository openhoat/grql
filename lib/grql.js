const chalk = require('chalk')
const Lokka = require('lokka').Lokka
const { Transport } = require('lokka-transport-http')
const basicAuthHeader = require('basic-auth-header')
const _ = require('lodash')
const { __ } = require('./i18n')
const h = require('./helper')
const config = require('./config').load()
const cmd = require('./cmd')

h.readStdinContent()
  .then(content => {
    config.stdinContent = content
    const argv = cmd.argv
    _.set(config, 'settings.defaultConfiguration', argv.conf ||
      _.get(config, 'settings.defaultConfiguration', 'default')
    )
    const confName = config.settings.defaultConfiguration
    h.print.out(chalk.gray(`using configuration '${confName}'`))
    _.set(config, `settings.configurations.${confName}`, _.get(config, `settings.configurations.${confName}`, {}))
    const conf = config.settings.configurations[confName]
    Object.assign(conf, _.pickBy(_.pick(argv, config.configurationFields), _.identity))
    const data = argv._[0] || config.stdinContent || (argv.query && _.get(config.settings, `queries.${argv.query}`))
    if (argv.query) {
      if (data) {
        _.set(config.settings, `queries.${argv.query}`, data)
      } else {
        h.print.err(chalk.bold.red(__("Error: query '%s' not found", argv.query)))
        return h.exit(1)
      }
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
      const client = new Lokka({transport: new Transport(conf.baseurl, transportOpt)})
      return client.query(data).then(result => {
        h.render(result, argv.yaml)
      })
    }
    if (argv._.length < 1) {
      if (typeof argv.conf !== 'undefined' && !argv.conf) {
        h.print.out(chalk.bold('configuration details :'))
        h.render(_.omit(conf, 'password'), argv.yaml)
        return
      }
      if (typeof argv.query !== 'undefined' && !argv.query) {
        h.print.out(chalk.bold('saved queries :'))
        h.render(_.get(config.settings, `queries`), argv.yaml)
        return
      }
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
