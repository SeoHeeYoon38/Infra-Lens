import { spawn } from 'node:child_process'
import path from 'node:path'

const rootDir = process.cwd()
const processes = [
  spawn(process.execPath, [path.join(rootDir, 'server', 'index.mjs')], { stdio: 'inherit' }),
  spawn(process.execPath, [path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js')], { stdio: 'inherit' }),
]

function shutdown() {
  processes.forEach((child) => child.kill('SIGTERM'))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
processes.forEach((child) => child.on('exit', (code) => { if (code && code !== 0) process.exitCode = code }))
