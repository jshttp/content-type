import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HISTORY_FILE_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'HISTORY.md')
const MD_HEADER_REGEXP = /^====*$/
const VERSION = process.env.npm_package_version
const VERSION_PLACEHOLDER_REGEXP = /^(?:unreleased|(\d+\.)+x)$/

const historyFileLines = fs.readFileSync(HISTORY_FILE_PATH, 'utf-8').split('\n')

if (!MD_HEADER_REGEXP.test(historyFileLines[1])) {
  console.error('Missing header in HISTORY.md')
  process.exit(1)
}

if (!VERSION_PLACEHOLDER_REGEXP.test(historyFileLines[0])) {
  console.error('Missing placeholder version in HISTORY.md')
  process.exit(1)
}

if (historyFileLines[0].indexOf('x') !== -1) {
  const versionCheckRegExp = new RegExp('^' + historyFileLines[0].replace('x', '.+') + '$')

  if (!versionCheckRegExp.test(VERSION)) {
    console.error('Version %s does not match placeholder %s', VERSION, historyFileLines[0])
    process.exit(1)
  }
}

historyFileLines[0] = VERSION + ' / ' + new Date().toISOString().slice(0, 10)
historyFileLines[1] = ''.padEnd(historyFileLines[0].length, '=')

fs.writeFileSync(HISTORY_FILE_PATH, historyFileLines.join('\n'))
