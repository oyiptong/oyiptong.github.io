function showMessage(message) {
    const messageElement = document.getElementById('msg');
    messageElement.innerHTML = message + '\n' + messageElement.innerHTML;
}

function clearMessages() {
    document.getElementById('msg').innerHTML = '';
}

function showElement(id) {
    document.getElementById(id).style.display = 'block';
}

function hideElement(id) {
    document.getElementById(id).style.display = 'none';
}

function hideElements() {
    const elements = ['checking', 'installed', 'installing', 'uninstalling', 'not-installed'];
    for (const id of elements) {
        hideElement(id);
    }
}

async function check() {
  clearMessages();
  hideElements();
  showElement('checking');

  if (!navigator.serviceWorker) {
    hideElement('checking');
    showMessage('No service worker capability in this browser.');
    return;
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration('app.js');
    if (!registration) {
      hideElement('checking');
      showElement('not-installed');
      return;
    }

    showElement('installed');
    document.getElementById('scope').innerHTML = registration.scope;
    if (!registration.paymentManager) {
      hideElement('checking');
      showMessage('No payment handler capability in this browser. Is chrome://flags/#service-worker-payment-apps enabled?');
      return;
    }

    if (!registration.paymentManager.instruments) {
      hideElement('checking');
      showMessage('Payment handler is not fully implemented. Cannot set the instruments.');
      return;
    }

    if (!registration.paymentManager.instruments.has('instrument-key')) {
      hideElement('checking');
      showMessage('No instruments found. Did installation fail?');
      return;
    }

    let instrument = await registration.paymentManager.instruments.get('instrument-key');
    document.getElementById('method').innerHTML = instrument.enabledMethods;
    document.getElementById('network').innerHTML = instrument.capabilities.supportedNetworks;
    document.getElementById('type').innerHTML = instrument.capabilities.supportedTypes;
    hideElement('checking');

  } catch(error) {
    hideElement('checking');
    showMessage(error);
  }
}

async function install() {
  hideElements();
  showElement('installing');

  try {
  let registration = await navigator.serviceWorker.register('app.js')
      .then(() => { return navigator.serviceWorker.ready; });

  await registration.paymentManager.instruments
    .set('instrument-key', {
      name: 'Chrome uses name and icon from the web app manifest',
      enabledMethods: ['https://oyiptong.github.io/payment_handler_demo/handler/'],
      capabilities: {
        supportedNetworks: ['visa'],
        supportedTypes: ['credit'],
      }
    });
  let instrument = await registration.paymentManager.instruments.get('instrument-key');
  document.getElementById('scope').innerHTML = registration.scope;
  document.getElementById('method').innerHTML = instrument.enabledMethods;
  document.getElementById('network').innerHTML = instrument.capabilities.supportedNetworks;
  document.getElementById('type').innerHTML = instrument.capabilities.supportedTypes;
  hideElement('installing');
  showElement('installed');
  } catch(error) {
    hideElement('installing');
    showMessage(error);
  }
}

async function uninstall() {
  hideElements();
  showElement('uninstalling');

  try {
    let registration = await navigator.serviceWorker.getRegistration('app.js');
    let result = await registration.unregister();
    if(result) {
      hideElement('uninstalling');
      showElement('not-installed');
    } else {
      hideElement('uninstalling');
      showElement('installed');
      showMessage('Service worker unregistration returned "false", which indicates that it failed.');
    }
  } catch(error) {
    hideElement('uninstalling');
    showMessage(error);
  }
}

check();
