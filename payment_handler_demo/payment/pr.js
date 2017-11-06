/* global done:false */
/* global error:false */
/* global PaymentRequest:false */

/**
 * Initializes the payment request object.
 */
function buildPaymentRequest() {
  if (!window.PaymentRequest) {
    return null;
  }

  var supportedInstruments = [{
    supportedMethods: 'https://localhost.airbnb.com/payment_handler_demo/handler/',
    data: {
      publicKey: {
        format: 'jwk',
        keyData: {
          alg: 'RSA-OAEP-256',
          e: 'AQAB',
          ext: true,
          key_ops: ['encrypt'],
          kty: 'RSA',
          n: 'vVf4OM-GXBF_r-mtGfNVuMiF99x55p-q2ZYYhNKMoDo3PgVWwdq3lYRyWLro0mRomYWcETlitE_L69P-bnOe65_DJs1y6_kp7m1jU2hNreZ7fmxv4osFNBOC7VOL0UK8LTTt4la0OBDx2omGwtt-UHBvYOkO_RhZI_JpGQfcHZbCYXA4qdk6URbLtJ-DMfm4RRk7OTpTgBkbtX7kC-r_L-5uMPndCzXkp7roEjVVt6CDo0hp_OeRWIverrNub5f6vxFM0WlR309ulWaq9shDKioAvB6aSwLhCBPNaRM40PHkzY9WLw2QF7tfzX3XpREnmufOLyq3KHyyIQ6N8xEOIIXdekAP4lJFUIZ4YfwtgK71N-aPukMlIRn0FDMq8RX8rmDFqxuxaty1rmP-uKe282Cna4M4cTJdprcjnurYaRig2BbCIlTBDBx0onLbIr0TQGtqSNQzxttHADqIcSMuOKTnmWI3dUvj8YJ-eaNw6Ge_Z7Z1x0tIwM424-6cYKwz4UROXL0ifzgzaeezaFd_t4p1oV9hQRbqVdilLOXuZ25rIBmWUzEzWm8XHo4sDPdyv8YulziBNvOhipObOBe9LWMVpDzulk2gotm7L7_uFxBf4kKA3oEFVxR3r9n0Eljrxr8os19db3z59dsfEDMwSLAkARyfll0KECVZAsZ8HFE'
        },
        algo: {name: 'RSA-OAEP', hash: {name: 'SHA-256'}}
      }
    }
  }];

  var details = {
    total: {
      label: 'Donation',
      amount: {
        currency: 'USD',
        value: '55.00'
      }
    },
    displayItems: [{
      label: 'Original donation amount',
      amount: {
        currency: 'USD',
        value: '65.00'
      }
    }, {
      label: 'Friends and family discount',
      amount: {
        currency: 'USD',
        value: '-10.00'
      }
    }],
    modifiers: [{
      supportedMethods: ['basic-card'],
      total: {
        label: 'Discounted donation',
        amount: {
          currency: 'USD',
          value: '45.00'
        }
      },
      additionalDisplayItems: [{
        label: 'VISA discount',
        amount: {
          currency: 'USD',
          value: '-10.00'
        }
      }],
      data: {
        discountProgramParticipantId: '86328764873265',
        supportedNetworks: ['visa'],
      }
    }]
  };

  var request = null;

  try {
    request = new PaymentRequest(supportedInstruments, details);
    if (request.canMakePayment) {
      request.canMakePayment().then(function(result) {
        info(result ? "Can make payment" : "Cannot make payment");
      }).catch(function(err) {
        error(err);
      });
    }
  } catch (e) {
    error('Developer mistake: \'' + e + '\'');
  }

  return request;
}

var request = buildPaymentRequest();

/**
 * Launches payment request for credit cards.
 */
function onBuyClicked() { // eslint-disable-line no-unused-vars
  if (!window.PaymentRequest || !request) {
    error('PaymentRequest API is not supported.');
    return;
  }

  try {
    request.show()
      .then(function(instrumentResponse) {
        window.setTimeout(function() {
          instrumentResponse.complete('success')
            .then(function() {
              done('This is a demo website. No payment will be processed.', instrumentResponse);
            })
            .catch(function(err) {
              error(err);
              request = buildPaymentRequest();
            });
        }, 2000);
      })
      .catch(function(err) {
        error(err);
        request = buildPaymentRequest();
      });
  } catch (e) {
    error('Developer mistake: \'' + e + '\'');
    request = buildPaymentRequest();
  }
}
