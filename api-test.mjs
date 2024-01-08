import test from "node:test"
import os from "node:os"
import { createRequire } from "node:module";
import assert from "node:assert"
import path from "node:path"
import { execSync } from "node:child_process"

const require = createRequire(import.meta.url);
const rootNodeModules = path.join(process.cwd(), 'node_modules');

function getBin() {
  const arch = os.arch();
  const platform = os.platform();
  switch (platform) {
    case "linux":
      return `linux/${arch}/app-builder`
    case "darwin":
      return `mac/app-builder_${arch}`
    case "win32":
      return `win/${arch}/app-builder.exe`
    default:
      throw new Error(`not supported platform ${platform}`)
  }
}

function getSqlite3DependencyInfo(appBuilderModule) {
  const appBuilder = require.resolve(`${appBuilderModule}/${getBin()}`);
  try {
    execSync(`chmod +x ${appBuilder}`);
  } catch (e) {
    console.error(e);
  }
  const result = execSync(`${appBuilder} node-dep-tree --dir ${process.cwd()}`).toString();
  const parsed = JSON.parse(result);
  return parsed.reduce((dep, currentValue) => {
    if (dep) {
      return dep;
    }
    if (currentValue.dir === rootNodeModules) {
      return currentValue.deps.find((nextDep) => nextDep.name === 'sqlite3')
    }
  }, undefined)
}

test('returns napiVersions [36]', () => {
  const sqlite3 = getSqlite3DependencyInfo('app-builder-bin-4.0.0')
  assert.deepEqual(sqlite3, {
    name: 'sqlite3',
    version: '5.1.7',
    hasPrebuildInstall: true,
    napiVersions: [36]
  });
})

test('returns napiVersions [3,6]', () => {
  const sqlite3 = getSqlite3DependencyInfo('app-builder-bin-4.2.0')
  assert.deepEqual(sqlite3, {
    name: 'sqlite3',
    version: '5.1.7',
    hasPrebuildInstall: true,
    napiVersions: [3, 6]
  });
})