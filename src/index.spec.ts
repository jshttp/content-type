import { describe, it, assert } from "vitest";
import contentType from "./index";

describe("contentType", function () {
  it("should have a default export", function () {
    assert.strictEqual(typeof contentType, "object");
    assert.deepEqual(Object.keys(contentType), ["format", "parse"]);
    assert.strictEqual(typeof contentType.format, "function");
    assert.strictEqual(typeof contentType.parse, "function");
  });
});
