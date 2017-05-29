const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const YAML = require('yamljs')
const tty = require('tty')
const yargonaut = require('yargonaut')
const chalk = yargonaut.chalk()
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
      envFields: ['user', 'password', 'baseurl'],
      settings: {
        defaultEnv: 'graphqlhub',
        env: {
          graphqlhub: {
            baseurl: 'https://www.graphqlhub.com/graphql'
          }
        }
      }
    }, defaultConfig)
  }

  load() {
    try {
      this.configFile && _.merge(this.settings, YAML.load(this.configFile))
      this.cleanEnv()
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
    this.cleanEnv()
    fs.writeFileSync(this.configFile, YAML.stringify(_.pickBy(this.settings, _.identity), 4, 2))
    fs.chmodSync(this.configFile, '400')
  }

  cleanEnv() {
    this.settings.env = _.mapValues(this.settings.env, value => _.pick(value, this.envFields))
  }

}

exports = module.exports = new Config()
