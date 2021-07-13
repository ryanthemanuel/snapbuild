import debug from 'debug'
import path from 'path'
import { strict as assert } from 'assert'
import { sync as pkgup } from 'pkg-up'
import { execSync } from 'child_process'
import resolveFrom from 'resolve-from'
import { platformKey, unixLikePackages, windowsPackages } from './platforms'

const { version } = require('../package.json')

const logInfo = debug('snapbuild:info')
const logTrace = debug('snapbuild:trace')
const logDebug = debug('snapbuild:debug')

const packRoot = path.join(__dirname, '..')
const binDir = path.join(packRoot, 'bin')
// @ts-ignore
const binFullPath = path.join(binDir, 'snapshot')

logInfo('Running')

function getInstallRoot() {
  const installPackageJson = pkgup({ cwd: path.join(packRoot, '..') })
  assert(installPackageJson != null, 'unable to find install root')
  return path.dirname(installPackageJson)
}

function installFromNpm(packName: string, version: string) {
  const pack = `${packName}@${version}`
  const installRoot = getInstallRoot()
  const cmd = `npm install --loglevel=error --prefer-offline --no-audit --progress=false ${pack}`
  logDebug('installing %s from %s', pack, installRoot)
  logTrace(cmd)
  try {
    execSync(cmd, { cwd: installRoot, stdio: 'pipe' })
  } catch (err) {
    console.error('Failed to install %s', pack)
    console.error(err)
    process.exit(1)
  }

  const installLocation = resolveFrom(installRoot, packName)
  logDebug('Installed to %s', installLocation)
}

function install() {
  if (unixLikePackages.has(platformKey)) {
    const packName = unixLikePackages.get(platformKey)!
    installFromNpm(packName, version)
  } else if (windowsPackages.has(platformKey)) {
    const packName = windowsPackages.get(platformKey)!
    installFromNpm(packName, version)
  } else {
    console.error('Unsupported platform ${platformKey}')
    process.exit(1)
  }
}

install()
