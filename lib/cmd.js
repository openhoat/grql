const yargs = require('yargs')
const util = require('util')
const chalk = require('chalk')
const config = require('./config')
const { __ } = require('./i18n')

exports = module.exports = yargs
  .usage(util.format(__('Usage') + ': %s [%s] [%s] [%s]',
    chalk.bold(config.cmdName),
    chalk.bold.yellow(__('command')),
    chalk.bold.yellow(__('data')),
    chalk.cyan.bold('options')
  ))
  .wrap(120)
  .command('query', __('make a graphql query'))
  .command('mutate', __('make a graphql mutation'))
  .command('fragment', __('create a graphql fragment'))
  .command('schema', __('fetch graphql schema'))
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
    'alias': {
      description: chalk.cyan.bold(__('use or set query alias')),
      type: 'string',
      alias: 'a',
    }
  })
  .options({
    'save': {
      description: chalk.cyan.bold(__('save options to file (%s)', config.configFile)),
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
  .example(`${config.cmdName} '{ giphy { random(tag:"superbike") { url } } }'`)
  .epilogue(__('for more information, contact'))
