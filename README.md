# content-type

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][ci-image]][ci-url]
[![Coverage Status][coveralls-image]][coveralls-url]

Create and parse HTTP `Content-Type` header.

## Installation

```sh
npm install content-type
```

## API

```js
const contentType = require("content-type");
```

### contentType.parse(string)

```js
const obj = contentType.parse("image/svg+xml; charset=utf-8");
```

Parse a `Content-Type` header. This will return an object with the following properties (examples are shown for the string `'image/svg+xml; charset=utf-8'`):

- `type`: The media type. Example: `'image/svg+xml'`.
- `parameters`: An optional object of the parameters in the media type (parameter name is always lower case). Example: `{charset: 'utf-8'}`.

The parser is lenient, but will throw a `TypeError` when unable to parse a parameter due to ambiguity. E.g. `foo="` where the quote is unterminated.

### contentType.format(obj)

```js
const str = contentType.format({
  type: "image/svg+xml",
  parameters: { charset: "utf-8" },
});
```

Format an object into a `Content-Type` header. This will return a string of the content type for the given object with the following properties (examples are shown that produce the string `'image/svg+xml; charset=utf-8'`):

- `type`: The media type (will be lower-cased). Example: `'image/svg+xml'`.
- `parameters`: An optional object of the parameters in the media type. Example: `{charset: 'utf-8'}`.

Throws a `TypeError` if the object contains an invalid type or parameter names.

## License

[MIT](LICENSE)

[ci-image]: https://badgen.net/github/checks/jshttp/content-type/master?label=ci
[ci-url]: https://github.com/jshttp/content-type/actions/workflows/ci.yml
[coveralls-image]: https://badgen.net/codecov/c/github/jshttp/content-type/master
[coveralls-url]: https://codecov.io/gh/jshttp/content-type
[node-image]: https://badgen.net/npm/node/content-type
[node-url]: https://nodejs.org/en/download
[npm-downloads-image]: https://badgen.net/npm/dm/content-type
[npm-url]: https://npmjs.org/package/content-type
[npm-version-image]: https://badgen.net/npm/v/content-type
