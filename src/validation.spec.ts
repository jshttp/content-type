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
