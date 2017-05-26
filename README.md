[![NPM version](https://badge.fury.io/js/grql.svg)](http://badge.fury.io/js/grql)

<a href="http://graphql.org/"><img src="http://graphql.org/img/logo.svg" width="100px" title="GraphQL"></a>

## GraphQL client command line

Simple command line to query GraphQL servers.

Sample default configuration with GraphQLHub server endpoint  

Supports basic auth.

### Configuration

The configuration (endpoints, etc) is stored into $HOME/.grql.yml

## Installation

```
$ npm install grql -g
```
 
## Usage

```
$ grql --help
```

### Get a Giffy image from GraphQLHub

```
$ grql '{ giphy { random(tag:"superbike") { url } } }'
```

Result :

```json
{
  "giphy": {
    "random": {
      "url": "http://giphy.com/gifs/rhmit-xKi2gX2tY7h3q"
    }
  }
}
```

### Use YAML output format

```
$ grql '{ giphy { random(tag:"superbike") { url } } }' -y
```

Result :

```yaml
giphy: 
  random: 
    url: http://giphy.com/gifs/gtr-UUWYxAvgO60X6
```

### Specify your own graphql server

```
$ grql --baseurl https://mysupergraphql.server/graphql "{ myquery(foo: "bar") }"
```

### Save own graphql server to a named configuration

```
$ grql --baseurl https://mysupergraphql.server/graphql --conf mysuperserver "{ myquery(foo: "bar") }" --save
```

Enjoy!
