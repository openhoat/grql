const chai = require('chai')
const expect = chai.expect
const path = require('path')
const fs = require('fs')
const os = require('os')
const YAML = require('yamljs')
const pkg = require('../package')

describe('grql', () => {
  let config, grql, sampleServer

  before(() => {
    process.env['NODE_ENV'] = 'test'
    config = require('../lib/config')
    config.configFile = path.join(os.tmpdir(), `.${pkg.name}.yml`)
    grql = require('../lib/grql')
    sampleServer = require('./sample-server')
    process.stdin.isTTY = true
  })

  after(() => {
    if (!config.configFile) {
      return
    }
    fs.unlinkSync(config.configFile)
  })

  describe('exec', () => {

    it('should return an error if no argument', async () => {
      try {
        await grql.exec()
        throw new Error('should not return a result')
      } catch (err) {
        expect(err).to.be.an('error')
        expect(err).to.have.property('message', grql.__('Error : missing argument (try --help)'))
      }
    })

    it('should show help', async () => {
      const stdout = {}
      const stderr = {}
      await grql.exec({ stdout, stderr, args: ['--nocolor', '--help'] })
      expect(stderr).to.have.property('data').that.is.a('string')
    })

    describe('sample server', () => {
      let stdout
      let stderr

      before(async () => {
        await sampleServer.start()
        const port = sampleServer.getPort()
        await grql.exec({
          args: [
            '--nocolor',
            '-e', 'test',
            '-b', `http://localhost:${port}/graphql`,
            '-s'
          ]
        })
      })

      after(() => sampleServer.stop())

      beforeEach(() => {
        stdout = {}
        stderr = {}
      })

      it('should return schema', async () => {
        await grql.exec({ stdout, stderr, args: ['--nocolor', 'schema'] })
        expect(stdout).to.have.property('data').that.is.a('string')
        const out = JSON.parse(stdout.data)
        expect(Object.keys(out)).to.eql(['queryType',
          'mutationType',
          'subscriptionType',
          'types',
          'directives'
        ])
      })

      it('should return hello', async () => {
        await grql.exec({ stdout, stderr, args: ['--nocolor', 'query', '{ hello }'] })
        expect(stdout).to.have.property('data').that.is.a('string')
        const out = JSON.parse(stdout.data)
        expect(out).to.eql({ hello: 'world' })
      })

      it('should return hello in yaml format', async () => {
        await grql.exec({ stdout, stderr, args: ['--nocolor', '-y', 'query', '{ hello }'] })
        expect(stdout).to.have.property('data').that.is.a('string')
        const out = YAML.parse(stdout.data)
        expect(out).to.eql({ hello: 'world' })
      })

    })

  })

})
