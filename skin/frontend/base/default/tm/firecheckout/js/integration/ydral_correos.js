document.observe('firecheckout:setResponseAfter', function(e) {
    var response = e.memo.response;
    if (response.update_section && response.update_section['shipping-method']) {
        $$('input[name="shipping_method"]').each(function(el) {
            el.checked = '';
        });
    }
});
