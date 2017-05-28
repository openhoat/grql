const Promise = require('bluebird')
const express = require('express')
const graphqlHTTP = require('express-graphql')
const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require('graphql')
let app, server

exports.schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      hello: {
        type: GraphQLString,
        resolve() {
          return 'world'
        }
      }
    }
  })
})

exports.start = () => Promise.resolve()
  .then(() => {
    app = express()
    app.use('/graphql', graphqlHTTP({
      schema: exports.schema,
      graphiql: true
    }))
    return new Promise(resolve => {
      server = app.listen(resolve)
    })
  })

exports.stop = () => Promise.resolve()
  .then(() => {
    if (server) {
      return new Promise(resolve => server.close(resolve))
        .then(() => {
          app = server = null
        })
    }
  })

exports.getPort = () => server && server.address().port
