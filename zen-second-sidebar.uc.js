// ==UserScript==
// @name            Zen Garden - Second Sidebar
// @description     A second sidebar with web panels for Zen Browser, bringing web panels back with native feel and look. Supports customizable positioning, web panel management, and auto-hide features.
// @author          k00lagin
// @homepageURL     https://github.com/k00lagin/zen-second-sidebar
// @include         chrome://browser/content/browser.xhtml
// @version         2.0.0
// ==/UserScript==

// Check if already loaded to prevent multiple initializations
if (window.zenSecondSidebarLoaded) {
  console.log("Zen Second Sidebar: Already loaded, skipping...");
} else {
  window.zenSecondSidebarLoaded = true;

  // PREFS object for Sine compatibility
  const PREFS = {
    ENABLED: "zen-extra-sidebar.enabled",
    POSITION: "zen-extra-sidebar.settings.position", 
    NEW_WEB_PANEL_POSITION: "zen-extra-sidebar.settings.newWebPanelPosition",
    HIDE_IN_POPUP_WINDOWS: "zen-extra-sidebar.settings.hideInPopupWindows",
    AUTO_HIDE_BACK_BUTTON: "zen-extra-sidebar.settings.autoHideBackButton",
    AUTO_HIDE_FORWARD_BUTTON: "zen-extra-sidebar.settings.autoHideForwardButton",
    CONTAINER_BORDER: "zen-extra-sidebar.settings.containerBorder",
    AUTO_HIDE_SIDEBAR: "zen-extra-sidebar.settings.autoHideSidebar",
    HIDE_SIDEBAR_ANIMATED: "zen-extra-sidebar.settings.hideSidebarAnimated",

    defaultValues: {
      "zen-extra-sidebar.enabled": true,
      "zen-extra-sidebar.settings.position": "right",
      "zen-extra-sidebar.settings.newWebPanelPosition": "after", 
      "zen-extra-sidebar.settings.hideInPopupWindows": false,
      "zen-extra-sidebar.settings.autoHideBackButton": false,
      "zen-extra-sidebar.settings.autoHideForwardButton": false,
      "zen-extra-sidebar.settings.containerBorder": "left",
      "zen-extra-sidebar.settings.autoHideSidebar": false,
      "zen-extra-sidebar.settings.hideSidebarAnimated": false
    },

    getPref(key) {
      try {
        const prefBranch = Services.prefs.getBranch("");
        const defaultValue = this.defaultValues[key];

        if (typeof defaultValue === "boolean") {
          return prefBranch.getBoolPref(key, defaultValue);
        } else if (typeof defaultValue === "string") {
          return prefBranch.getStringPref(key, defaultValue);
        } else if (typeof defaultValue === "number") {
          return prefBranch.getIntPref(key, defaultValue);
        }
        return defaultValue;
      } catch (e) {
        console.error("Zen Second Sidebar: Error getting preference:", e);
        return this.defaultValues[key];
      }
    },

    setPref(prefKey, value) {
      try {
        const prefBranch = Services.prefs.getBranch("");
        
        if (typeof value === "boolean") {
          prefBranch.setBoolPref(prefKey, value);
        } else if (typeof value === "string") {
          prefBranch.setStringPref(prefKey, value);
        } else if (typeof value === "number") {
          prefBranch.setIntPref(prefKey, value);
        }
      } catch (e) {
        console.error("Zen Second Sidebar: Error setting preference:", e);
      }
    },

    setInitialPrefs() {
      for (const [key, value] of Object.entries(this.defaultValues)) {
        if (!Services.prefs.prefHasUserValue(key)) {
          this.setPref(key, value);
        }
      }
    }
  };

  // Initialize preferences
  PREFS.setInitialPrefs();

  const debugLog = (...args) => {
    console.log("Zen Second Sidebar:", ...args);
  };

  const debugError = (...args) => {
    console.error("Zen Second Sidebar:", ...args);
  };

  // Utility functions
  const isPopupWindow = () => {
    return window.toolbar && !window.toolbar.visible;
  };

  const createElement = (tagName, attributes = {}, children = []) => {
    const element = document.createElement(tagName);
    
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    }
    
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    
    return element;
  };

  // Main ZenSecondSidebar implementation
  const ZenSecondSidebar = {
    initialized: false,
    sidebarElement: null,
    webPanels: [],

    init() {
      if (this.initialized || !PREFS.getPref(PREFS.ENABLED)) {
        return;
      }

      debugLog("Initializing second sidebar...");

      try {
        // Check if we're in the right window
        if (window !== window.top) return;

        // Check if we should hide in popup windows
        if (isPopupWindow() && PREFS.getPref(PREFS.HIDE_IN_POPUP_WINDOWS)) {
          debugLog("Skipping initialization in popup window");
          return;
        }

        this.createSidebarStructure();
        this.applySettings();
        this.setupEventListeners();
        
        this.initialized = true;
        debugLog("Second sidebar initialized successfully");
      } catch (error) {
        debugError("Failed to initialize second sidebar:", error);
      }
    },

    createSidebarStructure() {
      debugLog("Creating sidebar structure...");
      
      // Find the main container
      const zenTabboxWrapper = document.getElementById("zen-tabbox-wrapper");
      if (!zenTabboxWrapper) {
        debugError("Could not find zen-tabbox-wrapper");
        return;
      }

      // Create the main sidebar container
      this.sidebarElement = createElement("div", {
        id: "zen-second-sidebar",
        class: "zen-second-sidebar",
        style: {
          position: "fixed",
          top: "0",
          height: "100vh",
          width: "300px",
          backgroundColor: "var(--zen-colors-secondary, #1e1e1e)",
          borderLeft: "1px solid var(--zen-colors-border, #333)",
          zIndex: "100",
          display: "flex",
          flexDirection: "column"
        }
      });

      // Create toolbar
      const toolbar = createElement("div", {
        class: "zen-second-sidebar-toolbar",
        style: {
          display: "flex",
          alignItems: "center",
          padding: "8px",
          backgroundColor: "var(--zen-colors-primary, #2d2d2d)",
          borderBottom: "1px solid var(--zen-colors-border, #333)",
          minHeight: "40px"
        }
      });

      // Create navigation buttons
      const backBtn = createElement("button", {
        id: "zen-sidebar-back",
        class: "zen-nav-button",
        title: "Back",
        style: {
          background: "transparent",
          border: "none",
          color: "var(--zen-colors-text, white)",
          padding: "6px",
          margin: "2px",
          borderRadius: "4px",
          cursor: "pointer",
          minWidth: "32px",
          height: "32px"
        }
      }, ["←"]);

      const forwardBtn = createElement("button", {
        id: "zen-sidebar-forward", 
        class: "zen-nav-button",
        title: "Forward",
        style: {
          background: "transparent",
          border: "none", 
          color: "var(--zen-colors-text, white)",
          padding: "6px",
          margin: "2px",
          borderRadius: "4px",
          cursor: "pointer",
          minWidth: "32px",
          height: "32px"
        }
      }, ["→"]);

      const refreshBtn = createElement("button", {
        id: "zen-sidebar-refresh",
        class: "zen-nav-button",
        title: "Refresh",
        style: {
          background: "transparent",
          border: "none",
          color: "var(--zen-colors-text, white)",
          padding: "6px",
          margin: "2px", 
          borderRadius: "4px",
          cursor: "pointer",
          minWidth: "32px",
          height: "32px"
        }
      }, ["↻"]);

      // Create URL bar
      const urlBar = createElement("input", {
        id: "zen-sidebar-urlbar",
        type: "text",
        placeholder: "Enter URL...",
        class: "zen-panel-urlbar",
        style: {
          flex: "1",
          background: "var(--zen-colors-input, #333)",
          border: "1px solid var(--zen-colors-border, #333)",
          borderRadius: "4px",
          padding: "6px 8px",
          color: "var(--zen-colors-text, white)",
          fontSize: "12px",
          margin: "0 4px"
        }
      });

      // Create new panel button
      const newPanelBtn = createElement("button", {
        id: "zen-sidebar-new-panel",
        class: "zen-nav-button",
        title: "New Web Panel",
        style: {
          background: "transparent",
          border: "none",
          color: "var(--zen-colors-text, white)", 
          padding: "6px",
          margin: "2px",
          borderRadius: "4px",
          cursor: "pointer",
          minWidth: "32px",
          height: "32px"
        }
      }, ["+"]);

      // Create web panel content area
      const contentArea = createElement("div", {
        class: "zen-web-panel-content",
        style: {
          flex: "1",
          overflow: "hidden",
          position: "relative"
        }
      });

      // Create default iframe
      const iframe = createElement("iframe", {
        id: "zen-sidebar-iframe",
        class: "zen-web-panel-iframe",
        src: "about:blank",
        style: {
          width: "100%",
          height: "100%",
          border: "none",
          background: "white"
        }
      });

      // Assemble the structure
      toolbar.appendChild(backBtn);
      toolbar.appendChild(forwardBtn);
      toolbar.appendChild(refreshBtn);
      toolbar.appendChild(urlBar);
      toolbar.appendChild(newPanelBtn);
      
      contentArea.appendChild(iframe);
      
      this.sidebarElement.appendChild(toolbar);
      this.sidebarElement.appendChild(contentArea);

      // Add to document
      document.body.appendChild(this.sidebarElement);

      debugLog("Sidebar structure created");
    },

    applySettings() {
      if (!this.sidebarElement) return;

      const position = PREFS.getPref(PREFS.POSITION);
      const autoHide = PREFS.getPref(PREFS.AUTO_HIDE_SIDEBAR);
      const animated = PREFS.getPref(PREFS.HIDE_SIDEBAR_ANIMATED);
      const border = PREFS.getPref(PREFS.CONTAINER_BORDER);

      debugLog(`Applying settings: position=${position}, autoHide=${autoHide}, animated=${animated}, border=${border}`);

      // Position
      if (position === "left") {
        this.sidebarElement.style.left = "0";
        this.sidebarElement.style.right = "auto";
        this.sidebarElement.style.borderLeft = "none";
        this.sidebarElement.style.borderRight = "1px solid var(--zen-colors-border, #333)";
      } else {
        this.sidebarElement.style.right = "0";
        this.sidebarElement.style.left = "auto";
        this.sidebarElement.style.borderRight = "none";
        this.sidebarElement.style.borderLeft = "1px solid var(--zen-colors-border, #333)";
      }

      // Auto-hide
      this.sidebarElement.setAttribute("data-auto-hide", autoHide);
      this.sidebarElement.setAttribute("data-position", position);
      this.sidebarElement.setAttribute("data-border", border);

      // Animation
      if (animated) {
        this.sidebarElement.style.transition = "transform 0.3s ease-in-out";
      }

      // Border
      switch (border) {
        case "none":
          this.sidebarElement.style.borderLeft = "none";
          this.sidebarElement.style.borderRight = "none";
          break;
        case "left":
          this.sidebarElement.style.borderLeft = "1px solid var(--zen-colors-border, #333)";
          this.sidebarElement.style.borderRight = "none";
          break;
        case "right":
          this.sidebarElement.style.borderRight = "1px solid var(--zen-colors-border, #333)";
          this.sidebarElement.style.borderLeft = "none";
          break;
        case "both":
          this.sidebarElement.style.borderLeft = "1px solid var(--zen-colors-border, #333)";
          this.sidebarElement.style.borderRight = "1px solid var(--zen-colors-border, #333)";
          break;
      }

      // Adjust main window
      const mainWindow = document.getElementById("main-window");
      if (mainWindow) {
        mainWindow.setAttribute("zen-second-sidebar-enabled", "true");
        mainWindow.setAttribute("zen-second-sidebar-position", position);
      }
    },

    setupEventListeners() {
      const urlBar = document.getElementById("zen-sidebar-urlbar");
      const iframe = document.getElementById("zen-sidebar-iframe");
      const backBtn = document.getElementById("zen-sidebar-back");
      const forwardBtn = document.getElementById("zen-sidebar-forward");
      const refreshBtn = document.getElementById("zen-sidebar-refresh");
      const newPanelBtn = document.getElementById("zen-sidebar-new-panel");

      if (!urlBar || !iframe) return;

      // URL bar navigation
      urlBar.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          let url = urlBar.value.trim();
          if (url) {
            // Add protocol if missing
            if (!url.includes("://")) {
              url = url.includes(".") ? `https://${url}` : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            }
            iframe.src = url;
            urlBar.value = url;
          }
        }
      });

      // Navigation buttons
      if (backBtn) {
        backBtn.addEventListener("click", () => {
          try {
            iframe.contentWindow.history.back();
          } catch (e) {
            debugLog("Cannot navigate back");
          }
        });
      }

      if (forwardBtn) {
        forwardBtn.addEventListener("click", () => {
          try {
            iframe.contentWindow.history.forward();
          } catch (e) {
            debugLog("Cannot navigate forward");
          }
        });
      }

      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
          iframe.contentWindow.location.reload();
        });
      }

      if (newPanelBtn) {
        newPanelBtn.addEventListener("click", () => {
          const url = prompt("Enter URL for new web panel:");
          if (url) {
            let formattedUrl = url.trim();
            if (!formattedUrl.includes("://")) {
              formattedUrl = formattedUrl.includes(".") ? `https://${formattedUrl}` : `https://www.google.com/search?q=${encodeURIComponent(formattedUrl)}`;
            }
            iframe.src = formattedUrl;
            urlBar.value = formattedUrl;
          }
        });
      }

      // Update URL bar when iframe navigates
      iframe.addEventListener("load", () => {
        try {
          if (iframe.contentWindow.location.href !== "about:blank") {
            urlBar.value = iframe.contentWindow.location.href;
          }
        } catch (e) {
          // Cross-origin frame, can't access location
        }
      });

      // Auto-hide functionality
      if (PREFS.getPref(PREFS.AUTO_HIDE_SIDEBAR)) {
        let hideTimeout;
        
        this.sidebarElement.addEventListener("mouseenter", () => {
          clearTimeout(hideTimeout);
          this.sidebarElement.style.transform = "";
        });

        this.sidebarElement.addEventListener("mouseleave", () => {
          const position = PREFS.getPref(PREFS.POSITION);
          hideTimeout = setTimeout(() => {
            if (position === "left") {
              this.sidebarElement.style.transform = "translateX(-290px)";
            } else {
              this.sidebarElement.style.transform = "translateX(290px)";
            }
          }, 500);
        });
      }

      debugLog("Event listeners set up");
    },

    destroy() {
      if (!this.initialized) return;
      
      debugLog("Destroying second sidebar...");
      
      if (this.sidebarElement && this.sidebarElement.parentNode) {
        this.sidebarElement.parentNode.removeChild(this.sidebarElement);
      }
      
      const mainWindow = document.getElementById("main-window");
      if (mainWindow) {
        mainWindow.removeAttribute("zen-second-sidebar-enabled");
        mainWindow.removeAttribute("zen-second-sidebar-position");
      }
      
      this.initialized = false;
    },

    updateSettings() {
      if (this.initialized) {
        this.applySettings();
      }
    }
  };

  // Preference change listener for Sine compatibility
  const prefObserver = {
    observe(subject, topic, data) {
      if (topic === "nsPref:changed") {
        debugLog("Preference changed:", data);
        
        if (data === PREFS.ENABLED) {
          const enabled = PREFS.getPref(PREFS.ENABLED);
          if (enabled && !ZenSecondSidebar.initialized) {
            ZenSecondSidebar.init();
          } else if (!enabled && ZenSecondSidebar.initialized) {
            ZenSecondSidebar.destroy();
          }
        } else if (data.startsWith("zen-extra-sidebar.settings.")) {
          // Settings changed, update sidebar
          ZenSecondSidebar.updateSettings();
        }
      }
    }
  };

  // Add preference observers
  Services.prefs.addObserver("zen-extra-sidebar.", prefObserver, false);

  // Cleanup on window unload
  window.addEventListener("unload", () => {
    Services.prefs.removeObserver("zen-extra-sidebar.", prefObserver);
    ZenSecondSidebar.destroy();
  });

  // Initialize the sidebar
  const runInit = () => {
    try {
      ZenSecondSidebar.init();
    } catch (error) {
      debugError("Error during initialization:", error);
    }
  };

  // Handle different initialization contexts
  if (typeof UC_API !== "undefined" && UC_API.Runtime) {
    UC_API.Runtime.startupFinished().then(runInit);
  } else if (typeof delayedStartupPromise !== "undefined") {
    delayedStartupPromise.then(runInit);
  } else {
    // Fallback for Sine or other contexts
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runInit);
    } else {
      setTimeout(runInit, 100);
    }
  }

  debugLog("Zen Second Sidebar script loaded");
}
