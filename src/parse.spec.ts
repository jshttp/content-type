import { describe, it, assert } from "vitest";
import { parse } from "./index";

var invalidTypes = [
  " ",
  "null",
  "undefined",
  "/",
  "text / plain",
  "text/;plain",
  'text/"plain"',
  "text/p£ain",
  "text/(plain)",
  "text/@plain",
  "text/plain,wrong",
];

describe("parse(string)", function () {
  it("should parse basic type", function () {
    var type = parse("text/html");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {},
    });
  });

  it("should parse with suffix", function () {
    var type = parse("image/svg+xml");
    assert.deepEqual(type, {
      type: "image/svg+xml",
      parameters: {},
    });
  });

  it("should parse basic type with surrounding OWS", function () {
    var type = parse(" text/html ");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {},
    });
  });

  it("should parse parameters", function () {
    var type = parse("text/html; charset=utf-8; foo=bar");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "utf-8",
        foo: "bar",
      },
    });
  });

  it("should parse parameters with extra LWS", function () {
    var type = parse("text/html ; charset=utf-8 ; foo=bar");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "utf-8",
        foo: "bar",
      },
    });
  });

  it("should lower-case type", function () {
    var type = parse("IMAGE/SVG+XML");
    assert.deepEqual(type, {
      type: "image/svg+xml",
      parameters: {},
    });
  });

  it("should lower-case parameter names", function () {
    var type = parse("text/html; Charset=UTF-8");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "UTF-8",
      },
    });
  });

  it("should unquote parameter values", function () {
    var type = parse('text/html; charset="UTF-8"');
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "UTF-8",
      },
    });
  });

  it("should unquote parameter values with escapes", function () {
    var type = parse('text/html; charset = "UT\\F-\\\\\\"8\\""');
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: 'UTF-\\"8"',
      },
    });
  });

  it("should handle balanced quotes", function () {
    var type = parse(
      'text/html; param="charset=\\"utf-8\\"; foo=bar"; bar=foo',
    );
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        param: 'charset="utf-8"; foo=bar',
        bar: "foo",
      },
    });
  });

  invalidTypes.forEach(function (type) {
    it("should throw on invalid media type " + type, function () {
      assert.throws(parse.bind(null, type), /invalid media type/);
    });
  });

  it("should throw on invalid parameter format", function () {
    assert.throws(
      parse.bind(null, 'text/plain; foo="bar'),
      /invalid parameter format/,
    );
    assert.throws(
      parse.bind(null, "text/plain; profile=http://localhost; foo=bar"),
      /invalid parameter format/,
    );
    assert.throws(
      parse.bind(null, "text/plain; profile=http://localhost"),
      /invalid parameter format/,
    );
  });

  it("should require argument", function () {
    assert.throws(parse.bind(null, undefined as any), /string.*required/);
  });

  it("should reject non-strings", function () {
    assert.throws(parse.bind(null, 7 as any), /string.*required/);
  });
});

describe("parse(req)", function () {
  it("should parse content-type header", function () {
    var req = { headers: { "content-type": "text/html" } };
    var type = parse(req);
    assert.strictEqual(type.type, "text/html");
  });

  it("should reject objects without headers property", function () {
    assert.throws(parse.bind(null, {}), /content-type header is missing/);
  });

  it("should reject missing content-type", function () {
    var req = { headers: {} };
    assert.throws(parse.bind(null, req), /content-type header is missing/);
  });
});

describe("parse(res)", function () {
  it("should parse content-type header", function () {
    var res = {
      getHeader: function () {
        return "text/html";
      },
    };
    var type = parse(res);
    assert.strictEqual(type.type, "text/html");
  });

  it("should reject objects without getHeader method", function () {
    assert.throws(parse.bind(null, {}), /content-type header is missing/);
  });

  it("should reject missing content-type", function () {
    var res = { getHeader: function () {} };
    assert.throws(parse.bind(null, res), /content-type header is missing/);
  });
});
