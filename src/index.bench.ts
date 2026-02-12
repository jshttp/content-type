import { bench, describe } from "vitest";
import { format, parse } from "./index";

describe("parse", () => {
  const BASIC_HEADER = "text/html";
  const PARAMS_HEADER = "application/json; charset=utf-8; foo=bar; version=1";
  const QUOTED_HEADER =
    'text/plain; filename="report\\"-2026.csv"; foo=bar; version=1';
  const OWS_HEADER =
    "application/json; \t  charset = utf-8 ;\t foo = bar ; version = 1";
  const MANY_PARAMS_HEADER =
    "application/json; a=1; b=2; c=3; d=4; e=5; f=6; g=7; h=8; i=9; j=10";
  const ESCAPED_HEAVY_HEADER =
    'text/plain; filename="quarterly\\\\report\\"-2026.csv"; path="C:\\\\temp\\\\files"; note="a\\\\b\\\\c\\\\d"; version=1';

  bench("basic", () => {
    parse(BASIC_HEADER);
  });

  bench("simple parameters", () => {
    parse(PARAMS_HEADER);
  });

  bench("quoted and escaped parameters", () => {
    parse(QUOTED_HEADER);
  });

  bench("OWS-heavy parameters", () => {
    parse(OWS_HEADER);
  });

  bench("many parameters", () => {
    parse(MANY_PARAMS_HEADER);
  });

  bench("escape-heavy quoted parameters", () => {
    parse(ESCAPED_HEAVY_HEADER);
  });
});

describe("format", () => {
  const BASIC_OBJECT = { type: "text/html" };
  const PARAMS_OBJECT = {
    type: "application/json",
    parameters: {
      charset: "utf-8",
      profile: "urn:example:v1",
      version: "1",
    },
  };
  const QUOTED_OBJECT = {
    type: "text/plain",
    parameters: {
      filename: 'report"-2026.csv',
      foo: "test=bar",
      q: "0.9",
    },
  };

  bench("basic", () => {
    format(BASIC_OBJECT);
  });

  bench("simple parameters", () => {
    format(PARAMS_OBJECT);
  });

  bench("quoted and escaped parameters", () => {
    format(QUOTED_OBJECT);
  });
});
