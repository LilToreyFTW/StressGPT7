#!/usr/bin/env node

/**
 * Build script for StressGPT7 Vercel deployment
 * Ensures proper setup for Node.js serverless functions
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('Starting StressGPT7 build process...')

// Check if essential files exist
const requiredFiles = [
  'start-final.js',
  'app.html',
  'vercel.json'
]

let allFilesExist = true
for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`Missing required file: ${file}`)
    allFilesExist = false
  }
}

if (!allFilesExist) {
  process.exit(1)
}

// Verify package.json configuration
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
  if (packageJson.scripts?.build) {
    console.log('Build script found in package.json')
  }
} catch (error) {
  console.error('Error reading package.json:', error.message)
  process.exit(1)
}

// Create a simple build verification
console.log('Build verification completed successfully')
console.log('StressGPT7 serverless function ready for deployment')

// Create build info file
const buildInfo = {
  buildTime: new Date().toISOString(),
  version: '7.0.0',
  platform: 'vercel',
  runtime: 'node.js',
  files: requiredFiles
}

writeFileSync('build-info.json', JSON.stringify(buildInfo, null, 2))
console.log('Build info written to build-info.json')

process.exit(0)
