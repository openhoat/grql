const chai = require('chai')
const expect = chai.expect
const path = require('path')
const fs = require('fs')
const os = require('os')
const YAML = require('yamljs')
const Promise = require('bluebird')
const pkg = require('../package')

describe('grql', function() {
  let config, grql, sampleServer

  this.timeout(10000)

  before(() => {
    process.env['NODE_ENV'] = 'test'
    config = require('../lib/config')
    config.configFile = path.join(os.tmpdir(), `.${pkg.name}.yml`)
    grql = require('../lib/grql')
    sampleServer = require('./sample-server')
  })

  after(() => Promise.resolve()
    .then(() => {
      if (!config.configFile) {
        return
      }
      return Promise.fromCallback(cb => fs.unlink(config.configFile, cb))
    })
  )

  it('should return an error if no argument', () => grql()
    .then(
      result => {
        throw new Error('should no return a result')
      },
      err => {
        expect(err).to.be.an('error')
        expect(err).to.have.property('message', grql.__('Error : missing argument (try --help)'))
      }
    )
  )

  it('should show help', () => grql('--nocolor', '--help')
    .then(result => {
      expect(result).to.have.property('stderr').that.is.a('string')
    })
  )

  describe('sample server', () => {

    before(() => sampleServer.start()
      .then(() => {
        const port = sampleServer.getPort()
        return grql(
          '--nocolor',
          '-e', 'test',
          '-b', `http://localhost:${port}/graphql`,
          '-s'
        )
      })
    )

    after(() => sampleServer.stop())

    it('should return schema', () => grql('--nocolor', 'schema')
      .then(result => {
        expect(result).to.have.property('stdout')
        const out = JSON.parse(result.stdout)
        expect(Object.keys(out)).to.eql(['queryType',
          'mutationType',
          'subscriptionType',
          'types',
          'directives'
        ])
      })
    )

    it('should return hello', () => grql('--nocolor', 'query', '{ hello }')
      .then(result => {
        expect(result).to.have.property('stdout')
        const out = JSON.parse(result.stdout)
        expect(out).to.eql({hello: 'world'})
      })
    )

    it('should return hello in yaml format', () => grql('--nocolor', '-y', 'query', '{ hello }')
      .then(result => {
        expect(result).to.have.property('stdout')
        const out = YAML.parse(result.stdout)
        expect(out).to.eql({hello: 'world'})
      })
    )

  })

})
