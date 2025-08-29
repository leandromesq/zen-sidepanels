// Simple test script for Sine JS loading
// Using dump() for Firefox chrome context debugging
dump("=== SINE TEST SCRIPT LOADED ===\n");
dump("Date: " + new Date().toISOString() + "\n");
dump("Location: " + window.location.href + "\n");

// Also try Services.console for Firefox
try {
  const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
  Services.console.logStringMessage("SINE TEST: Script executed successfully!");
} catch (e) {
  dump("Error accessing Services: " + e + "\n");
}

// Try to create a visible element
try {
  const testBox = document.createElement("div");
  testBox.id = "sine-test-box";
  testBox.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background: red !important;
    color: white !important;
    padding: 10px !important;
    z-index: 999999 !important;
    border: 2px solid yellow !important;
  `;
  testBox.textContent = "SINE JS WORKING!";
  
  if (document.body) {
    document.body.appendChild(testBox);
    dump("Test box added to body\n");
  } else {
    dump("Document body not available\n");
  }
} catch (e) {
  dump("Error creating test box: " + e + "\n");
}

(function() {
  console.log("TEST SCRIPT LOADED SUCCESSFULLY!");
  
  // Add a visible element to the page to confirm loading
  const testElement = document.createElement('div');
  testElement.id = 'sine-js-test';
  testElement.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: red;
    color: white;
    padding: 10px;
    z-index: 99999;
    font-family: monospace;
    border-radius: 5px;
  `;
  testElement.textContent = 'JS LOADED!';
  
  // Add when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(testElement);
    });
  } else {
    document.body.appendChild(testElement);
  }
})();
