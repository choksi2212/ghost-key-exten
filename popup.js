// Declare chrome variable to fix lint/correctness/noUndeclaredVariables error
const chrome = window.chrome

class PopupManager {
  constructor() {
    this.init()
  }

  async init() {
    await this.loadStatus()
    this.bindEvents()
    this.loadSettings()
  }

  async loadStatus() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      // Check if user has registered profiles
      const result = await chrome.storage.local.get(["userProfiles", "currentUser", "trainingInProgress"])
      const userProfiles = result.userProfiles || {}
      const currentUser = result.currentUser
      const trainingInProgress = result.trainingInProgress

      const statusDot = document.getElementById("statusDot")
      const statusText = document.getElementById("statusText")
      const alertContainer = document.getElementById("alertContainer")

      // Clear all sections first
      document.getElementById("registrationSection").classList.add("hidden")
      document.getElementById("authenticationSection").classList.add("hidden")
      document.getElementById("trainingSection").classList.add("hidden")

      if (trainingInProgress) {
        // Training is in progress
        statusText.textContent = "Training in progress..."
        document.getElementById("trainingSection").classList.remove("hidden")
        this.updateTrainingProgress()
        this.showAlert("info", "🔄 Complete the training process on the webpage")
      } else if (Object.keys(userProfiles).length === 0) {
        // No profiles registered
        statusText.textContent = "No biometric profiles registered"
        document.getElementById("registrationSection").classList.remove("hidden")
        this.showAlert("info", "🔐 Create your first biometric profile to get started")
      } else if (currentUser && userProfiles[currentUser]) {
        // User has profile and is logged in
        statusDot.classList.add("active")
        statusText.textContent = `Active profile: ${currentUser}`
        document.getElementById("authenticationSection").classList.remove("hidden")
        this.showAlert("success", "✅ Biometric authentication ready")
      } else {
        // Profiles exist but no current user
        statusText.textContent = "Biometric profiles available"
        document.getElementById("authenticationSection").classList.remove("hidden")
        this.showAlert("info", "🔑 Click to enable authentication on this page")
      }
    } catch (error) {
      console.error("Error loading status:", error)
      this.showAlert("error", "❌ Error loading authentication status")
    }
  }

  bindEvents() {
    // Registration
    document.getElementById("startRegistration").addEventListener("click", () => {
      this.startRegistration()
    })

    // Authentication
    document.getElementById("enableAuth").addEventListener("click", () => {
      this.enableAuthentication()
    })

    document.getElementById("testAuth").addEventListener("click", () => {
      this.testAuthentication()
    })

    // Settings toggles
    document.getElementById("autoEnable").addEventListener("click", (e) => {
      e.target.classList.toggle("active")
      chrome.storage.local.set({ autoEnable: e.target.classList.contains("active") })
    })

    document.getElementById("voiceAuth").addEventListener("click", (e) => {
      e.target.classList.toggle("active")
      chrome.storage.local.set({ voiceAuthEnabled: e.target.classList.contains("active") })
    })

    document.getElementById("privacyMode").addEventListener("click", (e) => {
      e.target.classList.toggle("active")
      chrome.storage.local.set({ privacyMode: e.target.classList.contains("active") })
    })

    // Clear data
    document.getElementById("clearData").addEventListener("click", () => {
      this.clearAllData()
    })

    // Admin panel button
    document.getElementById("adminPanel")?.addEventListener("click", () => this.openAdminPanel())
  }

  async loadSettings() {
    const settings = await chrome.storage.local.get(["autoEnable", "voiceAuthEnabled", "privacyMode"])

    const autoEnable = document.getElementById("autoEnable")
    const voiceAuth = document.getElementById("voiceAuth")
    const privacyMode = document.getElementById("privacyMode")

    if (settings.autoEnable !== false) autoEnable.classList.add("active")
    if (settings.voiceAuthEnabled !== false) voiceAuth.classList.add("active")
    if (settings.privacyMode === true) privacyMode.classList.add("active")
  }

  async startRegistration() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      // Check if we're on a chrome:// URL
      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("moz-extension://")
      ) {
        this.showAlert("error", "❌ Cannot register on browser pages. Please navigate to a regular website first.")
        return
      }

      // Inject the registration interface
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          window.postMessage(
            {
              type: "GHOSTKEY_START_REGISTRATION",
              source: "extension",
            },
            "*",
          )
        },
      })

      this.showAlert("info", "🔄 Registration started! Follow the instructions on the webpage.")

      // Update UI to show training in progress
      setTimeout(() => {
        this.loadStatus()
      }, 1000)

      window.close()
    } catch (error) {
      console.error("Error starting registration:", error)
      this.showAlert(
        "error",
        "❌ Failed to start registration. Make sure you're on a regular webpage (not chrome:// or extension pages).",
      )
    }
  }

  async enableAuthentication() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      // Check if we're on a chrome:// URL
      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("moz-extension://")
      ) {
        this.showAlert(
          "error",
          "❌ Cannot enable authentication on browser pages. Please navigate to a regular website first.",
        )
        return
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          window.postMessage(
            {
              type: "GHOSTKEY_ENABLE_AUTH",
              source: "extension",
            },
            "*",
          )
        },
      })

      this.showAlert("success", "⚡ Authentication enabled on this page")
      window.close()
    } catch (error) {
      console.error("Error enabling authentication:", error)
      this.showAlert("error", "❌ Failed to enable authentication")
    }
  }

  async testAuthentication() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      // Check if we're on a chrome:// URL
      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("moz-extension://")
      ) {
        this.showAlert(
          "error",
          "❌ Cannot test authentication on browser pages. Please navigate to a regular website first.",
        )
        return
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          window.postMessage(
            {
              type: "GHOSTKEY_TEST_AUTH",
              source: "extension",
            },
            "*",
          )
        },
      })

      this.showAlert("info", "🧪 Test mode activated. Try typing in a password field to test authentication.")
      window.close()
    } catch (error) {
      console.error("Error testing authentication:", error)
      this.showAlert("error", "❌ Failed to start test mode")
    }
  }

  async clearAllData() {
    if (confirm("Are you sure you want to clear all biometric data? This cannot be undone.")) {
      try {
        await chrome.storage.local.clear()
        this.showAlert("success", "🗑️ All data cleared successfully")
        setTimeout(() => {
          this.loadStatus()
        }, 1000)
      } catch (error) {
        console.error("Error clearing data:", error)
        this.showAlert("error", "❌ Failed to clear data")
      }
    }
  }

  showAlert(type, message) {
    const alertContainer = document.getElementById("alertContainer")
    const alert = document.createElement("div")
    alert.className = `alert alert-${type}`
    alert.textContent = message

    alertContainer.innerHTML = ""
    alertContainer.appendChild(alert)

    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove()
      }
    }, 5000)
  }

  async updateTrainingProgress() {
    const trainingData = await chrome.storage.local.get(["trainingSamples", "requiredSamples", "trainingUser"])

    const samples = trainingData.trainingSamples || 0
    const required = trainingData.requiredSamples || 10
    const progress = (samples / required) * 100

    const progressFill = document.getElementById("progressFill")
    const trainingStatus = document.getElementById("trainingStatus")

    if (progressFill) {
      progressFill.style.width = `${progress}%`
    }

    if (trainingStatus) {
      trainingStatus.textContent = `${samples}/${required} samples collected for ${trainingData.trainingUser || "user"}`
    }

    if (samples >= required) {
      document.getElementById("trainingSection").classList.add("hidden")
      this.showAlert("success", "🎉 Training completed! Voice registration will start next.")
      setTimeout(() => {
        this.loadStatus()
      }, 2000)
    }
  }

  async openAdminPanel() {
    try {
      const adminUrl = chrome.runtime.getURL('admin.html')
      await chrome.tabs.create({ url: adminUrl })
      window.close()
    } catch (error) {
      console.error('Error opening admin panel:', error)
      this.showAlert("error", "❌ Failed to open admin panel")
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PopupManager()
})
