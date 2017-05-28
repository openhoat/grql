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
    'env': {
      description: chalk.cyan.bold(__('select environment')),
      type: 'string',
      alias: 'e',
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
  .options({
    'verbose': {
      description: chalk.cyan.bold(__('set verbose mode')),
      type: 'boolean',
      alias: 'v',
    }
  })
  .options({
    'dryrun': {
      description: chalk.cyan.bold(__('set dry run mode')),
      type: 'boolean'
    }
  })
  .options({
    'version': {
      description: chalk.cyan.bold(__('show version')),
      type: 'boolean'
    }
  })
  .options({
    'nocolor': {
      description: chalk.cyan.bold(__('disable color mode')),
      type: 'boolean'
    }
  })
  .options({
    'var': {
      description: chalk.cyan.bold(__('set a variable used in query (format : key=value)')),
      type: 'string'
    }
  })
  .options({
    'fragment': {
      description: chalk.cyan.bold(__('create a fragment')),
      type: 'string',
      alias: 'f',
    }
  })
  .options({
    'mutation': {
      description: chalk.cyan.bold(__('send graphql mutation')),
      type: 'boolean',
      alias: 'm',
    }
  })
  .example(`${config.cmdName} '{ giphy { random(tag:"superbike") { url } } }'`)
  .epilogue(__('for more information, contact'))
