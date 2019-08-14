document.observe('dom:loaded', function() {
    if (typeof OnecolumnCheckout !== 'undefined' && typeof createStripeToken !== 'undefined') {
        OnecolumnCheckout.saveStep = OnecolumnCheckout.saveStep.wrap(function(o, url, button, callback, params) {
            if (url !== checkout.urls.payment_method || payment.currentMethod != 'cryozonic_stripe') {
                return o(url, button, callback, params);
            }

            createStripeToken(function(err) {
                if (err) {
                    alert(err);
                } else {
                    return o(url, button, callback, params);
                }
            });
        });
    }
});