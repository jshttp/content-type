import { describe, it, assert } from "vitest";
import { format } from "./index";

describe("format(obj)", function () {
  it("should format basic type", function () {
    const str = format({ type: "text/html" });
    assert.strictEqual(str, "text/html");
  });

  it("should format type with suffix", function () {
    const str = format({ type: "image/svg+xml" });
    assert.strictEqual(str, "image/svg+xml");
  });

  it("should format type with parameter", function () {
    const str = format({
      type: "text/html",
      parameters: { charset: "utf-8" },
    });
    assert.strictEqual(str, "text/html; charset=utf-8");
  });

  it("should format type with parameter that needs quotes", function () {
    const str = format({
      type: "text/html",
      parameters: { foo: 'bar or "baz"' },
    });
    assert.strictEqual(str, 'text/html; foo="bar or \\"baz\\""');
  });

  it("should format type with parameter with empty value", function () {
    const str = format({
      type: "text/html",
      parameters: { foo: "" },
    });
    assert.strictEqual(str, 'text/html; foo=""');
  });

  it("should format type with multiple parameters", function () {
    const str = format({
      type: "text/html",
      parameters: { charset: "utf-8", foo: "bar", bar: "baz" },
    });
    assert.strictEqual(str, "text/html; charset=utf-8; foo=bar; bar=baz");
  });

  it("should reject invalid type", function () {
    const obj = { type: "text/" };
    assert.throws(format.bind(null, obj), /Invalid type: text\//);
  });

  it("should reject invalid type with LWS", function () {
    const obj = { type: " text/html" };
    assert.throws(format.bind(null, obj), /Invalid type:  text\/html/);
  });

  it("should reject invalid parameter name", function () {
    const obj = { type: "image/svg", parameters: { "foo/": "bar" } };
    assert.throws(format.bind(null, obj), /Invalid parameter name: foo\//);
  });

  it("should reject invalid parameter value", function () {
    const obj = { type: "image/svg", parameters: { foo: "bar\u0000" } };
    assert.throws(format.bind(null, obj), /Invalid parameter value: bar\u0000/);
  });
});
