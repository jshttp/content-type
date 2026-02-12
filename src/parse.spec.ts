import { describe, it, assert } from "vitest";
import { parse } from "./index";

const invalidTypes = [
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
    const type = parse("text/html");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {},
    });
  });

  it("should parse with suffix", function () {
    const type = parse("image/svg+xml");
    assert.deepEqual(type, {
      type: "image/svg+xml",
      parameters: {},
    });
  });

  it("should parse basic type with surrounding OWS", function () {
    const type = parse(" text/html ");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {},
    });
  });

  it("should parse parameters", function () {
    const type = parse("text/html; charset=utf-8; foo=bar");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "utf-8",
        foo: "bar",
      },
    });
  });

  it("should parse parameters with extra LWS", function () {
    const type = parse("text/html ; charset=utf-8 ; foo=bar");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "utf-8",
        foo: "bar",
      },
    });
  });

  it("should lower-case type", function () {
    const type = parse("IMAGE/SVG+XML");
    assert.deepEqual(type, {
      type: "image/svg+xml",
      parameters: {},
    });
  });

  it("should lower-case parameter names", function () {
    const type = parse("text/html; Charset=UTF-8");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "UTF-8",
      },
    });
  });

  it("should unquote parameter values", function () {
    const type = parse('text/html; charset="UTF-8"');
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "UTF-8",
      },
    });
  });

  it("should unquote parameter values with escapes", function () {
    const type = parse('text/html; charset = "UT\\F-\\\\\\"8\\""');
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: 'UTF-\\"8"',
      },
    });
  });

  it("should handle balanced quotes", function () {
    const type = parse(
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

  it("should ignore extra semicolons", function () {
    var type = parse("text/html;;;; charset=utf-8;; foo=bar;");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "utf-8",
        foo: "bar",
      },
    });
  });

  invalidTypes.forEach(function (type) {
    it("should throw on invalid media type " + type, function () {
      assert.throws(parse.bind(null, type), /invalid media type/);
    });
  });

  it("should omit unterminated quoted parameters", function () {
    var type = parse('text/plain; foo="bar');
    assert.deepEqual(type, {
      type: "text/plain",
      parameters: {},
    });
  });

  it("should skip quoted parameters with non-OWS after closing quote", function () {
    var type = parse('text/plain; foo="bar"xyz; baz=qux');
    assert.deepEqual(type, {
      type: "text/plain",
      parameters: {
        baz: "qux",
      },
    });
  });

  it("should allow quotes in unquoted parameter values", function () {
    var type = parse('text/plain; foo=bar"baz');
    assert.deepEqual(type, {
      type: "text/plain",
      parameters: {
        foo: 'bar"baz',
      },
    });
  });

  it("should allow equals in unquoted parameter values", function () {
    var type = parse("text/plain; foo=bar=baz");
    assert.deepEqual(type, {
      type: "text/plain",
      parameters: {
        foo: "bar=baz",
      },
    });
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
    const req = { headers: { "content-type": "text/html" } };
    const type = parse(req);
    assert.strictEqual(type.type, "text/html");
  });

  it("should reject objects without headers property", function () {
    assert.throws(parse.bind(null, {}), /content-type header is missing/);
  });

  it("should reject missing content-type", function () {
    const req = { headers: {} };
    assert.throws(parse.bind(null, req), /content-type header is missing/);
  });
});

describe("parse(res)", function () {
  it("should parse content-type header", function () {
    const res = {
      getHeader: function () {
        return "text/html";
      },
    };
    const type = parse(res);
    assert.strictEqual(type.type, "text/html");
  });

  it("should reject objects without getHeader method", function () {
    assert.throws(parse.bind(null, {}), /content-type header is missing/);
  });

  it("should reject missing content-type", function () {
    const res = { getHeader: function () {} };
    assert.throws(parse.bind(null, res), /content-type header is missing/);
  });
});
