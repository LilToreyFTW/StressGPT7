import { randomBytes, createHash, createHmac } from 'node:crypto'
import { createLogger } from './logger.js'

const logger = createLogger('crypto')

export function generateId(length: number = 16): string {
  return randomBytes(length).toString('hex')
}

export function generateUUID(): string {
  return randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
}

export function hash(data: string, algorithm: string = 'sha256'): string {
  return createHash(algorithm).update(data).digest('hex')
}

export function hmac(data: string, key: string, algorithm: string = 'sha256'): string {
  return createHmac(algorithm, key).update(data).digest('hex')
}

export function generateApiKey(length: number = 32): string {
  return `sg7_${randomBytes(length).toString('hex')}`
}

export function generateSessionToken(): string {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(16).toString('hex')
  const hashValue = hash(`${timestamp}:${random}`)
  return `${timestamp}_${random}_${hashValue.substring(0, 8)}`
}

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim()
}

export function escapeShellArg(arg: string): string {
  // Simple shell argument escaping for Unix-like systems
  return `'${arg.replace(/'/g, "'\"'\"'")}'`
}

export function validateApiKey(apiKey: string): boolean {
  // Basic validation for API key format
  return /^sg7_[a-f0-9]{64}$/.test(apiKey)
}

export function encryptSensitiveData(data: string, key: string): string {
  // Simple XOR encryption for demonstration
  // In production, use proper encryption libraries
  const keyBytes = Buffer.from(key, 'utf8')
  const dataBytes = Buffer.from(data, 'utf8')
  const encrypted = Buffer.alloc(dataBytes.length)
  
  for (let i = 0; i < dataBytes.length; i++) {
    encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length]
  }
  
  return encrypted.toString('base64')
}

export function decryptSensitiveData(encryptedData: string, key: string): string {
  // Simple XOR decryption for demonstration
  // In production, use proper encryption libraries
  const keyBytes = Buffer.from(key, 'utf8')
  const encrypted = Buffer.from(encryptedData, 'base64')
  const decrypted = Buffer.alloc(encrypted.length)
  
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length]
  }
  
  return decrypted.toString('utf8')
}

export function generateSecureRandom(min: number, max: number): number {
  const range = max - min + 1
  const bytesNeeded = Math.ceil(Math.log2(range) / 8)
  const maxValue = Math.pow(256, bytesNeeded) - 1
  const randomBytesBuffer = randomBytes(bytesNeeded)
  
  let randomValue = 0
  for (let i = 0; i < bytesNeeded; i++) {
    randomValue = randomValue * 256 + randomBytesBuffer[i]
  }
  
  return min + (randomValue % range)
}

export function createChecksum(data: string): string {
  return hash(data, 'md5')
}

export function verifyChecksum(data: string, expectedChecksum: string): boolean {
  const actualChecksum = createChecksum(data)
  return actualChecksum === expectedChecksum
}
