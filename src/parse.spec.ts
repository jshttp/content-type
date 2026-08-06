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
      index: 0,
      parameters: {},
    });
  });

  it("should parse basic type", function () {
    const type = parse("text/html");
    assert.deepEqual(type, {
      type: "text/html",
      index: 9,
      parameters: {},
    });
  });

  it.each(invalidTypes)("should accept invalid types: %s", function (str) {
    assert.deepEqual(parse(str), {
      type: str.trim().toLowerCase(),
      index: str.length,
      parameters: {},
    });
  });

  it("should parse with suffix", function () {
    const type = parse("image/svg+xml");
    assert.deepEqual(type, {
      type: "image/svg+xml",
      index: 13,
      parameters: {},
    });
  });

  it("should parse basic type with surrounding OWS", function () {
    const type = parse(" text/html ");
    assert.deepEqual(type, {
      type: "text/html",
      index: 11,
      parameters: {},
    });
  });

  it("should parse parameters", function () {
    const type = parse("text/html; charset=utf-8; foo=bar");
    assert.deepEqual(type, {
      type: "text/html",
      index: 33,
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
      index: 35,
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
      index: 19,
      parameters: {
        charset: "",
      },
    });
  });

  it("should parse empty parameter value with quotes", function () {
    const type = parse('text/html; charset=""');
    assert.deepEqual(type, {
      type: "text/html",
      index: 21,
      parameters: {
        charset: "",
      },
    });
  });

  it("should parse empty parameter value with OWS", function () {
    const type = parse("text/html; charset= ");
    assert.deepEqual(type, {
      type: "text/html",
      index: 20,
      parameters: {
        charset: "",
      },
    });
  });

  it("should parse parameters with OWS around equals", function () {
    const type = parse("text/html; charset = utf-8");
    assert.deepEqual(type, {
      type: "text/html",
      index: 26,
      parameters: {
        charset: "utf-8",
      },
    });
  });

  it("should lower-case type", function () {
    const type = parse("IMAGE/SVG+XML");
    assert.deepEqual(type, {
      type: "image/svg+xml",
      index: 13,
      parameters: {},
    });
  });

  it("should lower-case parameter names", function () {
    const type = parse("text/html; Charset=UTF-8");
    assert.deepEqual(type, {
      type: "text/html",
      index: 24,
      parameters: {
        charset: "UTF-8",
      },
    });
  });

  it("should unquote parameter values", function () {
    const type = parse('text/html; charset="UTF-8"');
    assert.deepEqual(type, {
      type: "text/html",
      index: 26,
      parameters: {
        charset: "UTF-8",
      },
    });
  });

  it("should unquote parameter values with escapes", function () {
    const type = parse('text/html; charset = "UT\\F-\\\\\\"8\\""');
    assert.deepEqual(type, {
      type: "text/html",
      index: 35,
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
      index: 54,
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
      index: 38,
      parameters: {
        charset: "utf-8",
        foo: "bar",
      },
    });
  });

  it("should ignore unterminated quoted parameter", function () {
    assert.deepEqual(parse('text/plain; foo="bar'), {
      type: "text/plain",
      index: 20,
      parameters: {},
    });
  });

  it("should ignore unterminated quoted parameter with backslash", function () {
    assert.deepEqual(parse('text/plain; foo="bar\\'), {
      type: "text/plain",
      index: 21,
      parameters: {},
    });
  });

  it("should parse and ignore non-OWS after closing quote", function () {
    assert.deepEqual(parse('text/plain; foo="bar"baz'), {
      type: "text/plain",
      index: 24,
      parameters: {
        foo: "bar",
      },
    });
  });

  it("should continue parsing after non-OWS", function () {
    const type = parse('text/plain; foo="bar"baz; charset=utf-8');
    assert.deepEqual(type, {
      type: "text/plain",
      index: 39,
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
      index: 23,
      parameters: {
        foo: 'bar"baz',
      },
    });
  });

  it("should allow equals in unquoted parameter values", function () {
    const type = parse("text/plain; foo=bar=baz");
    assert.deepEqual(type, {
      type: "text/plain",
      index: 23,
      parameters: {
        foo: "bar=baz",
      },
    });
  });

  it("should ignore duplicate parameters", function () {
    const type = parse("text/html; charset=utf-8; charset=iso-8859-1");
    assert.deepEqual(type, {
      type: "text/html",
      index: 44,
      parameters: {
        charset: "utf-8",
      },
    });
  });

  it("should ignore duplicate parameters with different case", function () {
    const type = parse("text/html; Charset=utf-8; charset=iso-8859-1");
    assert.deepEqual(type, {
      type: "text/html",
      index: 44,
      parameters: {
        charset: "utf-8",
      },
    });
  });

  it("should ignore duplicate parameters with quotes", function () {
    const type = parse('text/html; Charset="utf-8"; charset="iso-8859-1"');
    assert.deepEqual(type, {
      type: "text/html",
      index: 48,
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
      index: 9,
      parameters: {},
    });
  });

  it("should start parsing at options.start", function () {
    const type = parse("ignored, text/html; charset=utf-8", { start: 9 });
    assert.deepEqual(type, {
      type: "text/html",
      index: 33,
      parameters: {
        charset: "utf-8",
      },
    });
  });

  it("should parse successive values in an Accept header", function () {
    const header = "text/html, application/json;q=0.9, */*;q=0.8";

    assert.deepEqual(parse(header, { comma: true }), {
      type: "text/html",
      index: 9,
      parameters: {},
    });
    assert.deepEqual(parse(header, { comma: true, start: 10 }), {
      type: "application/json",
      index: 33,
      parameters: {
        q: "0.9",
      },
    });
    assert.deepEqual(parse(header, { comma: true, start: 34 }), {
      type: "*/*",
      index: 44,
      parameters: {
        q: "0.8",
      },
    });
  });

  it("should exit early on a comma when options.comma is true", function () {
    const type = parse("text/html, application/json", { comma: true });
    assert.deepEqual(type, {
      type: "text/html",
      index: 9,
      parameters: {},
    });
  });

  it("should exit early after parameters when options.comma is true", function () {
    const type = parse(
      "text/html; charset=utf-8, application/json; charset=utf-16",
      { comma: true },
    );
    assert.deepEqual(type, {
      type: "text/html",
      index: 24,
      parameters: {
        charset: "utf-8",
      },
    });
  });

  it("should exit early after an invalid parameter when options.comma is true", function () {
    const type = parse("text/html; invalid, application/json", {
      comma: true,
    });
    assert.deepEqual(type, {
      type: "text/html",
      index: 18,
      parameters: {},
    });
  });

  it("should not exit on a comma inside quotes", function () {
    const type = parse(
      'text/html; profile="compact,print"; charset=utf-8, application/json',
      { comma: true },
    );
    assert.deepEqual(type, {
      type: "text/html",
      index: 49,
      parameters: {
        profile: "compact,print",
        charset: "utf-8",
      },
    });
  });

  it("should preserve commas by default", function () {
    const type = parse("text/html, application/json");
    assert.deepEqual(type, {
      type: "text/html, application/json",
      index: 27,
      parameters: {},
    });
  });
});
