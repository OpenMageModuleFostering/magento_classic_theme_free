document.observe('firecheckout:setResponseAfter', function(e) {
    var response = e.memo.response;
    if (response.method && response.method === 'molpayseamless') {
        jQuery('#seamless-form').submit();
    }
});
