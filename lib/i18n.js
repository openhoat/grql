const path = require('path')
const yargs = require('yargs')
const { __, __n } = require('y18n')({
  directory: path.join(__dirname, '..', 'locales'),
  updateFiles: false,
  locale: yargs.locale()
})

exports = module.exports = {__, __n}
