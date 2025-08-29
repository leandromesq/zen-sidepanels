// ==UserScript==
// @name            Zen Second Sidebar
// @description     A second sidebar with web panels for Zen Browser, bringing web panels back with native feel and look. Supports customizable positioning, web panel management, and auto-hide features.
// @author          k00lagin
// @homepageURL     https://github.com/k00lagin/zen-second-sidebar
// @include         main
// @version         2.0.0
// ==/UserScript==

(function() {
  'use strict';

  // Check if already loaded to prevent multiple initializations
  if (window.zenSecondSidebarLoaded) {
    console.log("Zen Second Sidebar: Already loaded, skipping...");
    return;
  }
  window.zenSecondSidebarLoaded = true;

  // Preference helper - simple about:config access like Nebula uses
  const Prefs = {
    get(prefName, defaultValue = null) {
      try {
        const prefs = Components.classes["@mozilla.org/preferences-service;1"]
          .getService(Components.interfaces.nsIPrefService)
          .getBranch("");
        
        if (!prefs.prefHasUserValue(prefName)) return defaultValue;
        
        switch (prefs.getPrefType(prefName)) {
          case prefs.PREF_BOOL: return prefs.getBoolPref(prefName);
          case prefs.PREF_INT: return prefs.getIntPref(prefName);
          case prefs.PREF_STRING: return prefs.getStringPref(prefName);
          default: return defaultValue;
        }
      } catch (e) {
        return defaultValue;
      }
    },
    
    set(prefName, value) {
      try {
        const prefs = Components.classes["@mozilla.org/preferences-service;1"]
          .getService(Components.interfaces.nsIPrefService)
          .getBranch("");
          
        switch (typeof value) {
          case 'boolean': prefs.setBoolPref(prefName, value); break;
          case 'number': prefs.setIntPref(prefName, value); break;
          case 'string': prefs.setStringPref(prefName, value); break;
        }
      } catch (e) {
        console.error("Failed to set pref:", prefName, e);
      }
    }
  };

  // Configuration with about:config integration
  const CONFIG = {
    get enabled() { return Prefs.get("zen-second-sidebar.enabled", true); },
    set enabled(val) { Prefs.set("zen-second-sidebar.enabled", val); },
    
    get position() { return Prefs.get("zen-second-sidebar.position", "right"); },
    set position(val) { Prefs.set("zen-second-sidebar.position", val); },
    
    get autoHide() { return Prefs.get("zen-second-sidebar.autoHide", false); },
    set autoHide(val) { Prefs.set("zen-second-sidebar.autoHide", val); },
    
    get animated() { return Prefs.get("zen-second-sidebar.animated", true); },
    set animated(val) { Prefs.set("zen-second-sidebar.animated", val); },
    
    get containerBorder() { return Prefs.get("zen-second-sidebar.containerBorder", "left"); },
    set containerBorder(val) { Prefs.set("zen-second-sidebar.containerBorder", val); },
    
    get hideInPopupWindows() { return Prefs.get("zen-second-sidebar.hideInPopupWindows", false); },
    set hideInPopupWindows(val) { Prefs.set("zen-second-sidebar.hideInPopupWindows", val); },
    
    get width() { return Prefs.get("zen-second-sidebar.width", 300); },
    set width(val) { Prefs.set("zen-second-sidebar.width", val); }
  };

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

  // Main ZenSecondSidebar implementation following Nebula patterns
  const ZenSecondSidebar = {
    initialized: false,
    sidebarElement: null,
    sidebarContainer: null,
    webPanels: [],

    init() {
      if (this.initialized || !CONFIG.enabled) {
        return;
      }

      debugLog("Initializing second sidebar...");

      try {
        // Check if we're in the right window
        if (window !== window.top) return;

        // Check if we should hide in popup windows
        if (isPopupWindow() && CONFIG.hideInPopupWindows) {
          debugLog("Skipping initialization in popup window");
          return;
        }

        this.createSidebarStructure();
        this.injectCSS();
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
      
      // Find the zen-tabbox-wrapper (verified to exist in Zen browser)
      const zenTabboxWrapper = document.getElementById("zen-tabbox-wrapper");
      if (!zenTabboxWrapper) {
        debugError("zen-tabbox-wrapper not found - required for proper integration");
        return;
      }
      
      debugLog("Using zen-tabbox-wrapper container for integration");

      // Create the main sidebar container that integrates with Zen's layout
      this.sidebarContainer = createElement("div", {
        id: "zen-second-sidebar-container",
        class: "zen-second-sidebar-container",
        style: {
          display: "flex",
          flexDirection: CONFIG.position === "left" ? "row" : "row-reverse",
          width: "100%",
          height: "100%"
        }
      });

      // Create the main sidebar element
      this.sidebarElement = createElement("div", {
        id: "zen-second-sidebar",
        class: "zen-second-sidebar",
        style: {
          width: `${CONFIG.width}px`,
          height: "100%",
          backgroundColor: "var(--zen-colors-secondary, var(--toolbar-bgcolor, #2d2d2d))",
          borderRadius: "var(--zen-border-radius, 8px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: "10"
        }
      });

      // Create content wrapper for the rest of Zen's content
      const contentWrapper = createElement("div", {
        class: "zen-second-sidebar-content-wrapper",
        style: {
          flex: "1",
          minWidth: "0"
        }
      });

      // Move existing content into wrapper
      const existingContent = Array.from(zenTabboxWrapper.children);
      existingContent.forEach(child => {
        contentWrapper.appendChild(child);
      });

      // Add border styling
      this.updateBorderStyling();

      // Assemble the structure
      if (CONFIG.position === "left") {
        this.sidebarContainer.appendChild(this.sidebarElement);
        this.sidebarContainer.appendChild(contentWrapper);
      } else {
        this.sidebarContainer.appendChild(contentWrapper);
        this.sidebarContainer.appendChild(this.sidebarElement);
      }

      // Replace zen-tabbox-wrapper content
      zenTabboxWrapper.appendChild(this.sidebarContainer);

      // Create sidebar content
      this.createSidebarContent();

      debugLog("Sidebar structure created and integrated");
    },

    createSidebarContent() {

    createSidebarContent() {
      // Create toolbar
      const toolbar = createElement("div", {
        class: "zen-second-sidebar-toolbar",
        style: {
          display: "flex",
          alignItems: "center",
          padding: "8px",
          backgroundColor: "var(--zen-colors-primary, var(--toolbar-bgcolor, #2d2d2d))",
          borderBottom: "1px solid var(--zen-colors-border, var(--chrome-content-separator-color, #333))",
          minHeight: "40px"
        }
      });

      // Create navigation buttons using Zen's styling patterns
      const backBtn = createElement("button", {
        id: "zen-sidebar-back",
        class: "zen-nav-button toolbarbutton-1",
        title: "Back",
        style: {
          background: "transparent",
          border: "none",
          color: "var(--zen-colors-text, var(--toolbar-color, white))",
          padding: "6px",
          margin: "2px",
          borderRadius: "var(--zen-border-radius, 4px)",
          cursor: "pointer",
          minWidth: "32px",
          height: "32px"
        }
      }, ["←"]);

      const forwardBtn = createElement("button", {
        id: "zen-sidebar-forward", 
        class: "zen-nav-button toolbarbutton-1",
        title: "Forward",
        style: {
          background: "transparent",
          border: "none", 
          color: "var(--zen-colors-text, var(--toolbar-color, white))",
          padding: "6px",
          margin: "2px",
          borderRadius: "var(--zen-border-radius, 4px)",
          cursor: "pointer",
          minWidth: "32px",
          height: "32px"
        }
      }, ["→"]);

      const refreshBtn = createElement("button", {
        id: "zen-sidebar-refresh",
        class: "zen-nav-button toolbarbutton-1",
        title: "Refresh",
        style: {
          background: "transparent",
          border: "none",
          color: "var(--zen-colors-text, var(--toolbar-color, white))",
          padding: "6px",
          margin: "2px", 
          borderRadius: "var(--zen-border-radius, 4px)",
          cursor: "pointer",
          minWidth: "32px",
          height: "32px"
        }
      }, ["↻"]);

      // Create URL bar with Zen styling
      const urlBar = createElement("input", {
        id: "zen-sidebar-urlbar",
        type: "text",
        placeholder: "Enter URL...",
        class: "zen-panel-urlbar",
        style: {
          flex: "1",
          background: "var(--zen-colors-input, var(--toolbar-field-background-color, #333))",
          border: "1px solid var(--zen-colors-border, var(--toolbar-field-border-color, #555))",
          borderRadius: "var(--zen-border-radius, 4px)",
          padding: "6px 8px",
          color: "var(--zen-colors-text, var(--toolbar-field-color, white))",
          fontSize: "12px",
          margin: "0 4px"
        }
      });

      // Create new panel button
      const newPanelBtn = createElement("button", {
        id: "zen-sidebar-new-panel",
        class: "zen-nav-button toolbarbutton-1",
        title: "New Web Panel",
        style: {
          background: "transparent",
          border: "none",
          color: "var(--zen-colors-text, var(--toolbar-color, white))", 
          padding: "6px",
          margin: "2px",
          borderRadius: "var(--zen-border-radius, 4px)",
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
          position: "relative",
          backgroundColor: "var(--zen-main-browser-background, white)"
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
          background: "var(--zen-main-browser-background, white)"
        }
      });

      // Assemble the toolbar
      toolbar.appendChild(backBtn);
      toolbar.appendChild(forwardBtn);
      toolbar.appendChild(refreshBtn);
      toolbar.appendChild(urlBar);
      toolbar.appendChild(newPanelBtn);
      
      // Assemble the content
      contentArea.appendChild(iframe);
      
      // Add to sidebar
      this.sidebarElement.appendChild(toolbar);
      this.sidebarElement.appendChild(contentArea);

      debugLog("Sidebar content created");
    },

    injectCSS() {
      // Inject CSS for better integration with Zen's theme system
      const css = `
        .zen-second-sidebar-container {
          position: relative;
          z-index: 1;
        }

        .zen-second-sidebar {
          box-shadow: var(--zen-big-shadow, 0 2px 8px rgba(0,0,0,0.2));
          border: 1px solid var(--zen-colors-border, var(--chrome-content-separator-color, #555));
        }

        .zen-second-sidebar .toolbarbutton-1:hover {
          background-color: var(--toolbarbutton-hover-background, rgba(255,255,255,0.1));
        }

        .zen-second-sidebar .toolbarbutton-1:active {
          background-color: var(--toolbarbutton-active-background, rgba(255,255,255,0.2));
        }

        .zen-second-sidebar-content-wrapper {
          display: flex;
          flex-direction: column;
        }

        /* Auto-hide animation styles */
        .zen-second-sidebar[data-auto-hide="true"] {
          transition: transform 0.3s ease-in-out;
        }

        .zen-second-sidebar[data-auto-hide="true"][data-position="left"].hidden {
          transform: translateX(-290px);
        }

        .zen-second-sidebar[data-auto-hide="true"][data-position="right"].hidden {
          transform: translateX(290px);
        }

        /* Border styling */
        .zen-second-sidebar[data-border="left"] {
          border-left: 2px solid var(--zen-primary-color, #0060df);
          border-right: none;
        }

        .zen-second-sidebar[data-border="right"] {
          border-right: 2px solid var(--zen-primary-color, #0060df);
          border-left: none;
        }

        .zen-second-sidebar[data-border="both"] {
          border-left: 2px solid var(--zen-primary-color, #0060df);
          border-right: 2px solid var(--zen-primary-color, #0060df);
        }

        .zen-second-sidebar[data-border="none"] {
          border: 1px solid var(--zen-colors-border, var(--chrome-content-separator-color, #555));
        }
      `;

      const styleElement = document.createElement("style");
      styleElement.textContent = css;
      document.head.appendChild(styleElement);
    },

    updateBorderStyling() {
      if (!this.sidebarElement) return;

      const border = CONFIG.containerBorder;
      this.sidebarElement.setAttribute("data-border", border);

      // Update border styling based on position and border preference
      const borderColor = "var(--zen-primary-color, #0060df)";
      const defaultBorder = "1px solid var(--zen-colors-border, var(--chrome-content-separator-color, #555))";

      switch (border) {
        case "none":
          this.sidebarElement.style.border = defaultBorder;
          break;
        case "left":
          this.sidebarElement.style.borderLeft = `2px solid ${borderColor}`;
          this.sidebarElement.style.borderRight = "none";
          this.sidebarElement.style.borderTop = defaultBorder;
          this.sidebarElement.style.borderBottom = defaultBorder;
          break;
        case "right":
          this.sidebarElement.style.borderRight = `2px solid ${borderColor}`;
          this.sidebarElement.style.borderLeft = "none";
          this.sidebarElement.style.borderTop = defaultBorder;
          this.sidebarElement.style.borderBottom = defaultBorder;
          break;
        case "both":
          this.sidebarElement.style.borderLeft = `2px solid ${borderColor}`;
          this.sidebarElement.style.borderRight = `2px solid ${borderColor}`;
          this.sidebarElement.style.borderTop = defaultBorder;
          this.sidebarElement.style.borderBottom = defaultBorder;
          break;
      }
    },
    },

    applySettings() {
      if (!this.sidebarElement) return;

      const position = CONFIG.position;
      const autoHide = CONFIG.autoHide;
      const animated = CONFIG.animated;

      debugLog(`Applying settings: position=${position}, autoHide=${autoHide}, animated=${animated}`);

      // Update width
      this.sidebarElement.style.width = `${CONFIG.width}px`;

      // Auto-hide
      this.sidebarElement.setAttribute("data-auto-hide", autoHide);
      this.sidebarElement.setAttribute("data-position", position);

      // Animation
      if (animated) {
        this.sidebarElement.style.transition = "transform 0.3s ease-in-out";
      }

      // Update border styling
      this.updateBorderStyling();

      // Update container layout for position changes
      if (this.sidebarContainer) {
        this.sidebarContainer.style.flexDirection = position === "left" ? "row" : "row-reverse";
      }

      // Mark main window for CSS targeting
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
      if (CONFIG.autoHide) {
        let hideTimeout;
        
        this.sidebarElement.addEventListener("mouseenter", () => {
          clearTimeout(hideTimeout);
          this.sidebarElement.classList.remove("hidden");
        });

        this.sidebarElement.addEventListener("mouseleave", () => {
          hideTimeout = setTimeout(() => {
            this.sidebarElement.classList.add("hidden");
          }, 500);
        });
      }

      debugLog("Event listeners set up");
    },

    destroy() {
      if (!this.initialized) return;
      
      debugLog("Destroying second sidebar...");
      
      if (this.sidebarContainer && this.sidebarContainer.parentNode) {
        // Restore original zen-tabbox-wrapper content
        const zenTabboxWrapper = document.getElementById("zen-tabbox-wrapper");
        const contentWrapper = this.sidebarContainer.querySelector(".zen-second-sidebar-content-wrapper");
        
        if (zenTabboxWrapper && contentWrapper) {
          // Move content back
          Array.from(contentWrapper.children).forEach(child => {
            zenTabboxWrapper.appendChild(child);
          });
          
          // Remove our container
          this.sidebarContainer.remove();
        }
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

  // Initialize like Nebula does - simple and direct
  const runInit = () => {
    try {
      ZenSecondSidebar.init();
    } catch (error) {
      debugError("Error during initialization:", error);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runInit);
  } else {
    // Small delay to ensure Zen is fully loaded
    setTimeout(runInit, 100);
  }

  debugLog("Zen Second Sidebar script loaded with preferences support");

})();
