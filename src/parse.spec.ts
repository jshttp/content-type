import { describe, it, assert } from "vitest";
import { parse } from "./index";

const invalidTypes = [
  " ",
  "null",
  "undefined",
  "/",
  "text / plain",
  "text/$plain",
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
    });
  });

  it.each(invalidTypes)("should accept invalid types: %s", function (str) {
    assert.deepEqual(parse(str), {
      type: str.trim().toLowerCase(),
    });
  });

  it("should parse with suffix", function () {
    const type = parse("image/svg+xml");
    assert.deepEqual(type, {
      type: "image/svg+xml",
    });
  });

  it("should parse basic type with surrounding OWS", function () {
    const type = parse(" text/html ");
    assert.deepEqual(type, {
      type: "text/html",
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

  it("should parse empty parameter value", function () {
    const type = parse("text/html; charset=");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "",
      },
    });
  });

  it("should parse empty parameter value with quotes", function () {
    const type = parse('text/html; charset=""');
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "",
      },
    });
  });

  it("should parse empty parameter value with OWS", function () {
    const type = parse("text/html; charset= ");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "",
      },
    });
  });

  it("should parse parameters with OWS around equals", function () {
    const type = parse("text/html; charset = utf-8");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "utf-8",
      },
    });
  });

  it("should lower-case type", function () {
    const type = parse("IMAGE/SVG+XML");
    assert.deepEqual(type, {
      type: "image/svg+xml",
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

  it("should error on unterminated quoted parameter", function () {
    assert.throws(
      () => parse('text/plain; foo="bar'),
      /Unexpected end of input at index 20/,
    );
  });

  it("should error on non-OWS after closing quote", function () {
    assert.throws(
      parse.bind(null, 'text/plain; foo="bar"baz'),
      /Unexpected characters after parameter at index 21/,
    );
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
});
