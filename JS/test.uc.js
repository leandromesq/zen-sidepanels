// ==UserScript==
// @name            Test Script
// @description     Simple test to verify JS loading
// @author          test
// @include         main
// @version         1.0.0
// ==/UserScript==

(function() {
  'use strict';
  
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
