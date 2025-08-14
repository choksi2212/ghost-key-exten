// Admin Panel JavaScript for GhostKey Extension
class AdminPanel {
  constructor() {
    this.config = null
    this.init()
  }

  async init() {
    await this.loadConfig()
    this.bindEvents()
    this.updateUI()
    this.loadStatistics()
  }

  async loadConfig() {
    try {
      this.config = await AuthConfig.getConfig()
    } catch (error) {
      console.error('Error loading config:', error)
      this.showNotification('Error loading configuration', 'error')
    }
  }

  bindEvents() {
    // Range inputs with real-time updates
    const rangeInputs = [
      { id: 'samplesRequired', key: 'SAMPLES_REQUIRED', valueId: 'samplesRequiredValue' },
      { id: 'authThreshold', key: 'AUTOENCODER_THRESHOLD', valueId: 'authThresholdValue', decimals: 3 },
      { id: 'holdTimeWeight', key: 'HOLD_TIME_WEIGHT', valueId: 'holdTimeWeightValue', decimals: 2 },
      { id: 'dwellTimeWeight', key: 'DWELL_TIME_WEIGHT', valueId: 'dwellTimeWeightValue', decimals: 2 },
      { id: 'flightTimeWeight', key: 'FLIGHT_TIME_WEIGHT', valueId: 'flightTimeWeightValue', decimals: 2 },
      { id: 'pressureVarianceWeight', key: 'PRESSURE_VARIANCE_WEIGHT', valueId: 'pressureVarianceWeightValue', decimals: 2 },
      { id: 'voiceSamples', key: 'VOICE_SAMPLES_REQUIRED', valueId: 'voiceSamplesValue' },
      { id: 'voiceThreshold', key: 'VOICE_SIMILARITY_THRESHOLD', valueId: 'voiceThresholdValue', decimals: 2 },
      { id: 'voiceTimeout', key: 'VOICE_TIMEOUT', valueId: 'voiceTimeoutValue', suffix: 's', convert: (v) => v * 1000 },
      { id: 'maxFailedAttempts', key: 'MAX_FAILED_ATTEMPTS', valueId: 'maxFailedAttemptsValue' },
      { id: 'lockoutDuration', key: 'LOCKOUT_DURATION', valueId: 'lockoutDurationValue', suffix: 'm', convert: (v) => v * 60000 },
      { id: 'sessionTimeout', key: 'SESSION_TIMEOUT', valueId: 'sessionTimeoutValue', suffix: 'm', convert: (v) => v * 60000 },
      { id: 'learningRate', key: 'LEARNING_RATE', valueId: 'learningRateValue', decimals: 4 },
      { id: 'epochs', key: 'EPOCHS', valueId: 'epochsValue' },
      { id: 'batchSize', key: 'BATCH_SIZE', valueId: 'batchSizeValue' },
      { id: 'notificationDuration', key: 'NOTIFICATION_DURATION', valueId: 'notificationDurationValue', suffix: 's', convert: (v) => v * 1000 },
      { id: 'uiFadeDelay', key: 'UI_FADE_DELAY', valueId: 'uiFadeDelayValue', suffix: 's', convert: (v) => v * 1000 },
      { id: 'noiseLevel', key: 'NOISE_LEVEL', valueId: 'noiseLevelValue', decimals: 2 },
      { id: 'augmentationFactor', key: 'AUGMENTATION_FACTOR', valueId: 'augmentationFactorValue', suffix: 'x' }
    ]

    rangeInputs.forEach(({ id, key, valueId, decimals = 0, suffix = '', convert }) => {
      const input = document.getElementById(id)
      const valueSpan = document.getElementById(valueId)
      
      if (input && valueSpan) {
        input.addEventListener('input', (e) => {
          let value = parseFloat(e.target.value)
          if (convert) value = convert(value)
          
          this.config[key] = value
          
          let displayValue = convert ? parseFloat(e.target.value) : value
          if (decimals > 0) {
            displayValue = displayValue.toFixed(decimals)
          }
          valueSpan.textContent = displayValue + suffix
        })
      }
    })

    // Checkbox inputs
    const checkboxInputs = [
      { id: 'encryptionEnabled', key: 'ENCRYPTION_ENABLED' },
      { id: 'autoEnable', key: 'AUTO_ENABLE' },
      { id: 'showNotifications', key: 'SHOW_NOTIFICATIONS' }
    ]

    checkboxInputs.forEach(({ id, key }) => {
      const input = document.getElementById(id)
      if (input) {
        input.addEventListener('change', (e) => {
          this.config[key] = e.target.checked
        })
      }
    })

    // Button events
    document.getElementById('saveConfig')?.addEventListener('click', () => this.saveConfig())
    document.getElementById('loadConfig')?.addEventListener('click', () => this.reloadConfig())
    document.getElementById('exportConfig')?.addEventListener('click', () => this.exportConfig())
    document.getElementById('importConfig')?.addEventListener('click', () => this.importConfig())
    document.getElementById('resetConfig')?.addEventListener('click', () => this.resetConfig())
  }

