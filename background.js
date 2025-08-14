class BackgroundService {
  constructor() {
    this.cryptoUtils = null
    this.encryptionKey = null
    this.authConfig = null
    this.init()
  }

  init() {
    console.log("GhostKey background script initializing...")
    
    // Initialize crypto utilities (will be null if not available)
    try {
      if (typeof CryptoUtils !== 'undefined') {
        this.cryptoUtils = new CryptoUtils()
        console.log("CryptoUtils initialized")
      } else {
        console.log("CryptoUtils not available, continuing without encryption")
      }
    } catch (error) {
      console.log("CryptoUtils initialization failed:", error)
    }

    // Initialize auth config (will use defaults if not available)
    this.initAuthConfig()

    // Listen for extension installation
    chrome.runtime.onInstalled.addListener(() => {
      console.log("GhostKey Extension installed")
      this.initializeStorage()
    })

    // Listen for tab updates to auto-enable on login pages
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith("chrome://")) {
        this.checkAutoEnable(tabId, tab.url)
      }
    })

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async responses
    })
  }

  async initAuthConfig() {
    try {
      if (typeof AuthConfig !== 'undefined') {
        this.authConfig = await AuthConfig.getConfig()
        console.log("AuthConfig loaded:", this.authConfig)
      } else {
        console.log("AuthConfig not available, using defaults")
        this.authConfig = this.getDefaultConfig()
      }
      
      // Initialize encryption if enabled
      if (this.authConfig.ENCRYPTION_ENABLED && this.cryptoUtils) {
        await this.initializeEncryption()
      }
    } catch (error) {
      console.error("Auth config initialization failed:", error)
      this.authConfig = this.getDefaultConfig()
    }
  }

  getDefaultConfig() {
    return {
      SAMPLES_REQUIRED: 10,
      AUTOENCODER_THRESHOLD: 0.03,
      VOICE_SAMPLES_REQUIRED: 5,
      VOICE_SIMILARITY_THRESHOLD: 0.75,
      NOISE_LEVEL: 0.1,
      AUGMENTATION_FACTOR: 3,
      ENCRYPTION_ENABLED: true,
      MAX_FAILED_ATTEMPTS: 3,
      LOCKOUT_DURATION: 300000,
      SESSION_TIMEOUT: 1800000,
      AUTO_ENABLE: true,
      SHOW_NOTIFICATIONS: true,
      NOTIFICATION_DURATION: 5000,
      UI_FADE_DELAY: 15000,
      LOGIN_PATTERNS: ['login', 'signin', 'sign-in', 'log-in', 'auth', 'authenticate'],
      SIGNUP_PATTERNS: ['signup', 'sign-up', 'register', 'registration', 'create', 'join']
    }
  }

  async initializeEncryption() {
    try {
      // Try to get existing encryption key
      const stored = await chrome.storage.local.get(['encryptionKey'])
      if (stored.encryptionKey && this.cryptoUtils) {
        this.encryptionKey = await this.cryptoUtils.importKey(stored.encryptionKey)
        console.log("Encryption key loaded")
      } else if (this.cryptoUtils) {
        // Generate new key
        this.encryptionKey = await this.cryptoUtils.generateKey()
        const exportedKey = await this.cryptoUtils.exportKey(this.encryptionKey)
        await chrome.storage.local.set({ encryptionKey: exportedKey })
        console.log("New encryption key generated")
      }
    } catch (error) {
      console.error('Background encryption initialization failed:', error)
      this.authConfig.ENCRYPTION_ENABLED = false
    }
  }

  async initializeStorage() {
    console.log("Initializing storage...")
    
    const defaultSettings = {
      autoEnable: true,
      voiceAuthEnabled: true,
      privacyMode: false,
      userProfiles: {},
      trainingInProgress: false,
      authConfig: this.authConfig || this.getDefaultConfig(),
    }

    // Only set defaults if they don't exist
    const existing = await chrome.storage.local.get(Object.keys(defaultSettings))
    const toSet = {}

    for (const [key, value] of Object.entries(defaultSettings)) {
      if (existing[key] === undefined) {
        toSet[key] = value
      }
    }

    if (Object.keys(toSet).length > 0) {
      await chrome.storage.local.set(toSet)
      console.log("Default settings initialized:", toSet)
    }
  }

  async checkAutoEnable(tabId, url) {
    try {
      const settings = await chrome.storage.local.get(["autoEnable", "userProfiles", "authConfig"])
      const authConfig = settings.authConfig || this.getDefaultConfig()

      if (!settings.autoEnable) {
        console.log("Auto-enable disabled")
        return
      }

      if (Object.keys(settings.userProfiles || {}).length === 0) {
        console.log("No user profiles found")
        return
      }

      // Use configurable patterns
      const loginPatterns = authConfig.LOGIN_PATTERNS || [
        'login', 'signin', 'auth', 'account', 'portal', 'dashboard'
      ]
      const signupPatterns = authConfig.SIGNUP_PATTERNS || [
        'signup', 'register', 'create', 'join'
      ]

      const isLoginPage = loginPatterns.some((pattern) => url.toLowerCase().includes(pattern))
      const isSignupPage = signupPatterns.some((pattern) => url.toLowerCase().includes(pattern))

      if (isLoginPage || isSignupPage) {
        console.log(`Auto-enabling on ${isSignupPage ? 'signup' : 'login'} page:`, url)
        
        // Inject authentication interface
        await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            console.log("GhostKey: Sending auto-enable message")
            window.postMessage(
              {
                type: "GHOSTKEY_AUTO_ENABLE",
                source: "extension",
              },
              "*",
            )
          },
        })
      }
    } catch (error) {
      console.error("Error in auto-enable:", error)
    }
  }

  async handleMessage(message, sender, sendResponse) {
    console.log("Background received message:", message.type)
    
    try {
      switch (message.type) {
        case "SAVE_USER_PROFILE":
          await this.saveUserProfile(message.data)
          sendResponse({ success: true })
          break

        case "GET_USER_PROFILE":
          const profile = await this.getUserProfile(message.username)
          sendResponse({ success: true, profile })
          break

        case "AUTHENTICATE_USER":
          const authResult = await this.authenticateUser(message.username, message.features)
          sendResponse({ success: true, result: authResult })
          break

        case "SAVE_TRAINING_SAMPLE":
          await this.saveTrainingSample(message.data)
          sendResponse({ success: true })
          break

        case "SET_TRAINING_STATUS":
          await this.setTrainingStatus(message.data)
          sendResponse({ success: true })
          break

        case "GET_SETTINGS":
          const settings = await chrome.storage.local.get([
            "autoEnable",
            "voiceAuthEnabled",
            "privacyMode",
            "authConfig",
          ])
          sendResponse({ success: true, settings })
          break

        case "LOG_AUTH_ATTEMPT":
          await this.logAuthAttempt(message.data)
          sendResponse({ success: true })
          break

        default:
          console.log("Unknown message type:", message.type)
          sendResponse({ success: false, error: "Unknown message type" })
      }
    } catch (error) {
      console.error("Error handling message:", error)
      sendResponse({ success: false, error: error.message })
    }
  }

  async saveUserProfile(profileData) {
    console.log("Saving user profile:", profileData.username)
    
    const { userProfiles } = await chrome.storage.local.get(["userProfiles"])
    const profiles = userProfiles || {}

    profiles[profileData.username] = {
      ...profileData,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }

    await chrome.storage.local.set({
      userProfiles: profiles,
      currentUser: profileData.username,
    })
    
    console.log("Profile saved successfully")
  }

  async getUserProfile(username) {
    const { userProfiles } = await chrome.storage.local.get(["userProfiles"])
    return userProfiles?.[username] || null
  }

  async authenticateUser(username, features) {
    console.log("Authenticating user:", username)
    
    try {
      const result = await chrome.storage.local.get(['userProfiles', 'authConfig'])
      const userProfiles = result.userProfiles || {}
      const authConfig = result.authConfig || this.getDefaultConfig()

      if (!userProfiles[username]) {
        console.log("User profile not found:", username)
        return {
          authenticated: false,
          reconstructionError: 1.0,
          reason: "User profile not found"
        }
      }

      // Simple authentication for demo purposes
      const threshold = authConfig.AUTOENCODER_THRESHOLD || 0.03
      const reconstructionError = Math.random() * 0.05 // Simulate calculation
      const authenticated = reconstructionError < threshold

      console.log("Authentication result:", { authenticated, reconstructionError, threshold })

      return {
        authenticated,
        reconstructionError,
        threshold,
        username
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return {
        authenticated: false,
        reconstructionError: 1.0,
        reason: error.message
      }
    }
  }

  async saveTrainingSample(sampleData) {
    console.log("Saving training sample for:", sampleData.username)
    
    const key = `training_${sampleData.username}`
    const existing = await chrome.storage.local.get([key])
    const samples = existing[key] || []

    samples.push({
      ...sampleData,
      timestamp: new Date().toISOString(),
    })

    await chrome.storage.local.set({
      [key]: samples,
      trainingSamples: samples.length,
      trainingUser: sampleData.username,
      requiredSamples: this.authConfig?.SAMPLES_REQUIRED || 10,
    })
    
    console.log("Training sample saved, total samples:", samples.length)
  }

  async setTrainingStatus(statusData) {
    console.log("Setting training status:", statusData)
    
    await chrome.storage.local.set({
      trainingInProgress: statusData.inProgress,
      trainingUser: statusData.user,
    })
  }

  async logAuthAttempt(logData) {
    const logs = await chrome.storage.local.get(["authLogs"])
    const authLogs = logs.authLogs || []

    authLogs.push({
      ...logData,
      timestamp: new Date().toISOString(),
    })

    // Keep only last 100 logs
    if (authLogs.length > 100) {
      authLogs.splice(0, authLogs.length - 100)
    }

    await chrome.storage.local.set({ authLogs })
  }
}

// Initialize background service
console.log("Starting GhostKey background service...")
new BackgroundService()
