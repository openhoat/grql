const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const YAML = require('yamljs')
const tty = require('tty')
const chalk = require('chalk')
const pkg = require('../package')
const isWin = /^win/.test(process.platform)
const userHome = process.env[isWin ? 'USERPROFILE' : 'HOME']
const isatty = tty.isatty(process.stdout.fd)

chalk.enabled = isatty

class Config {

  constructor(defaultConfig) {
    _.merge(this, {
      cmdName: pkg.name,
      configFile: path.join(userHome, `.${pkg.name}.yml`),
      configurationFields: ['user', 'password', 'baseurl', 'introspectionQueryFile'],
      settings: {
        defaultConfiguration: 'graphqlhub',
        configurations: {
          graphqlhub: {
            baseurl: 'https://www.graphqlhub.com/graphql',
            introspectionQueryFile: path.join(__dirname, '..', 'etc', 'graphqlhub-introspection-query.graphql')
          }
        }
      }
    }, defaultConfig)
  }

  load() {
    try {
      this.configFile && _.merge(this.settings, YAML.load(this.configFile))
      this.cleanConfigurations()
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.warn('settings file "%s" does not exist : create default', this.configFile)
        this.save()
      } else {
        console.error(err)
      }
    }
    return this
  }

  save() {
    try {
      fs.chmodSync(this.configFile, '600')
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
    this.cleanConfigurations()
    fs.writeFileSync(this.configFile, YAML.stringify(_.pickBy(this.settings, _.identity), 4, 2))
    fs.chmodSync(this.configFile, '400')
  }

  cleanConfigurations() {
    this.settings.configurations = _.mapValues(this.settings.configurations,
      value => _.pick(value, this.configurationFields)
    )
  }

}

exports = module.exports = new Config()
