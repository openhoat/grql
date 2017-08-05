const chai = require('chai')
const expect = chai.expect
const { Readable } = require('stream')
const helper = require('../lib/helper')

describe('helper', () => {
  const exit = process.exit

  after(() => {
    process.exit = exit
  })

  it('should exit', done => {
    const exitCodes = []
    process.exit = code => {
      exitCodes.push(code)
    }
    helper.exit(1)
    helper.exit()
    helper.exit(2)
    process.nextTick(() => {
      expect(exitCodes).to.eql([1, 0, 2])
      done()
    })
  })

  it('should read stdin content', async () => {
    const content = 'hello world!\nfoo bar!'
    const stdin = new Readable({
      read(size) {
        this.cursor = typeof this.cursor === 'number' ? this.cursor : 0
        const result = this.cursor < size ? content.substring(this.cursor, size) : null
        if (result) {
          this.cursor += size
        }
        this.push(result)
      }
    })
    const result = await helper.readStdinContent(stdin)
    expect(result).to.equal(content)
  })

})
