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
  it("should parse empty string", function () {
    const type = parse("");
    assert.deepEqual(type, {
      type: "",
      parameters: {},
    });
  });

  it("should parse basic type", function () {
    const type = parse("text/html");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {},
    });
  });

  it.each(invalidTypes)("should accept invalid types: %s", function (str) {
    assert.deepEqual(parse(str), {
      type: str.trim().toLowerCase(),
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
    const type = parse("text/html;;;; charset=utf-8;; foo=bar;");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "utf-8",
        foo: "bar",
      },
    });
  });

  it("should ignore unterminated quoted parameter", function () {
    assert.deepEqual(parse('text/plain; foo="bar'), {
      type: "text/plain",
      parameters: {},
    });
  });

  it("should ignore unterminated quoted parameter with backslash", function () {
    assert.deepEqual(parse('text/plain; foo="bar\\'), {
      type: "text/plain",
      parameters: {},
    });
  });

  it("should parse and ignore non-OWS after closing quote", function () {
    assert.deepEqual(parse('text/plain; foo="bar"baz'), {
      type: "text/plain",
      parameters: {
        foo: "bar",
      },
    });
  });

  it("should continue parsing after non-OWS", function () {
    const type = parse('text/plain; foo="bar"baz; charset=utf-8');
    assert.deepEqual(type, {
      type: "text/plain",
      parameters: {
        foo: "bar",
        charset: "utf-8",
      },
    });
  });

  it("should allow quotes in unquoted parameter values", function () {
    const type = parse('text/plain; foo=bar"baz');
    assert.deepEqual(type, {
      type: "text/plain",
      parameters: {
        foo: 'bar"baz',
      },
    });
  });

  it("should allow equals in unquoted parameter values", function () {
    const type = parse("text/plain; foo=bar=baz");
    assert.deepEqual(type, {
      type: "text/plain",
      parameters: {
        foo: "bar=baz",
      },
    });
  });

  it("should ignore duplicate parameters", function () {
    const type = parse("text/html; charset=utf-8; charset=iso-8859-1");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "utf-8",
      },
    });
  });

  it("should ignore duplicate parameters with different case", function () {
    const type = parse("text/html; Charset=utf-8; charset=iso-8859-1");
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "utf-8",
      },
    });
  });

  it("should ignore duplicate parameters with quotes", function () {
    const type = parse('text/html; Charset="utf-8"; charset="iso-8859-1"');
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {
        charset: "utf-8",
      },
    });
  });

  it("should skip parsing parameters when options.parameters is false", function () {
    const type = parse("text/html; charset=utf-8; foo=bar", {
      parameters: false,
    });
    assert.deepEqual(type, {
      type: "text/html",
      parameters: {},
    });
  });
});
