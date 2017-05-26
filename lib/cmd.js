const yargs = require('yargs')
const util = require('util')
const chalk = require('chalk')
const config = require('./config')
const { __ } = require('./i18n')

exports = module.exports = yargs
  .usage(util.format(__('Usage') + ': %s [%s] [%s]',
    chalk.bold(config.cmdName),
    chalk.cyan.bold('options'),
    chalk.bold.yellow('data')
  ))
  .wrap(120)
  .options({
    'conf': {
      description: chalk.cyan.bold(__('configuration name')),
      type: 'string',
      alias: 'c',
    }
  })
  .options({
    'baseurl': {
      description: chalk.cyan.bold(__('graphql server base url')),
      type: 'string',
      alias: 'b',
    }
  })
  .options({
    'user': {
      description: chalk.cyan.bold(__('basic authentication user')),
      type: 'string',
      alias: 'u',
    }
  })
  .options({
    'password': {
      description: chalk.cyan.bold(__('basic authentication password')),
      type: 'string',
      alias: 'p',
    }
  })
  .options({
    'query': {
      description: chalk.cyan.bold(__('get or set query name')),
      type: 'string',
      alias: 'q',
    }
  })
  .options({
    'save': {
      description: chalk.cyan.bold(__('persists options to file (%s)', config.configFile)),
      type: 'boolean',
      alias: 's',
    }
  })
  .options({
    'yaml': {
      description: chalk.cyan.bold(__('show result in pretty YAML format')),
      type: 'boolean',
      alias: 'y',
    }
  })
  .example(`${config.cmdName} '{ giphy { random(tag:"superbike") { url } } }'`)
  .epilogue(__('for more information, contact'))
