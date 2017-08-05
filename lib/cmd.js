const grql = require('./grql')
const h = require('./helper')

const args = process.argv.slice(2)
grql.exec({ args })
  .catch(() => {
    h.exit(1)
  })
