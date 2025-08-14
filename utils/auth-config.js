// Authentication Configuration for GhostKey Extension
class AuthConfig {
  static DEFAULT_CONFIG = {
    // Keystroke Analysis Parameters
    SAMPLES_REQUIRED: 10,
    MIN_SAMPLES_REQUIRED: 5,
    MAX_SAMPLES_REQUIRED: 20,
    
    // Authentication Thresholds
    AUTOENCODER_THRESHOLD: 0.03,
    MIN_THRESHOLD: 0.01,
    MAX_THRESHOLD: 0.1,
    
    // Voice Authentication
    VOICE_SAMPLES_REQUIRED: 5,
    VOICE_SIMILARITY_THRESHOLD: 0.75,
    MIN_VOICE_THRESHOLD: 0.5,
    MAX_VOICE_THRESHOLD: 0.95,
    
    // Data Augmentation
    NOISE_LEVEL: 0.1,
    MIN_NOISE_LEVEL: 0.05,
    MAX_NOISE_LEVEL: 0.3,
    AUGMENTATION_FACTOR: 3,
    
    // Timing Parameters
    MIN_KEYSTROKE_INTERVAL: 50, // milliseconds
    MAX_KEYSTROKE_INTERVAL: 2000,
    TYPING_SPEED_WEIGHT: 0.3,
    RHYTHM_WEIGHT: 0.4,
    PRESSURE_WEIGHT: 0.3,
    
    // Security Settings
    ENCRYPTION_ENABLED: true,
    MAX_FAILED_ATTEMPTS: 3,
    LOCKOUT_DURATION: 300000, // 5 minutes in milliseconds
    SESSION_TIMEOUT: 1800000, // 30 minutes
    
    // Feature Extraction
    HOLD_TIME_WEIGHT: 0.25,
    DWELL_TIME_WEIGHT: 0.25,
    FLIGHT_TIME_WEIGHT: 0.25,
    PRESSURE_VARIANCE_WEIGHT: 0.25,
    
    // Neural Network Parameters
    HIDDEN_LAYERS: [50, 20, 10],
    LEARNING_RATE: 0.001,
    EPOCHS: 100,
    BATCH_SIZE: 32,
    
    // Voice Processing
    SAMPLE_RATE: 44100,
    FRAME_SIZE: 1024,
    MFCC_COEFFICIENTS: 13,
    VOICE_TIMEOUT: 5000, // 5 seconds max recording
    
    // UI Settings
    AUTO_ENABLE: true,
    SHOW_NOTIFICATIONS: true,
    NOTIFICATION_DURATION: 5000,
    UI_FADE_DELAY: 15000,
    
    // Page Detection
    LOGIN_PATTERNS: [
      'login', 'signin', 'sign-in', 'log-in',
      'auth', 'authenticate', 'authentication',
      'account', 'portal', 'dashboard',
      'enter', 'access', 'connect'
    ],
    SIGNUP_PATTERNS: [
      'signup', 'sign-up', 'register', 'registration',
      'create', 'join', 'new-account', 'get-started'
    ]
  }

  static async getConfig() {
    try {
      const stored = await chrome.storage.local.get(['authConfig'])
      return { ...this.DEFAULT_CONFIG, ...(stored.authConfig || {}) }
    } catch (error) {
      console.error('Error loading auth config:', error)
      return this.DEFAULT_CONFIG
    }
  }

  static async updateConfig(updates) {
    try {
      const current = await this.getConfig()
      const newConfig = { ...current, ...updates }
      
      // Validate ranges
      newConfig.SAMPLES_REQUIRED = Math.max(
        newConfig.MIN_SAMPLES_REQUIRED,
        Math.min(newConfig.MAX_SAMPLES_REQUIRED, newConfig.SAMPLES_REQUIRED)
      )
      
      newConfig.AUTOENCODER_THRESHOLD = Math.max(
        newConfig.MIN_THRESHOLD,
        Math.min(newConfig.MAX_THRESHOLD, newConfig.AUTOENCODER_THRESHOLD)
      )
      
      newConfig.VOICE_SIMILARITY_THRESHOLD = Math.max(
        newConfig.MIN_VOICE_THRESHOLD,
        Math.min(newConfig.MAX_VOICE_THRESHOLD, newConfig.VOICE_SIMILARITY_THRESHOLD)
      )

      await chrome.storage.local.set({ authConfig: newConfig })
      return newConfig
    } catch (error) {
      console.error('Error updating auth config:', error)
      throw error
    }
  }

  static async resetToDefaults() {
    try {
      await chrome.storage.local.set({ authConfig: this.DEFAULT_CONFIG })
      return this.DEFAULT_CONFIG
    } catch (error) {
      console.error('Error resetting auth config:', error)
      throw error
    }
  }

  static validateConfig(config) {
    const errors = []
    
    if (config.SAMPLES_REQUIRED < config.MIN_SAMPLES_REQUIRED || 
        config.SAMPLES_REQUIRED > config.MAX_SAMPLES_REQUIRED) {
      errors.push('Samples required must be between min and max values')
    }
    
    if (config.AUTOENCODER_THRESHOLD < config.MIN_THRESHOLD || 
        config.AUTOENCODER_THRESHOLD > config.MAX_THRESHOLD) {
      errors.push('Autoencoder threshold must be between min and max values')
    }
    
    if (config.VOICE_SIMILARITY_THRESHOLD < config.MIN_VOICE_THRESHOLD || 
        config.VOICE_SIMILARITY_THRESHOLD > config.MAX_VOICE_THRESHOLD) {
      errors.push('Voice similarity threshold must be between min and max values')
    }
    
    return errors
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.AuthConfig = AuthConfig
} else if (typeof global !== 'undefined') {
  global.AuthConfig = AuthConfig
} 