self.importScripts('base64js.min.js');
self.addEventListener('paymentrequest', (evt) => {
  return evt.respondWith(asyncGenerateResponse(evt.methodData));
});

async function asyncGenerateResponse(methodData) {
  let keyImportData = methodData[0].data.publicKey;
  let creditCardData = {
    cardNumber: '4111111111111111',
    cardholderName: 'Kaiser Soze',
    cardSecurityCode: '123',
    expiryMonth: '01',
    expiryYear: '2020',
    billingAddress: {
      addressLine: [
        '999 Brannan St',
      ],
      city: 'San Francisco',
      country: 'US',
      dependentLocality: '',
      languageCode: 'en-US',
      organization: 'Airbnb',
      phone: '+15555555555',
      postalCode: '94103',
      recipient: 'Kaiser Soze',
      region: 'CA',
      sortingCode: ''
    }
  };

  let publicKey = await crypto.subtle.importKey(
    keyImportData.format,
    keyImportData.keyData,
    keyImportData.algo,
    false,
    ['encrypt']
  );

  let encryptedBytes = await crypto.subtle.encrypt(
    {
      name: keyImportData.algo.name,
      iv: crypto.getRandomValues(new Uint8Array(16))
    },
    publicKey,
    new TextEncoder('utf-8').encode(JSON.stringify(creditCardData))
  );

  let encryptedCardData = base64js.fromByteArray(new Uint8Array(encryptedBytes));

  return {
    methodName: 'https://oyiptong.github.io/payment_handler_demo/handler/',
    details: {
      cardholderName: 'Kaiser Soze',
      suffix: '1111',
      encryptedCardData
    }
  };
};
