/* ==== Zen Sidepanels ==== */
/* https://github.com/leandromesq/zen-sidepanels */
/* ====== v0.1.0 ====== */

// Zen UserChrome Script - Proper initialization pattern
(function() {
  'use strict';

  // === POPUP/DIALOG DETECTION ===
  // Prevent running in popup windows or dialogs
  setTimeout(() => {
    // Method 1: Check for popup-specific chrome URI
    if (location.href.includes('chrome://browser/content/places/') ||
        location.href.includes('chrome://browser/content/preferences/') ||
        location.href.includes('chrome://global/content/')) {
      console.log('Zen Sidepanels: Skipping - detected chrome dialog');
      return;
    }
    
    // Method 2: Check document title for common popup indicators
    if (document.title.includes('Firefox') && (
        document.title.includes('Preferences') || 
        document.title.includes('Settings') ||
        document.title.includes('Bookmarks') ||
        document.title.includes('Library'))) {
      console.log('Zen Sidepanels: Skipping - detected settings/bookmarks window');
      return;
    }
    
    // Method 3: Check for required main browser elements
    const requiredElements = ['#navigator-toolbox', '#browser', '#main-window'];
    const missingElements = requiredElements.filter(selector => !document.querySelector(selector));
    
    if (missingElements.length > 0) {
      console.log('Zen Sidepanels: Skipping - missing main browser elements:', missingElements);
      return;
    }
    
    // Method 4: Check window size (popups are usually smaller)
    if (window.outerWidth < 400 || window.outerHeight < 300) {
      console.log('Zen Sidepanels: Skipping - window too small (likely popup)');
      return;
    }
    
    // Method 5: Check for dialog-specific attributes
    if (document.documentElement.hasAttribute('dlgtype')) {
      console.log('Zen Sidepanels: Skipping - dialog window detected');
      return;
    }
    
    // If all checks pass, continue with initialization
    console.log('Zen Sidepanels: All popup exclusion checks passed, proceeding with initialization');
    
    // === MAIN SCRIPT INITIALIZATION CONTINUES HERE ===
    initializeMainScript();
  }, 100); // Small delay to ensure DOM elements are loaded

  // === MAIN SCRIPT FUNCTIONS ===
  function initializeMainScript() {
    // Global state variables
    let initialized = false;
    let sidebarVisible = false;
    let currentUrl = "";
    let sidebarContainer = null;
    let webview = null;

    console.log("[ZenSidepanels] Initializing...");

    // Initialize the sidebar system
    function init() {
      if (initialized) return;
      initialized = true;
      
      initHandlers();
      createSidebar();
      setupPreferences();
      
      console.log("[ZenSidepanels] Initialization complete");
    }

    function initHandlers() {
      // Listen for browser ready events
      if (document.readyState === "complete") {
        onBrowserReady();
      } else {
        window.addEventListener("load", onBrowserReady, { once: true });
      }
    }

    function onBrowserReady() {
      console.log("[ZenSidepanels] Browser ready");
      // Additional setup can go here
    }

    function createSidebar() {
    console.log("[ZenSidepanels] Creating sidebar");

    // Find the main browser container
    const browserContainer = document.getElementById("browser");
    if (!browserContainer) {
      console.error("[ZenSidepanels] Could not find browser container");
      return;
    }

    // Create sidebar container
    sidebarContainer = document.createElement("vbox");
    sidebarContainer.id = "zen-sidepanels-container";
    sidebarContainer.style.cssText = `
      width: 300px;
      min-width: 200px;
      max-width: 600px;
      background: var(--zen-colors-secondary);
      border-left: 1px solid var(--zen-colors-border);
      display: none;
      flex-direction: column;
    `;

    // Create header
    const header = document.createElement("hbox");
    header.id = "zen-sidepanels-header";
    header.style.cssText = `
      height: 40px;
      min-height: 40px;
      align-items: center;
      padding: 0 10px;
      background: var(--zen-colors-tertiary);
      border-bottom: 1px solid var(--zen-colors-border);
    `;

    // Create URL input
    const urlInput = document.createElement("html:input");
    urlInput.id = "zen-sidepanels-url";
    urlInput.type = "url";
    urlInput.placeholder = "Enter URL...";
    urlInput.style.cssText = `
      flex: 1;
      margin-right: 10px;
      padding: 5px 10px;
      border: 1px solid var(--zen-colors-border);
      border-radius: 4px;
      background: var(--zen-colors-primary);
      color: var(--zen-colors-primary-text);
    `;

    // Create go button
    const goButton = document.createElement("button");
    goButton.textContent = "Go";
    goButton.style.cssText = `
      padding: 5px 15px;
      border: 1px solid var(--zen-colors-border);
      border-radius: 4px;
      background: var(--zen-colors-secondary);
      color: var(--zen-colors-secondary-text);
      cursor: pointer;
    `;

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.cssText = `
      margin-left: 5px;
      padding: 5px 10px;
      border: 1px solid var(--zen-colors-border);
      border-radius: 4px;
      background: var(--zen-colors-secondary);
      color: var(--zen-colors-secondary-text);
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
    `;

    header.appendChild(urlInput);
    header.appendChild(goButton);
    header.appendChild(closeButton);

    // Create webview container
    const webviewContainer = document.createElement("vbox");
    webviewContainer.style.cssText = `
      flex: 1;
      position: relative;
    `;

    // Create webview
    webview = document.createElement("browser");
    webview.setAttribute("type", "content");
    webview.setAttribute("remote", "true");
    webview.setAttribute("maychangeremoteness", "true");
    webview.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;

    webviewContainer.appendChild(webview);

    // Assemble sidebar
    sidebarContainer.appendChild(header);
    sidebarContainer.appendChild(webviewContainer);

    // Insert sidebar into DOM
    browserContainer.appendChild(sidebarContainer);

    // Add event listeners
    urlInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        loadUrl(urlInput.value);
      }
    });

    goButton.addEventListener("click", () => {
      loadUrl(urlInput.value);
    });

    closeButton.addEventListener("click", () => {
      hideSidebar();
    });

    console.log("[ZenSidepanels] Sidebar created successfully");
  }

  function loadUrl(url) {
    if (!url) return;

    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    currentUrl = url;
    console.log("[ZenSidepanels] Loading URL:", url);

    try {
      webview.loadURI(Services.io.newURI(url), {
        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
      });
    } catch (e) {
      console.error("[ZenSidepanels] Error loading URL:", e);
    }
  }

  function setupPreferences() {
    console.log("[ZenSidepanels] Setting up preferences");

    // Create context menu item for toggling sidebar
    if (!document.getElementById("zen-sidepanels-toggle")) {
      const contextMenuItems = window.MozXULElement.parseXULToFragment(`
        <menuitem id="zen-sidepanels-toggle" label="Toggle Sidepanels"/>
      `);
      
      const tabContextMenu = document.getElementById("tabContextMenu");
      if (tabContextMenu) {
        tabContextMenu.appendChild(contextMenuItems);
        document.getElementById("zen-sidepanels-toggle").addEventListener("command", () => {
          toggleSidebar();
        });
      }
    }

    // Add keyboard shortcut
    const keyset = document.getElementById("mainKeyset");
    if (keyset && !document.getElementById("zen-sidepanels-key")) {
      const keyFragment = window.MozXULElement.parseXULToFragment(`
        <key id="zen-sidepanels-key" key="E" modifiers="accel,shift" oncommand=""/>
      `);
      keyset.appendChild(keyFragment);
      document.getElementById("zen-sidepanels-key").addEventListener("command", () => {
        toggleSidebar();
      });
    }
  }

  function toggleSidebar() {
    if (sidebarVisible) {
      hideSidebar();
    } else {
      showSidebar();
    }
  }

  function showSidebar() {
    if (!sidebarContainer) return;

    sidebarContainer.style.display = "flex";
    sidebarVisible = true;
    console.log("[ZenSidepanels] Sidebar shown");

    // Load a default page if no URL is set
    if (!currentUrl) {
      loadUrl("https://www.google.com");
    }
  }

  function hideSidebar() {
    if (!sidebarContainer) return;

    sidebarContainer.style.display = "none";
    sidebarVisible = false;
    console.log("[ZenSidepanels] Sidebar hidden");
  }

  // Public API methods
  function loadUrlPublic(url) {
    loadUrl(url);
    if (!sidebarVisible) {
      showSidebar();
    }
  }

  function getCurrentUrl() {
    return currentUrl;
  }

  function isSidebarVisible() {
    return sidebarVisible;
  }

  // Expose public API globally
  window.zenSidepanels = {
    loadUrl: loadUrlPublic,
    getCurrentUrl: getCurrentUrl,
    isSidebarVisible: isSidebarVisible,
    toggleSidebar: toggleSidebar,
    showSidebar: showSidebar,
    hideSidebar: hideSidebar
  };

  // Initialize the sidebar system
  init();

} // End of initializeMainScript function

// Inject CSS for sidebar styling
(function addZenSidepanelsCSS() {
  if (!document.getElementById('zen-sidepanels-css')) {
    const style = document.createElement('style');
    style.id = 'zen-sidepanels-css';
    style.textContent = `
      #zen-sidepanels-container {
        z-index: 1000;
      }
      
      #zen-sidepanels-header {
        -moz-user-select: none;
      }
      
      #zen-sidepanels-url:focus {
        outline: 2px solid var(--zen-primary-color);
        outline-offset: -2px;
      }
      
      #zen-sidepanels-container button:hover {
        background: var(--zen-colors-tertiary) !important;
      }
      
      #zen-sidepanels-container button:active {
        background: var(--zen-colors-border) !important;
      }
    `;
    document.head.appendChild(style);
  }
})();

console.log("[ZenSidepanels] Script loaded");

})(); // End of main IIFE
