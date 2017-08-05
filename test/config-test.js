const path = require('path')
const fs = require('fs')
const chai = require('chai')
const expect = chai.expect
const shortid = require('shortid')
const pkg = require('../package')
const { Config, defaultConfig } = require('../lib/config')

describe('config', () => {

  const prefix = shortid.generate()
  const configFile = path.join('/tmp', `${pkg.name}_test_config_file_${prefix}.yml`)
  let config

  before(() => {
    process.env['NODE_ENV'] = 'test'
    config = new Config({ configFile })
  })

  after(() => {
    fs.unlinkSync(configFile)
  })

  it('should get default config', async () => {
    expect(config).to.have.property('cmdName', pkg.name)
    expect(config).to.eql(Object.assign(defaultConfig, { configFile }))
  })

  it('should save and load config file', () => {
    config.save()
    const conf = config.load()
    expect(conf === config).to.be.true
  })

  it('should fail to save and load bad config filename', () => {
    config.configFile = path.join('/tmp', prefix, `${pkg.name}_test_config_file_${prefix}.yml`)
    try {
      config.save()
      throw new Error('should throw an error')
    } catch (err) {
      expect(err).to.have.property('code', 'ENOENT')
    }
    try {
      config.load()
      throw new Error('should throw an error')
    } catch (err) {
      expect(err).to.have.property('code', 'ENOENT')
    }
  })

})
