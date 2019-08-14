function firecheckoutWrapChangeShipOptions() {
    if (typeof changeShipOptions !== 'function') {
        return;
    }

    changeShipOptions = changeShipOptions.wrap(function(o, data, dateText) {
        o(data, dateText);

        // can't use shippingMethod.addObservers to prevent too much recursion error.
        $$('input[name="shipping_method"]').each(function(el) {
            el.stopObserving('click');
            el.observe('click', function() {
                var sections = FC.Ajax.getSectionsToUpdate('shipping-method');
                if (sections.length) {
                    checkout.update(
                        checkout.urls.shipping_method,
                        FC.Ajax.arrayToJson(sections)
                    );
                }
            });
        });

        var sections = FC.Ajax.getSectionsToUpdate('shipping-method');
        if (sections.length) {
            checkout.update(
                checkout.urls.shipping_method,
                FC.Ajax.arrayToJson(sections)
            );
        }
    });
}

document.observe('dom:loaded', function() { firecheckoutWrapChangeShipOptions(); });
document.observe('firecheckout:shippingMethod:addObserversAfter', function() { firecheckoutWrapChangeShipOptions(); });
