/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

const TEXT_REGEXP = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/;
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

export interface ContentType {
  parameters: Record<string, string>;
  type: string;
}

export interface ContentTypeFormat {
  parameters?: Record<string, unknown>;
  type: string;
}

export type ContentTypeSource = {
  getHeader?: (name: string) => unknown;
  headers?: Record<string, unknown>;
};

export function format(obj: ContentTypeFormat): string {
  if (!obj || typeof obj !== "object") {
    throw new TypeError("argument obj is required");
  }

  const { type, parameters } = obj;

  if (!type || !TYPE_REGEXP.test(type)) {
    throw new TypeError("invalid type");
  }

  let string = type;

  // append parameters
  if (parameters && typeof parameters === "object") {
    for (const param of Object.keys(parameters).sort()) {
      if (!TOKEN_REGEXP.test(param)) {
        throw new TypeError("invalid parameter name");
      }

      string += `; ${param}=${qstring(parameters[param])}`;
    }
  }

  return string;
}

export function parse(string: string | ContentTypeSource): ContentType {
  if (!string) {
    throw new TypeError("argument string is required");
  }

  const header = typeof string === "object" ? getcontenttype(string) : string;

  if (typeof header !== "string") {
    throw new TypeError("argument string is required to be a string");
  }

  const len = header.length;
  const semiIndex = header.indexOf(";");
  const end = semiIndex !== -1 ? semiIndex : len;
  const valueStart = skipOWS(header, 0, end);
  const valueEnd = trailingOWS(header, valueStart, end);
  const type =
    valueStart === 0 && valueEnd === len
      ? header.toLowerCase()
      : header.slice(valueStart, valueEnd).toLowerCase();

  if (!TYPE_REGEXP.test(type)) {
    throw new TypeError("invalid media type");
  }

  const parameters = parseParameters(header, end, len);

  return { type, parameters };
}

function getcontenttype(obj: ContentTypeSource): string {
  let header: unknown;

  if (typeof obj.getHeader === "function") {
    header = obj.getHeader("content-type");
  } else if (typeof obj.headers === "object") {
    header = obj.headers && obj.headers["content-type"];
  }

  if (typeof header !== "string") {
    throw new TypeError("content-type header is missing from object");
  }

  return header;
}

function parseParameters(
  header: string,
  index: number,
  len: number,
): Record<string, string> {
  const parameters = Object.create(null);

  while (index < len) {
    // Skip `;` and OWS before parameter key.
    index = skipOWS(header, index + 1, len);

    const keyStart = index;

    while (index < len) {
      const char = header[index];
      if (char === ";") break; // End of parameter, no value found, skip.

      if (char === "=") {
        const keyEnd = trailingOWS(header, keyStart, index);
        const key = header.slice(keyStart, keyEnd).toLowerCase();

        index = skipOWS(header, index + 1, len);

        if (header[index] === '"') {
          index++;

          let value = "";
          let quoted = false;
          while (index < len) {
            const char = header[index++];
            if (char === '"') {
              quoted = true;
              break;
            }

            if (char === "\\") {
              value += header[index++];
              continue;
            }

            value += char;
          }

          if (!quoted) throw new TypeError("unexpected end of input");

          index = skipOWS(header, index, len);
          if (index < len && header[index] !== ";") {
            throw new TypeError("unexpected non-separator character");
          }

          parameters[key] = value;
          break;
        }

        const valueStart = index;
        while (index < len && header[index] !== ";") index++;

        const valueEnd = trailingOWS(header, valueStart, index);
        parameters[key] = header.slice(valueStart, valueEnd);
        break;
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
    const code = header[index];
    if (code !== " " && code !== "\t") break;
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
    const code = header[end - 1];
    if (code !== " " && code !== "\t") break;
    end--;
  }
  return end;
}

function qstring(val: unknown): string {
  const str = String(val);

  // no need to quote tokens
  if (TOKEN_REGEXP.test(str)) {
    return str;
  }

  if (str.length > 0 && !TEXT_REGEXP.test(str)) {
    throw new TypeError("invalid parameter value");
  }

  return '"' + str.replace(QUOTE_REGEXP, "\\$&") + '"';
}
