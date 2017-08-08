const supportedPaymentMethods = [
    {
        supportedMethods: ['basic-card'],
        data: {
            supportedNetworks: ['visa', 'mastercard', 'amex', 'debit']
        }
    },
    {
        supportedMethods: ['https://android.com/pay'],
        data: {
            merchantName: 'Android Pay Demo',
            merchantId: '00000000000000000000',
            environment: 'TEST',
            allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'],
            paymentMethodTokenizationParameters: {
                tokenizationType: 'GATEWAY_TOKEN',
                parameters: {
                    'gateway': 'stripe',
                    'stripe:publishableKey': 'xx_demo_xxxxxxxxxxxxxxxxxxxxxxxx',
                    'stripe:version': '2016-07-06',
                },
            },
        },
    }
];

function callPaymentRequest() {
    if (!window.PaymentRequest) {
        alert('Payments API not detected. fallback to traditional UI');
        return;
    }

    let displayItems = [
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
    ];

    let paymentDetails = {
        total: {
            label: 'Total',
            amount:{
                currency: 'USD',
                value: 667.79
            }
        },
        displayItems,
    };

    let options = {
        requestPayerName: true,
        requestPayerPhone: true,
        requestPayerEmail: true,
    };

    let request = new PaymentRequest(
        supportedPaymentMethods,
        paymentDetails,
        options
    );

    request
        .show()
        .then((response) => {
            console.log(JSON.stringify(response, null, 2));
            return response.complete()
                .then(() => {
                    console.log("processing payment on the server side");
                });
        })
        .catch((err) => {
            console.error(err);
        });
}
