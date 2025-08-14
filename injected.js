// This file is injected into web pages for additional functionality
;(() => {
  // Enhanced password field detection
  function detectPasswordFields() {
    const selectors = [
      'input[type="password"]',
      'input[name*="password" i]',
      'input[name*="passwd" i]',
      'input[name*="pwd" i]',
      'input[id*="password" i]',
      'input[id*="passwd" i]',
      'input[id*="pwd" i]',
      'input[placeholder*="password" i]',
      'input[autocomplete="current-password"]',
      'input[autocomplete="new-password"]',
    ]

    const fields = []
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((field) => {
        if (!fields.includes(field)) {
          fields.push(field)
        }
      })
    })

    return fields
  }

  // Enhanced login form detection
  function detectLoginForms() {
    const forms = document.querySelectorAll("form")
    const loginForms = []

    forms.forEach((form) => {
      const hasPasswordField = form.querySelector('input[type="password"]')
      const hasUsernameField = form.querySelector(
        'input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"]',
      )

      if (hasPasswordField && hasUsernameField) {
        loginForms.push(form)
      }
    })

    return loginForms
  }

  // Notify content script about page structure
  function notifyPageStructure() {
    const passwordFields = detectPasswordFields()
    const loginForms = detectLoginForms()

    window.postMessage(
      {
        type: "GHOSTKEY_PAGE_ANALYSIS",
        source: "injected",
        data: {
          passwordFields: passwordFields.length,
          loginForms: loginForms.length,
          url: window.location.href,
          title: document.title,
        },
      },
      "*",
    )
  }

  // Run analysis when page loads and when DOM changes
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", notifyPageStructure)
  } else {
    notifyPageStructure()
  }

  // Watch for dynamic content changes
  const observer = new MutationObserver((mutations) => {
    let shouldReanalyze = false

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches('input[type="password"], form') || node.querySelector('input[type="password"], form')) {
              shouldReanalyze = true
            }
          }
        })
      }
    })

    if (shouldReanalyze) {
      setTimeout(notifyPageStructure, 100)
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
})()
