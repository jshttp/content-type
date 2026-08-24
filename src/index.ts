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

const SP = 32; // " "
const HTAB = 9; // "\t"
const SEMI = 59; // ";"
const EQ = 61; // "="
const DQUOTE = 34; // '"'
const BSLASH = 92; // "\\"
const COMMA = 44; // ","

const LOWER_CASE = 1;
const OWS = 2;
const SEMI_FLAG = 4;
const COMMA_FLAG = 8;
const NON_ASCII = 0xff00;
const CASE_FLAGS = LOWER_CASE | NON_ASCII;

/**
 * Character flags used to normalize HTTP field values while scanning.
 * Out-of-range reads intentionally coerce to zero in bitwise expressions.
 */
const CHAR_MAP = new Uint8Array(0x100);

for (let code = 0x41 /* A */; code <= 0x5a /* Z */; code++) {
  CHAR_MAP[code] |= LOWER_CASE;
}

CHAR_MAP[HTAB] |= OWS;
CHAR_MAP[SP] |= OWS;
CHAR_MAP[SEMI] |= SEMI_FLAG;
CHAR_MAP[COMMA] |= COMMA_FLAG;
for (let code = 0x80 /* non-ASCII */; code <= 0xff; code++) {
  CHAR_MAP[code] |= LOWER_CASE;
}

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
  index: number;
  parameters: Record<string, string>;
}

/**
 * Format an object into a `Content-Type` header.
 */
export function format(obj: Partial<ContentType>): string {
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
  const stopFlags = SEMI_FLAG | (options?.comma === true ? COMMA_FLAG : 0);
  const len = header.length;
  let valueStart = options?.start ?? 0;
  while ((CHAR_MAP[header.charCodeAt(valueStart)] & OWS) !== 0) {
    valueStart++;
  }

  let index = valueStart;
  let typeFlags = 0;
  let whitespace = -1;
  let stop = options?.parameters === false ? COMMA_FLAG : 0;
  while (index < len) {
    const code = header.charCodeAt(index);
    const flags = CHAR_MAP[code];
    if ((flags & stopFlags) !== 0) {
      stop |= flags & COMMA_FLAG;
      break;
    }

    if ((flags & OWS) !== 0) {
      if (whitespace === -1) whitespace = index;
    } else {
      whitespace = -1;
    }

    typeFlags |= (code & NON_ASCII) | flags;
    index++;
  }
  const valueEnd = whitespace === -1 ? index : whitespace;
  const value = header.slice(valueStart, valueEnd);
  const type = (typeFlags & CASE_FLAGS) === 0 ? value : value.toLowerCase();

  if (index === len || stop !== 0) {
    return { type, index, parameters: new NullObject() };
  }

  return parseParameters(header, type, index, len, stopFlags);
}

/**
 * Parses the parameters of a `Content-Type` header starting at the given index.
 */
function parseParameters(
  header: string,
  type: string,
  index: number,
  len: number,
  stopFlags: number,
): ContentType {
  const parameters: Record<string, string> = new NullObject();

  parameter: while (index < len) {
    index++; // Skip over ;
    while ((CHAR_MAP[header.charCodeAt(index)] & OWS) !== 0) {
      index++;
    }

    const keyStart = index;
    let keyFlags = 0;
    let keyWhitespace = -1;

    while (index < len) {
      const code = header.charCodeAt(index);
      const flags = CHAR_MAP[code];
      if ((flags & stopFlags) !== 0) {
        if (flags === COMMA_FLAG) break parameter;
        continue parameter;
      }

      if (code === EQ) {
        const keyEnd = keyWhitespace === -1 ? index : keyWhitespace;
        const value = header.slice(keyStart, keyEnd);
        const key = (keyFlags & CASE_FLAGS) === 0 ? value : value.toLowerCase();

        index++;
        while ((CHAR_MAP[header.charCodeAt(index)] & OWS) !== 0) {
          index++;
        }

        if (index < len && header.charCodeAt(index) === DQUOTE) {
          const quotedStart = ++index;
          let escaped = false;

          while (index < len) {
            const code = header.charCodeAt(index);
            if (code === DQUOTE) {
              if (parameters[key] === undefined) {
                parameters[key] = escaped
                  ? unescapeQuotedPairs(header, quotedStart, index)
                  : header.slice(quotedStart, index);
              }

              index++;
              let stop = 0;

              // Discard characters between quote and delimiter.
              while (index < len) {
                const code = header.charCodeAt(index);
                const flags = CHAR_MAP[code];
                if ((flags & stopFlags) !== 0) {
                  stop = flags & COMMA_FLAG;
                  break;
                }
                index++;
              }

              if (stop !== 0) break parameter;
              continue parameter;
            }

            if (code === BSLASH && index + 1 < len) {
              escaped = true;
              index += 2;
              continue;
            }

            index++;
          }

          continue parameter;
        }

        const valueStart = index;
        let stop = 0;
        let valueWhitespace = -1;
        while (index < len) {
          const code = header.charCodeAt(index);
          const flags = CHAR_MAP[code];
          if ((flags & stopFlags) !== 0) {
            stop = flags & COMMA_FLAG;
            break;
          }

          if ((flags & OWS) !== 0) {
            if (valueWhitespace === -1) valueWhitespace = index;
          } else {
            valueWhitespace = -1;
          }

          index++;
        }

        if (parameters[key] === undefined) {
          const valueEnd = valueWhitespace === -1 ? index : valueWhitespace;
          parameters[key] = header.slice(valueStart, valueEnd);
        }

        if (stop !== 0) break parameter;
        continue parameter;
      }

      if ((flags & OWS) !== 0) {
        if (keyWhitespace === -1) keyWhitespace = index;
      } else {
        keyWhitespace = -1;
      }

      keyFlags |= (code & NON_ASCII) | flags;
      index++;
    }
  }

  return { type, index, parameters };
}

/**
 * Remove backslashes from quoted pairs in a known-terminated quoted string body.
 */
function unescapeQuotedPairs(str: string, start: number, end: number): string {
  let result = "";

  for (let index = start; index < end; index++) {
    if (str.charCodeAt(index) === BSLASH) {
      result += str.slice(start, index);
      start = ++index;
    }
  }

  return result + str.slice(start, end);
}

/**
 * Serialize a parameter value.
 */
function qstring(str: string): string {
  if (TOKEN_REGEXP.test(str)) return str;
  if (TEXT_REGEXP.test(str)) return `"${str.replace(QUOTE_REGEXP, "\\$&")}"`;

  throw new TypeError(`Invalid parameter value: ${str}`);
}
