import resolveFrom from 'resolve-from'
import { strict as assert } from 'assert'

const installRoot = process.env.INSTALL_ROOT
const packName = process.env.PACK_NAME

assert(installRoot != null, 'missing INSTALL_ROOT env var')
assert(packName != null, 'missing PACK_NAME env var')

try {
  const installLocation = resolveFrom(installRoot, packName)
  console.log(installLocation)
} catch (err) {
  process.exit(1)
}
