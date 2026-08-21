import { assert, describe, it } from "vitest";
import { isTokenValid, isTypeValid, parameterValue } from "./index.js";

describe("isTypeValid(type)", function () {
  it.each([
    "text/html",
    "IMAGE/SVG+XML",
    "application/vnd.example+json",
    "*/*",
    "!#$%&'*+-.^_`|~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/!#$%&'*+-.^_`|~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  ])("should accept valid type: %s", function (type) {
    assert.strictEqual(isTypeValid(type), true);
  });

  it.each([
    "",
    "/",
    "text",
    "text/",
    "/plain",
    "text/plain/extra",
    "text /plain",
    "text/ plain",
    "text/plain; charset=utf-8",
    "text/(plain)",
    "text/pläin",
    "text/\u0000plain",
  ])("should reject invalid type: %s", function (type) {
    assert.strictEqual(isTypeValid(type), false);
  });
});

describe("isTokenValid(name)", function () {
  it.each([
    "charset",
    "Charset",
    "profile-version",
    "!#$%&'*+-.^_`|~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  ])("should accept valid parameter name: %s", function (name) {
    assert.strictEqual(isTokenValid(name), true);
  });

  it.each([
    "",
    "profile version",
    "profile\tversion",
    "profile/version",
    'profile"version',
    "profile(version)",
    "profile,version",
    "profile:version",
    "profile;version",
    "profile<version>",
    "profile=version",
    "profile?version",
    "profile@version",
    "profile[version]",
    "profile\\version",
    "profile{version}",
    "pröfile",
    "profile\u0000version",
  ])("should reject invalid parameter name: %s", function (name) {
    assert.strictEqual(isTokenValid(name), false);
  });
});

describe("parameterValue(value)", function () {
  it.each([
    ["charset", "charset"],
    ["UTF-8", "UTF-8"],
    ["!#$%&'*+-.^_`|~", "!#$%&'*+-.^_`|~"],
  ])("should return token unchanged: %s", function (value, expected) {
    assert.strictEqual(parameterValue(value), expected);
  });

  it.each([
    ["", '""'],
    ["hello world", '"hello world"'],
    ["foo=bar", '"foo=bar"'],
    ["\t", '"\t"'],
    ["\u0080", '"\u0080"'],
    ["\u00ff", '"\u00ff"'],
  ])("should quote value: %s", function (value, expected) {
    assert.strictEqual(parameterValue(value), expected);
  });

  it("should escape quotes and backslashes", function () {
    assert.strictEqual(
      parameterValue(String.raw`quarterly\report"-2026.csv`),
      String.raw`"quarterly\\report\"-2026.csv"`,
    );
  });

  it.each([
    ["00", 0x00],
    ["08", 0x08],
    ["0a", 0x0a],
    ["1f", 0x1f],
    ["7f", 0x7f],
    ["100", 0x100],
    ["d800", 0xd800],
  ])("should reject invalid character code: 0x%s", function (_hex, code) {
    const value = `before${String.fromCharCode(code)}after`;
    assert.throws(() => parameterValue(value), /Invalid parameter value:/);
  });
});
