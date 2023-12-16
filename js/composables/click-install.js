import { alreadyInstalled } from "../utils.js";

/**
 * @param {HTMLElement} element 
 */
export function useClickInstall(element) {
  let deferredPrompt = null

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
  })

  element.addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    }
  })

  return {
    deferredPrompt,
    element
  }
}