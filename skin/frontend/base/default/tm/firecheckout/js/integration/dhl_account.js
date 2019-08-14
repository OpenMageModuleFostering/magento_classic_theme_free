document.observe('dom:loaded', function() {
    setPackstationdata = setPackstationdata.wrap(function(o, packstation) {
        o(packstation);
        checkout.update(checkout.urls.shipping_address);
    });
});
