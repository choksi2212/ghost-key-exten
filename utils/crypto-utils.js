// AES-256 Encryption Utilities for GhostKey Extension
class CryptoUtils {
  constructor() {
    this.algorithm = 'AES-GCM'
    this.keyLength = 256
  }

  // Generate a random encryption key
  async generateKey() {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  // Convert key to exportable format
  async exportKey(key) {
    const exported = await crypto.subtle.exportKey('raw', key)
    return Array.from(new Uint8Array(exported))
  }

  // Import key from stored format
  async importKey(keyArray) {
    const keyBuffer = new Uint8Array(keyArray).buffer
    return await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  // Encrypt data
  async encrypt(data, key) {
    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(JSON.stringify(data))
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12))
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        key,
        dataBuffer
      )

      return {
        data: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
      }
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  // Decrypt data
  async decrypt(encryptedData, key) {
    try {
      const dataBuffer = new Uint8Array(encryptedData.data).buffer
      const iv = new Uint8Array(encryptedData.iv)

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        key,
        dataBuffer
      )

      const decoder = new TextDecoder()
      const decryptedText = decoder.decode(decrypted)
      return JSON.parse(decryptedText)
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  // Generate a master key from user input (for key derivation)
  async deriveKey(password, salt) {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)
    const saltBuffer = encoder.encode(salt || 'ghostkey-salt-2024')

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  // Hash data for integrity checking
  async hash(data) {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(JSON.stringify(data))
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    return Array.from(new Uint8Array(hashBuffer))
  }

  // Generate secure random string
  generateSecureId(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const randomValues = crypto.getRandomValues(new Uint8Array(length))
    return Array.from(randomValues, byte => chars[byte % chars.length]).join('')
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.CryptoUtils = CryptoUtils
} else if (typeof global !== 'undefined') {
  global.CryptoUtils = CryptoUtils
} 