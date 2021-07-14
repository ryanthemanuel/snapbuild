import { strict as assert } from 'assert'
import { execSync } from 'child_process'
import debug from 'debug'
import fs from 'fs'
import path from 'path'
import { sync as pkgup } from 'pkg-up'
import { platformKey, unixLikePackages, windowsPackages } from './platforms'

const { version } = require('../package.json')

const logInfo = debug('snapbuild:info')
const logTrace = debug('snapbuild:trace')
const logDebug = debug('snapbuild:debug')

const packRoot = path.join(__dirname, '..')
const destination = path.join(packRoot, 'platform-binary')

logInfo('Running')

function getInstallRoot() {
  const installPackageJson = pkgup({ cwd: path.join(packRoot, '..') })
  assert(installPackageJson != null, 'unable to find install root')
  return path.dirname(installPackageJson)
}

function installFromNpm(packName: string, version: string) {
  const pack = `${packName}@${version}`
  const installRoot = getInstallRoot()
  const cmd = `npm install --loglevel=error --prefer-offline --no-audit --progress=false --no-save ${pack}`
  logDebug('installing %s from %s', pack, installRoot)
  logTrace(cmd)
  try {
    execSync(cmd, { cwd: installRoot, stdio: 'pipe' })
  } catch (err) {
    console.error('Failed to install %s', pack)
    console.error(err)
    process.exit(1)
  }

  // resolve-from uses `Module._nodeModulePaths` which could miss the `node_modules` folder we installed to
  // if it wasn't present at script start (rare but possible).
  // Therefore we need to run this in a separate process.
  try {
    const resolveScript = require.resolve('./resolve')
    const installLocation = execSync(`${process.execPath} ${resolveScript}`, {
      env: {
        INSTALL_ROOT: installRoot,
        PACK_NAME: packName,
      },
    })
    logDebug('Installed to %s', installLocation)
    return installLocation.toString()
  } catch (err) {
    console.error('Failed to resolve installed %s', pack)
    console.error(err)
    process.exit(1)
  }
}

function install() {
  let installLocation: string
  if (unixLikePackages.has(platformKey)) {
    const packName = unixLikePackages.get(platformKey)!
    installLocation = installFromNpm(packName, version)
  } else if (windowsPackages.has(platformKey)) {
    const packName = windowsPackages.get(platformKey)!
    installLocation = installFromNpm(packName, version)
  } else {
    console.error('Unsupported platform ${platformKey}')
    process.exit(1)
  }

  const installRoot = path.join(path.dirname(installLocation), '..')
  try {
    logDebug('Moving from install location %s to %s', installRoot, destination)
    fs.renameSync(installRoot, destination)
  } catch (err) {
    console.error('Failed to move installed platform specific snapbuild module')
  }
}

install()
