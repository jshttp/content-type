import { strictEqual, throws } from 'node:assert'
import { format } from '../index.mjs'

describe('contentType.format(obj) [esm]', function () {
  it('should format basic type', function () {
    const str = format({ type: 'text/html' })
    strictEqual(str, 'text/html')
  })

  it('should format type with suffix', function () {
    const str = format({ type: 'image/svg+xml' })
    strictEqual(str, 'image/svg+xml')
  })

  it('should format type with parameter', function () {
    const str = format({
      type: 'text/html',
      parameters: { charset: 'utf-8' }
    })
    strictEqual(str, 'text/html; charset=utf-8')
  })

  it('should format type with parameter that needs quotes', function () {
    const str = format({
      type: 'text/html',
      parameters: { foo: 'bar or "baz"' }
    })
    strictEqual(str, 'text/html; foo="bar or \\"baz\\""')
  })

  it('should format type with parameter with empty value', function () {
    const str = format({
      type: 'text/html',
      parameters: { foo: '' }
    })
    strictEqual(str, 'text/html; foo=""')
  })

  it('should format type with multiple parameters', function () {
    const str = format({
      type: 'text/html',
      parameters: { charset: 'utf-8', foo: 'bar', bar: 'baz' }
    })
    strictEqual(str, 'text/html; bar=baz; charset=utf-8; foo=bar')
  })

  it('should require argument', function () {
    throws(format.bind(null), /argument obj is required/)
  })

  it('should reject non-objects', function () {
    throws(format.bind(null, 7), /argument obj is required/)
  })

  it('should require type', function () {
    const obj = {}
    throws(format.bind(null, obj), /invalid type/)
  })

  it('should reject invalid type', function () {
    const obj = { type: 'text/' }
    throws(format.bind(null, obj), /invalid type/)
  })

  it('should reject invalid type with LWS', function () {
    const obj = { type: ' text/html' }
    throws(format.bind(null, obj), /invalid type/)
  })

  it('should reject invalid parameter name', function () {
    const obj = { type: 'image/svg', parameters: { 'foo/': 'bar' } }
    throws(format.bind(null, obj), /invalid parameter name/)
  })

  it('should reject invalid parameter value', function () {
    const obj = { type: 'image/svg', parameters: { foo: 'bar\u0000' } }
    throws(format.bind(null, obj), /invalid parameter value/)
  })
})
