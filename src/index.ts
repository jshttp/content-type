/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Null object perf optimization. Faster than `Object.create(null)` and `{ __proto__: null }`.
 */
const NullObject = /* @__PURE__ */ (() => {
  const C = function () {};
  C.prototype = Object.create(null);
  return C;
})() as unknown as { new (): any };

/**
 * ASCII character lookup table for the token production in RFC 9110.
 */
const TOKEN_CODES = /* @__PURE__ */ (() => {
  const codes = new Uint8Array(128);
  codes[33] = 1; // !
  codes.fill(1, 35, 40); // # $ % & '
  codes[42] = 1; // *
  codes[43] = 1; // +
  codes[45] = 1; // -
  codes[46] = 1; // .
  codes.fill(1, 48, 58); // 0-9
  codes.fill(1, 65, 91); // A-Z
  codes.fill(1, 94, 97); // ^ _ `
  codes.fill(1, 97, 123); // a-z
  codes[124] = 1; // |
  codes[126] = 1; // ~
  return codes;
})();

/**
 * The content type object contains a type string and optional parameters.
 */
export interface ContentType {
  type: string;
  index: number;
  parameters: Record<string, string>;
}

/**
 * Validate a type string against RFC 9110.
 */
export function isTypeValid(type: string): boolean {
  const len = type.length;
  let hasSlash = false;

  for (let index = 0; index < len; index++) {
    const code = type.charCodeAt(index);

    if (code === 47 /* / */) {
      if (hasSlash || index === 0 || index === len - 1) return false;
      hasSlash = true;
    } else if (!isTokenCode(code)) {
      return false;
    }
  }

  return hasSlash;
}

/**
 * Validate a token against RFC 9110.
 */
export function isTokenValid(name: string): boolean {
  const len = name.length;
  if (len === 0) return false;

  for (let index = 0; index < len; index++) {
    if (!isTokenCode(name.charCodeAt(index))) return false;
  }

  return true;
}

/**
 * Check whether a character code belongs to the token production in RFC 9110.
 */
function isTokenCode(code: number): boolean {
  return code < 128 && TOKEN_CODES[code] !== 0;
}

/**
 * Serialize a parameter value.
 */
export function parameterValue(str: string): string {
  if (isTokenValid(str)) return str;

  let result = '"';
  let start = 0;

  for (let index = 0; index < str.length; index++) {
    const code = str.charCodeAt(index);

    if (code !== 9 && (code < 32 || code === 127 || code > 255)) {
      throw new TypeError(`Invalid parameter value: ${str}`);
    }

    if (code === 34 /* " */ || code === 92 /* \\ */) {
      result += `${str.slice(start, index)}\\`;
      start = index;
    }
  }

  return `${result}${str.slice(start)}"`;
}

/**
 * Format an object into a `Content-Type` header.
 */
export function format(obj: Partial<ContentType>): string {
  const { type, parameters } = obj;

  if (!type || !isTypeValid(type)) {
    throw new TypeError(`Invalid type: ${type}`);
  }

  let result = type;

  if (parameters) {
    for (const param of Object.keys(parameters)) {
      if (!isTokenValid(param)) {
        throw new TypeError(`Invalid parameter name: ${param}`);
      }

      result += `; ${param}=${parameterValue(parameters[param])}`;
    }
  }

  return result;
}

/**
 * Options for parsing a `Content-Type` header.
 */
export interface ParseOptions {
  /**
   * Exit early on the first semicolon, returning only the type.
   * This is useful for parsing the MIME from `Content-Type` headers.
   *
   * @default false
   */
  parameters?: boolean;
  /**
   * Exits early on a comma, returning the first value and parameters.
   * This is useful for parsing `Accept` headers.
   *
   * @default false
   */
  comma?: boolean;
  /**
   * The index to start parsing from.
   *
   * @default 0
   */
  start?: number;
}

/**
 * Parse a `Content-Type` header.
 */
export function parse(header: string, options?: ParseOptions): ContentType {
  const stopChar = options?.comma === true ? COMMA : 65_536; // Sentinel for "no stop char".
  const len = header.length;
  let index = skipOWS(header, options?.start ?? 0, len);

  const valueStart = index;
  index = skipValue(header, index, len, stopChar);
  const valueEnd = trailingOWS(header, valueStart, index);
  const type = header.slice(valueStart, valueEnd).toLowerCase();

  if (options?.parameters === false) {
    return { type, index, parameters: new NullObject() };
  }

  return parseParameters(header, type, index, len, stopChar);
}

const SP = 32; // " "
const HTAB = 9; // "\t"
const SEMI = 59; // ";"
const EQ = 61; // "="
const DQUOTE = 34; // '"'
const BSLASH = 92; // "\\"
const COMMA = 44; // ","

/**
 * Parses the parameters of a `Content-Type` header starting at the given index.
 */
function parseParameters(
  header: string,
  type: string,
  index: number,
  len: number,
  stopChar: number,
): ContentType {
  const parameters: Record<string, string> = new NullObject();

  parameter: while (index < len) {
    if (header.charCodeAt(index) === stopChar) break;

    index = skipOWS(header, index + 1 /* Skip over ; */, len);

    const keyStart = index;

    while (index < len) {
      const code = header.charCodeAt(index);
      if (code === stopChar) break parameter;

      if (code === SEMI) continue parameter;

      if (code === EQ) {
        const keyEnd = trailingOWS(header, keyStart, index);
        const key = header.slice(keyStart, keyEnd).toLowerCase();

        index = skipOWS(header, index + 1, len);

        if (index < len && header.charCodeAt(index) === DQUOTE) {
          index++;

          let value = "";
          while (index < len) {
            const code = header.charCodeAt(index++);
            if (code === DQUOTE) {
              index = skipValue(header, index, len, stopChar);
              if (parameters[key] === undefined) parameters[key] = value;
              break;
            }

            if (code === BSLASH && index < len) {
              value += header[index++];
              continue;
            }

            value += String.fromCharCode(code);
          }

          continue parameter;
        }

        const valueStart = index;
        index = skipValue(header, index, len, stopChar);

        if (parameters[key] === undefined) {
          const valueEnd = trailingOWS(header, valueStart, index);
          parameters[key] = header.slice(valueStart, valueEnd);
        }

        continue parameter;
      }

      index++;
    }
  }

  return { type, index, parameters };
}

/**
 * Skip over characters until a semicolon or other exit character.
 */
function skipValue(
  str: string,
  index: number,
  len: number,
  stopChar: number,
): number {
  while (index < len) {
    const code = str.charCodeAt(index);
    if (code === SEMI || code === stopChar) break;
    index++;
  }
  return index;
}

/**
 * Skip optional whitespace (OWS) in an HTTP header value.
 *
 * OWS is defined in RFC 9110 sec 5.6.3 as SP (" ") or HTAB ("\t").
 */
function skipOWS(header: string, index: number, len: number): number {
  while (index < len) {
    const char = header.charCodeAt(index);
    if (char !== SP && char !== HTAB) break;
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
    const char = header.charCodeAt(end - 1);
    if (char !== SP && char !== HTAB) break;
    end--;
  }
  return end;
}
