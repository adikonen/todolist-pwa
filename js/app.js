async function registerServiceWorker() {
  if (! 'serviceWorker' in navigator) {
    return null
  }
  const sw = await navigator.serviceWorker.register('../sw.js')
  if (sw.active) {
    console.log('active')
  }
  if (sw.installing) {
    console.log('sedang install')
  }
  if (sw.waiting) {
    console.log('menunggu perubahan')
  }
}

function main() {
  registerServiceWorker()
}

main()