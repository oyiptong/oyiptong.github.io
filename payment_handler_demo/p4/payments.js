"use strict";

function showModal(text, options = {}) {
  let modal = new tingle.modal(options);
  modal.setContent(`<h1>Demo Fairy 🧚</h1><p>${text}</p>`)
  return modal.open();
}

async function buildPaymentRequest(options = {}) {
  const supportedInstruments = [{
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

  let details = {
      total: {
        label: 'Total',
        amount:{
          currency: 'USD',
          value: 667.79
        }
      },
      displayItems: [
        {
          label: "$113.50 x 4 nights",
          amount: {
            currency: "USD",
            value: 454.0
          }
        },
        {
          label: "Cleaning fee",
          amount: {
            currency: "USD",
            value: 99.0
          }
        },
        {
          label: "Service fee",
          amount: {
            currency: "USD",
            value: 69.02
          }
        },
        {
          label: "Occupancy Taxes",
          amount: {
            currency: "USD",
            value: 55.77
          }
        },
      ]
  };

  let request = null;

  try {
    request = new PaymentRequest(supportedInstruments, details, options);
    if (request.canMakePayment) {
      let result = await request.canMakePayment();
      console.log(result ? "Can make payment" : "Cannot make payment");
    }
  } catch (e) {
    showModal(e);
  }

  return request;
};

async function callPaymentRequest() {
  if (!window.PaymentRequest) {
    return showModal("Payments API not detected. demo won't work");
  }


  let options = {
    requestPayerName: true,
    requestPayerPhone: true,
    requestPayerEmail: true,
  };
  let request = await buildPaymentRequest(options);

  try {
    let response = await request.show();
    await response.complete('success');
    showModal(`<pre>${JSON.stringify(response, null, 2)}</pre>`);
  } catch (e) {
    showModal(e);
  }
}
