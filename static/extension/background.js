// background.js — Service Worker (MV3)
// Minimal service worker for Chrome Extension Manifest V3 compliance.
chrome.runtime.onInstalled.addListener(() => {
  console.log('[FintechShield] Extension installed.');
});
