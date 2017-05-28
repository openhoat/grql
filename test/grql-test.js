const chai = require('chai')
const expect = chai.expect
const grql = require('../lib/grql')

describe('grql', function() {

  this.timeout(10000)

  it('should return an error if no argument', () => grql()
    .then(
      result => {
        throw new Error('should no return a result')
      },
      err => {
        expect(err).to.be.an('error')
        expect(err).to.have.property('message', grql.__('Error : missing argument'))
      }
    )
  )

  it('should show help', () => grql('--help')
    .then(result => {
      expect(result).to.have.property('stderr').that.is.a('string')
    })
  )

})
