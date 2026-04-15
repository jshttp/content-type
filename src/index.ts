/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

const TEXT_REGEXP = /^[\u0009\u0020-\u007e\u0080-\u00ff]*$/;
const TOKEN_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

/**
 * RegExp to match chars that must be quoted-pair in RFC 9110 sec 5.6.4
 */
const QUOTE_REGEXP = /[\\"]/g;

/**
 * RegExp to match type in RFC 9110 sec 8.3.1
 *
 * media-type = type "/" subtype
 * type       = token
 * subtype    = token
 */
const TYPE_REGEXP =
  /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

/**
 * Null object perf optimization. Faster than `Object.create(null)` and `{ __proto__: null }`.
 */
const NullObject = /* @__PURE__ */ (() => {
  const C = function () {};
  C.prototype = Object.create(null);
  return C;
})() as unknown as { new (): any };

/**
 * The content type object contains a type string and optional parameters.
 */
export interface ContentType {
  type: string;
  parameters?: Record<string, string>;
}

/**
 * Format an object into a `Content-Type` header.
 */
export function format(obj: ContentType): string {
  const { type, parameters } = obj;

  if (!type || !TYPE_REGEXP.test(type)) {
    throw new TypeError(`Invalid type: ${type}`);
  }

  let result = type;

  if (parameters) {
    for (const param of Object.keys(parameters)) {
      if (!TOKEN_REGEXP.test(param)) {
        throw new TypeError(`Invalid parameter name: ${param}`);
      }

      result += `; ${param}=${qstring(parameters[param])}`;
    }
  }

  return result;
}

/**
 * Options for parsing a `Content-Type` header.
 */
export interface ParseOptions {
  parameters?: boolean;
}

/**
 * Parse a `Content-Type` header.
 */
export function parse(header: string, options?: ParseOptions): ContentType {
  const len = header.length;
  const semiIndex = header.indexOf(";");
  const end = semiIndex !== -1 ? semiIndex : len;
  const valueStart = skipOWS(header, 0, end);
  const valueEnd = trailingOWS(header, valueStart, end);
  const type = header.slice(valueStart, valueEnd).toLowerCase();

  if (semiIndex === -1 || options?.parameters === false) return { type };

  const parameters = parseParameters(header, end + 1, len);
  return { type, parameters };
}

function parseParameters(
  header: string,
  index: number,
  len: number,
): Record<string, string> {
  const parameters: Record<string, string> = new NullObject();

  parameter: while (index < len) {
    index = skipOWS(header, index, len);

    const keyStart = index;

    while (index < len) {
      const char = header[index];
      if (char === ";") {
        index++;
        continue parameter;
      }

      if (char === "=") {
        const keyEnd = trailingOWS(header, keyStart, index);
        const key = header.slice(keyStart, keyEnd).toLowerCase();

        index = skipOWS(header, index + 1, len);

        if (index < len && header[index] === '"') {
          index++;

          let value = "";
          while (index < len) {
            const char = header[index++];
            if (char === '"') {
              index = skipOWS(header, index, len);
              if (index < len && header[index] !== ";") {
                throw new TypeError(`Unexpected character at index ${index}`);
              }

              parameters[key] = value;
              index++;
              continue parameter;
            }

            if (char === "\\") {
              if (index === len) break;
              value += header[index++];
              continue;
            }

            value += char;
          }

          throw new TypeError(`Unexpected end of input at index ${index}`);
        }

        const valueStart = index;
        while (index < len && header[index] !== ";") {
          index++;
        }

        const valueEnd = trailingOWS(header, valueStart, index);
        parameters[key] = header.slice(valueStart, valueEnd);
        index++;
        continue parameter;
      }

      index++;
    }
  }

  return parameters;
}

/**
 * Skip optional whitespace (OWS) in an HTTP header value.
 *
 * OWS is defined in RFC 9110 sec 5.6.3 as SP (" ") or HTAB ("\t").
 */
function skipOWS(header: string, index: number, len: number): number {
  while (index < len) {
    const char = header[index];
    if (char !== " " && char !== "\t") break;
    index++;
  }
  return index;
}

/**
 * Trim optional whitespace (OWS) from the end of a substring.
 *
 * OWS is defined in RFC 9110 sec 5.6.3 as SP (" ") or HTAB ("\t").
 */
function trailingOWS(header: string, start: number, end: number): number {
  while (end > start) {
    const char = header[end - 1];
    if (char !== " " && char !== "\t") break;
    end--;
  }
  return end;
}

function qstring(str: string): string {
  if (TOKEN_REGEXP.test(str)) return str;
  if (TEXT_REGEXP.test(str)) return `"${str.replace(QUOTE_REGEXP, "\\$&")}"`;

  throw new TypeError(`Invalid parameter value: ${str}`);
}
