FC.AutoShip = {
    isTokenized: function() {
        return $('subscribe_pro_payment_token').getValue().length > 0 &&
            $('subscribe_pro_cc_number').getValue().indexOf('XXXXXX') >= 0;
    },
    waitForToken: function(callback) {
        if (!this.isTokenized()) {
            return setTimeout(function() {
                FC.AutoShip.waitForToken(callback);
            }, 500);
        } else {
            callback();
        }
    }
};

document.observe('dom:loaded', function() {
    paymentSaveAjaxCall = function(){}; // prevent automatic checkout.save call

    if (typeof OnecolumnCheckout !== 'undefined') {
        OnecolumnCheckout.validateStep = OnecolumnCheckout.validateStep.wrap(function(o, step) {
            if (payment.currentMethod === 'subscribe_pro' &&
                step.className.indexOf('payment-method')) {

                return true;
            }
            return o(step);
        });
    }

    checkout.validator.validate = checkout.validator.validate.wrap(function(o) {
        if (payment.currentMethod === 'subscribe_pro') {
            return true; // disable validation, because module replaces form values with XXXXXX
        }
        return o();
    });
    checkout.update = checkout.update.wrap(function(o, url, params, callback) {
        if (payment.currentMethod !== 'subscribe_pro' || url !== checkout.urls.payment_method) {
            return o(url, params, callback);
        }
        checkout.setLoadWaiting(false);
        payment.save();
        FC.AutoShip.waitForToken(o.bind(this, url, params, callback));
    });
    checkout.save = checkout.save.wrap(function(o, urlSuffix, forceSave) {
        if (payment.currentMethod && payment.currentMethod === 'subscribe_pro') {
            checkout.setLoadWaiting(false);
            payment.save();
            checkout.setLoadWaiting(false);
            FC.AutoShip.waitForToken(o.bind(this, urlSuffix, forceSave));
        } else {
            o(urlSuffix, forceSave);
        }
    });
});
