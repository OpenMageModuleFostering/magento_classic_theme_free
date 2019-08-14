document.observe('firecheckout:setResponseBefore', function(e) {
    var response = e.memo.response;
    if (response.update_section && response.update_section.review) {
        // restore original onclick handler because module does not do it
        var buttonCheckout = $$('#checkout-review-submit .btn-checkout');
        if (buttonCheckout.length) {
            buttonCheckout.each(function(button) {
                button.writeAttribute('onclick', button.readAttribute('data-clickevent'));
            });
        }
    }
});
