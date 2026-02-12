import { describe, it, assert } from "vitest";
import { format } from "./index";

describe("format(obj)", function () {
  it("should format basic type", function () {
    var str = format({ type: "text/html" });
    assert.strictEqual(str, "text/html");
  });

  it("should format type with suffix", function () {
    var str = format({ type: "image/svg+xml" });
    assert.strictEqual(str, "image/svg+xml");
  });

  it("should format type with parameter", function () {
    var str = format({
      type: "text/html",
      parameters: { charset: "utf-8" },
    });
    assert.strictEqual(str, "text/html; charset=utf-8");
  });

  it("should format type with parameter that needs quotes", function () {
    var str = format({
      type: "text/html",
      parameters: { foo: 'bar or "baz"' },
    });
    assert.strictEqual(str, 'text/html; foo="bar or \\"baz\\""');
  });

  it("should format type with parameter with empty value", function () {
    var str = format({
      type: "text/html",
      parameters: { foo: "" },
    });
    assert.strictEqual(str, 'text/html; foo=""');
  });

  it("should format type with multiple parameters", function () {
    var str = format({
      type: "text/html",
      parameters: { charset: "utf-8", foo: "bar", bar: "baz" },
    });
    assert.strictEqual(str, "text/html; bar=baz; charset=utf-8; foo=bar");
  });

  it("should require argument", function () {
    assert.throws(
      format.bind(null, undefined as any),
      /argument obj is required/,
    );
  });

  it("should reject non-objects", function () {
    assert.throws(format.bind(null, 7 as any), /argument obj is required/);
  });

  it("should require type", function () {
    var obj = {};
    assert.throws(format.bind(null, obj as any), /invalid type/);
  });

  it("should reject invalid type", function () {
    var obj = { type: "text/" };
    assert.throws(format.bind(null, obj), /invalid type/);
  });

  it("should reject invalid type with LWS", function () {
    var obj = { type: " text/html" };
    assert.throws(format.bind(null, obj), /invalid type/);
  });

  it("should reject invalid parameter name", function () {
    var obj = { type: "image/svg", parameters: { "foo/": "bar" } };
    assert.throws(format.bind(null, obj), /invalid parameter name/);
  });

  it("should reject invalid parameter value", function () {
    var obj = { type: "image/svg", parameters: { foo: "bar\u0000" } };
    assert.throws(format.bind(null, obj), /invalid parameter value/);
  });
});