  updateUI() {
    if (!this.config) return

    // Update range inputs
    const ranges = [
      { id: 'samplesRequired', key: 'SAMPLES_REQUIRED', valueId: 'samplesRequiredValue' },
      { id: 'authThreshold', key: 'AUTOENCODER_THRESHOLD', valueId: 'authThresholdValue', decimals: 3 },
      { id: 'holdTimeWeight', key: 'HOLD_TIME_WEIGHT', valueId: 'holdTimeWeightValue', decimals: 2 },
      { id: 'dwellTimeWeight', key: 'DWELL_TIME_WEIGHT', valueId: 'dwellTimeWeightValue', decimals: 2 },
      { id: 'flightTimeWeight', key: 'FLIGHT_TIME_WEIGHT', valueId: 'flightTimeWeightValue', decimals: 2 },
      { id: 'pressureVarianceWeight', key: 'PRESSURE_VARIANCE_WEIGHT', valueId: 'pressureVarianceWeightValue', decimals: 2 },
      { id: 'voiceSamples', key: 'VOICE_SAMPLES_REQUIRED', valueId: 'voiceSamplesValue' },
      { id: 'voiceThreshold', key: 'VOICE_SIMILARITY_THRESHOLD', valueId: 'voiceThresholdValue', decimals: 2 },
      { id: 'voiceTimeout', key: 'VOICE_TIMEOUT', valueId: 'voiceTimeoutValue', suffix: 's', convert: (v) => v / 1000 },
      { id: 'maxFailedAttempts', key: 'MAX_FAILED_ATTEMPTS', valueId: 'maxFailedAttemptsValue' },
      { id: 'lockoutDuration', key: 'LOCKOUT_DURATION', valueId: 'lockoutDurationValue', suffix: 'm', convert: (v) => v / 60000 },
      { id: 'sessionTimeout', key: 'SESSION_TIMEOUT', valueId: 'sessionTimeoutValue', suffix: 'm', convert: (v) => v / 60000 },
      { id: 'learningRate', key: 'LEARNING_RATE', valueId: 'learningRateValue', decimals: 4 },
      { id: 'epochs', key: 'EPOCHS', valueId: 'epochsValue' },
      { id: 'batchSize', key: 'BATCH_SIZE', valueId: 'batchSizeValue' },
      { id: 'notificationDuration', key: 'NOTIFICATION_DURATION', valueId: 'notificationDurationValue', suffix: 's', convert: (v) => v / 1000 },
      { id: 'uiFadeDelay', key: 'UI_FADE_DELAY', valueId: 'uiFadeDelayValue', suffix: 's', convert: (v) => v / 1000 },
      { id: 'noiseLevel', key: 'NOISE_LEVEL', valueId: 'noiseLevelValue', decimals: 2 },
      { id: 'augmentationFactor', key: 'AUGMENTATION_FACTOR', valueId: 'augmentationFactorValue', suffix: 'x' }
    ]

    ranges.forEach(({ id, key, valueId, decimals = 0, suffix = '', convert }) => {
      const input = document.getElementById(id)
      const valueSpan = document.getElementById(valueId)
      
      if (input && valueSpan && this.config[key] !== undefined) {
        let value = this.config[key]
        let displayValue = convert ? convert(value) : value
        
        input.value = displayValue
        
        if (decimals > 0) {
          displayValue = displayValue.toFixed(decimals)
        }
        valueSpan.textContent = displayValue + suffix
      }
    })

    // Update checkboxes
    const checkboxes = [
      { id: 'encryptionEnabled', key: 'ENCRYPTION_ENABLED' },
      { id: 'autoEnable', key: 'AUTO_ENABLE' },
      { id: 'showNotifications', key: 'SHOW_NOTIFICATIONS' }
    ]

    checkboxes.forEach(({ id, key }) => {
      const input = document.getElementById(id)
      if (input && this.config[key] !== undefined) {
        input.checked = this.config[key]
      }
    })
  }

