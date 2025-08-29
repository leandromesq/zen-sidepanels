/* ==== Zen Sidepanels ==== */
/* https://github.com/leandromesq/zen-sidepanels */
/* ====== v0.1.0 ====== */

class ZenSidepanels {
  #initialized = false;
  #sidebarVisible = false;
  #currentUrl = "";
  #sidebarContainer = null;
  #webview = null;

  constructor() {
    console.log("[ZenSidepanels] Constructor called");
  }

  init() {
    if (this.#initialized) return;
    this.#initialized = true;
    console.log("[ZenSidepanels] Initializing...");

    this.#initHandlers();
    this.#createSidebar();
    this.#setupPreferences();
    
    console.log("[ZenSidepanels] Initialization complete");
  }

  #initHandlers() {
    // Listen for browser ready events
    if (document.readyState === "complete") {
      this.#onBrowserReady();
    } else {
      window.addEventListener("load", this.#onBrowserReady.bind(this), { once: true });
    }
  }

  #onBrowserReady() {
    console.log("[ZenSidepanels] Browser ready");
    // Additional setup can go here
  }

  #createSidebar() {
    console.log("[ZenSidepanels] Creating sidebar");

    // Find the main browser container
    const browserContainer = document.getElementById("browser");
    if (!browserContainer) {
      console.error("[ZenSidepanels] Could not find browser container");
      return;
    }

    // Create sidebar container
    this.#sidebarContainer = document.createElement("vbox");
    this.#sidebarContainer.id = "zen-sidepanels-container";
    this.#sidebarContainer.style.cssText = `
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
    this.#webview = document.createElement("browser");
    this.#webview.setAttribute("type", "content");
    this.#webview.setAttribute("remote", "true");
    this.#webview.setAttribute("maychangeremoteness", "true");
    this.#webview.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;

    webviewContainer.appendChild(this.#webview);

    // Assemble sidebar
    this.#sidebarContainer.appendChild(header);
    this.#sidebarContainer.appendChild(webviewContainer);

    // Insert sidebar into DOM
    browserContainer.appendChild(this.#sidebarContainer);

    // Add event listeners
    urlInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.#loadUrl(urlInput.value);
      }
    });

    goButton.addEventListener("click", () => {
      this.#loadUrl(urlInput.value);
    });

    closeButton.addEventListener("click", () => {
      this.hideSidebar();
    });

    console.log("[ZenSidepanels] Sidebar created successfully");
  }

  #loadUrl(url) {
    if (!url) return;

    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    this.#currentUrl = url;
    console.log("[ZenSidepanels] Loading URL:", url);

    try {
      this.#webview.loadURI(Services.io.newURI(url), {
        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
      });
    } catch (e) {
      console.error("[ZenSidepanels] Error loading URL:", e);
    }
  }

  #setupPreferences() {
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
          this.toggleSidebar();
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
        this.toggleSidebar();
      });
    }
  }

  toggleSidebar() {
    if (this.#sidebarVisible) {
      this.hideSidebar();
    } else {
      this.showSidebar();
    }
  }

  showSidebar() {
    if (!this.#sidebarContainer) return;

    this.#sidebarContainer.style.display = "flex";
    this.#sidebarVisible = true;
    console.log("[ZenSidepanels] Sidebar shown");

    // Load a default page if no URL is set
    if (!this.#currentUrl) {
      this.#loadUrl("https://www.google.com");
    }
  }

  hideSidebar() {
    if (!this.#sidebarContainer) return;

    this.#sidebarContainer.style.display = "none";
    this.#sidebarVisible = false;
    console.log("[ZenSidepanels] Sidebar hidden");
  }

  // Public API methods
  loadUrl(url) {
    this.#loadUrl(url);
    if (!this.#sidebarVisible) {
      this.showSidebar();
    }
  }

  getCurrentUrl() {
    return this.#currentUrl;
  }

  isSidebarVisible() {
    return this.#sidebarVisible;
  }
}

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

// Global instance initialization
(function () {
  if (!globalThis.zenSidepanelsInstance) {
    window.addEventListener(
      "load",
      () => {
        globalThis.zenSidepanelsInstance = new ZenSidepanels();
        globalThis.zenSidepanelsInstance.init();
      },
      { once: true }
    );
  }
})();

console.log("[ZenSidepanels] Script loaded");
