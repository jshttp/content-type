import { assert, describe, it } from "vitest";
import { isTokenValid, isTypeValid } from "./index.js";

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

  it("should default the end index to the string length", function () {
    assert.strictEqual(isTypeValid(";text/html", 1), true);
  });

  it.each([
    ["text/html;", 0, 9, true],
    [";text/html;", 1, 10, true],
    [";a/b;", 1, 4, true],
    [";text/html;", 0, 10, false],
    [";text/html;", 1, 11, false],
    [";text/html;", 5, 10, false],
    [";text/html;", 1, 6, false],
    [";text/html;", 1, 5, false],
    [";text/html/extra;", 1, 16, false],
    [";text/ plain;", 1, 12, false],
    [";text/html;", 1, 1, false],
    [";text/html;", 10, 1, false],
  ])(
    "should validate type %j from %i to %i as %s",
    function (type, start, end, expected) {
      assert.strictEqual(isTypeValid(type, start, end), expected);
    },
  );
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

  it("should default the end index to the string length", function () {
    assert.strictEqual(isTokenValid(";charset", 1), true);
  });

  it.each([
    ["charset=", 0, 7, true],
    [";charset=", 1, 8, true],
    [";a=", 1, 2, true],
    [";charset=", 0, 8, false],
    [";charset=", 1, 9, false],
    [";char set=", 1, 9, false],
    [";char/set=", 1, 9, false],
    [";chärset=", 1, 8, false],
    [";charset=", 1, 1, false],
    [";charset=", 8, 1, false],
  ])(
    "should validate parameter name %j from %i to %i as %s",
    function (name, start, end, expected) {
      assert.strictEqual(isTokenValid(name, start, end), expected);
    },
  );
});
