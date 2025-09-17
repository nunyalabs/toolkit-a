// pwa.js - service worker registration and install prompt
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW registered', reg))
        .catch(err => console.log('SW registration failed', err));
    });
  }
}

export function setupInstallPrompt() {
  let deferredPrompt;
  const installButton = document.createElement('button');
  installButton.textContent = 'Install App';
  installButton.className = 'btn btn-gradient btn-primary position-fixed bottom-0 end-0 m-3';
  installButton.style.display = 'none';
  document.body.appendChild(installButton);
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'block';
    installButton.addEventListener('click', () => {
      installButton.style.display = 'none';
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => { deferredPrompt = null; });
    }, { once: true });
  });
}
