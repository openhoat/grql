[![NPM version](https://badge.fury.io/js/grql.svg)](http://badge.fury.io/js/grql)
[![Build Status](https://travis-ci.org/openhoat/grql.png?branch=master)](https://travis-ci.org/openhoat/grql)
[![Coverage Status](https://coveralls.io/repos/github/openhoat/grql/badge.svg?branch=master)](https://coveralls.io/github/openhoat/grql?branch=master)
[![npm](https://img.shields.io/npm/l/express.svg?style=flat-square)]()

<a href="http://graphql.org/"><img src="http://graphql.org/img/logo.svg" width="100px" title="GraphQL"></a>

## GraphQL client command line

Simple command line to query any GraphQL servers.

- Sample default configuration with GraphQLHub server endpoint  
- Supports basic auth, fragments and mutations

## Installation

```
$ npm install grql -g
```

Install a bundled version to `$HOME/bin` :

```
$ npm run install
```
 
### Configuration

The configuration is stored into $HOME/.grql.yml, including environments settings and named queries.

## Usage

Show help :

```
$ grql --help
```

Example of query : get a Giffy image from GraphQLHub

```
$ grql query '{ giphy { random(tag:"superbike") { url } } }'
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

Use YAML output format :

```
$ grql query '{ giphy { random(tag:"superbike") { url } } }' -y
```

Result :

```yaml
giphy: 
  random: 
    url: http://giphy.com/gifs/gtr-UUWYxAvgO60X6
```

Show configured environments :

```
$ grql -e
environnements :
[ ] graphqlhub
[o] myenv
[ ] anotherenv
```

Specify your own graphql server :

```
$ grql --baseurl https://mysupergraphql.server/graphql query "{ myquery(foo: "bar") }"
```

Save own graphql server to a named configuration :

```
$ grql --baseurl https://mysupergraphql.server/graphql \
  --conf mysuperserver --save \
  query '{ myquery(foo: "bar") }'
```

Save a query :

```
$ grql --alias myquery query '{ myquery(foo: "bar") }' --save
```

Next, to replay the query :

```
$ grql --alias myquery query
```

### Query

The query content is passed either by command argument :

```
$ grql query '{ contact { username: "jdoe"} }'
```

or by stdin :

```
$ echo '{ contact { username: "jdoe"} }' | grql query 
```

### Fragments

Save a new fragment :

```
$ cat << EOM | grql fragment gifInfo -s
fragment on GiphyGIFData {
  id
  url
  images {
    original {
      url
    }
  }
}
EOM
```

Use it in a query :

```
$ grql query '{ giphy { random(tag:"superbike") { ...${gifInfo} } } }' -y
```

### Mutations

Change my details with my contacts graphql server :

```
$ cat << EOM | grql -e contacts mutate
{
  patchMe(input: {firstName: "John", lastName: "Doe"}) {
    id
    firstName
    lastName
    email
    username
  }
}
EOM
```

### Switches

- verbose : show more details
- dryrun : does not finally execute the query
- env : show current environment or select the specified environment
- nocolor : disable color mode
- alias : select an alias to save or play
- save : save options to current environment
- yaml : enable YAML output format
- var : inject a variable (format key=value)

Enjoy!