  async loadStatistics() {
    try {
      const stats = await chrome.storage.local.get(['userProfiles', 'authLogs'])
      const userProfiles = stats.userProfiles || {}
      const authLogs = stats.authLogs || []

      // Total profiles
      document.getElementById('totalProfiles').textContent = Object.keys(userProfiles).length

      // Total attempts and success rate
      document.getElementById('totalAttempts').textContent = authLogs.length
      
      if (authLogs.length > 0) {
        const successfulAttempts = authLogs.filter(log => log.success).length
        const successRate = Math.round((successfulAttempts / authLogs.length) * 100)
        document.getElementById('successRate').textContent = `${successRate}%`

        // Last activity
        const lastLog = authLogs[authLogs.length - 1]
        if (lastLog) {
          const lastActivity = new Date(lastLog.timestamp).toLocaleString()
          document.getElementById('lastActivity').textContent = lastActivity
        }
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  async saveConfig() {
    try {
      // Validate configuration
      const errors = AuthConfig.validateConfig(this.config)
      if (errors.length > 0) {
        this.showNotification('Validation errors: ' + errors.join(', '), 'error')
        return
      }

      await AuthConfig.updateConfig(this.config)
      this.showNotification('Configuration saved successfully!', 'success')
      
      // Reload to ensure we have the latest values
      await this.loadConfig()
      this.updateUI()
    } catch (error) {
      console.error('Error saving config:', error)
      this.showNotification('Error saving configuration', 'error')
    }
  }

  async reloadConfig() {
    try {
      await this.loadConfig()
      this.updateUI()
      this.loadStatistics()
      this.showNotification('Configuration reloaded', 'success')
    } catch (error) {
      console.error('Error reloading config:', error)
      this.showNotification('Error reloading configuration', 'error')
    }
  }

  exportConfig() {
    try {
      const configJson = JSON.stringify(this.config, null, 2)
      const blob = new Blob([configJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `ghostkey-config-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      this.showNotification('Configuration exported successfully!', 'success')
    } catch (error) {
      console.error('Error exporting config:', error)
      this.showNotification('Error exporting configuration', 'error')
    }
  }

  importConfig() {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        
        try {
          const text = await file.text()
          const importedConfig = JSON.parse(text)
          
          // Validate imported config
          const errors = AuthConfig.validateConfig(importedConfig)
          if (errors.length > 0) {
            this.showNotification('Invalid configuration: ' + errors.join(', '), 'error')
            return
          }
          
          this.config = importedConfig
          await this.saveConfig()
          this.updateUI()
          this.showNotification('Configuration imported successfully!', 'success')
        } catch (error) {
          console.error('Error importing config:', error)
          this.showNotification('Error importing configuration', 'error')
        }
      }
      
      input.click()
    } catch (error) {
      console.error('Error in import function:', error)
      this.showNotification('Error importing configuration', 'error')
    }
  }

  async resetConfig() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      try {
        this.config = await AuthConfig.resetToDefaults()
        this.updateUI()
        this.showNotification('Configuration reset to defaults', 'success')
      } catch (error) {
        console.error('Error resetting config:', error)
        this.showNotification('Error resetting configuration', 'error')
      }
    }
  }

  showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification')
    if (existing) {
      existing.remove()
    }

    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show')
    }, 100)
    
    // Auto remove
    setTimeout(() => {
      notification.classList.remove('show')
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove()
        }
      }, 300)
    }, 3000)
  }
}

// Initialize admin panel when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel()
  })
} else {
  new AdminPanel()
} 