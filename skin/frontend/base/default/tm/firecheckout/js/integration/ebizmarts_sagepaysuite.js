document.observe('firecheckout:setResponseAfter', function(e) {
    // save payment response
    var url = e.memo.url;
    if (url === checkout.urls.payment_method) {
        $('checkout-review-submit').show();
        if ($('sagepaysuite-server-incheckout-iframe')) {
            $('sagepaysuite-server-incheckout-iframe').remove();
        }
        return;
    }

    // update review reponse
    var response = e.memo.response;
    if (response.update_section && response.update_section.review) {
        $('checkout-review-submit').show();
        if ($('sagepaysuite-server-incheckout-iframe')) {
            $('sagepaysuite-server-incheckout-iframe').remove();
        }
    }

    // saveOrder response
    if (!response.method) {
        return;
    }

    var methods = [
        'sagepayserver',
        'sagepayform',
        'sagepaydirectpro',
        'sagepaypaypal'
    ];
    if (methods.indexOf(response.method) >= 0) {
        window._sagepayonepageTriggerId = $('.button.btn-checkout');
        window._sagepayonepageFormId = 'firecheckout-form';

        var SageServer = new EbizmartsSagePaySuite.Checkout({});
        SageServer.code = response.method;
        SageServer.setPaymentMethod();
        SageServer.reviewSave();
    }
});

setOscLoad = function() {
    checkout.setLoadWaiting(true);
    $('review-please-wait').show();
};

restoreOscLoad = function () {
    window._sagepayprocessingorder = false;
    checkout.setLoadWaiting(false);
    $('review-please-wait').hide();
};

EbizmartsSagePaySuite.Checkout.prototype.reviewSave = EbizmartsSagePaySuite.Checkout.prototype.reviewSave.wrap(function(o, transport) {
    if (typeof transport !== 'undefined') {
        var response = {};
        try {
            response = this.evalTransport(transport);
        } catch(notv) {
            suiteLogError(notv);
        }

        if (!response.redirect || !response.success) {
            checkout.setResponse(transport);
            if(response.response_status == 'INVALID'){
                alert(response.response_status_detail);
            }
            return;
        }

        return o(transport);
    } else {
        transport = {};
    }

    if (this.isFormPaymentMethod()) {
        checkout.setLoadWaiting(true);
        new Ajax.Request(SuiteConfig.getConfig('global', 'sgps_saveorder_url'),{
            method:"post",
            parameters: Form.serialize($('firecheckout-form')),
            onSuccess:function(f){
                checkout.setLoadWaiting(false);
                var d = f.responseText.evalJSON();
                if(d.response_status == 'ERROR'){
                    alert(d.response_status_detail);
                    this.resetOscLoading();
                    return;
                }

                setLocation(SuiteConfig.getConfig('form','url'));
            }
        });
        return;
    }

    if((this.isDirectPaymentMethod() || this.isServerPaymentMethod()) && parseInt(SuiteConfig.getConfig('global','token_enabled')) === 1){
        if((typeof transport.tokenSuccess) == 'undefined'){
            this.setPaymentMethod();

            if(!this.isDirectTokenTransaction() && !this.isServerTokenTransaction() && (($('remembertoken-sagepaydirectpro') && $('remembertoken-sagepaydirectpro').checked === true) || ($('remembertoken-sagepayserver') && $('remembertoken-sagepayserver').checked === true))){
                return;
            }
        }
    }

    if (typeof transport.tokenSuccess != 'undefined' && true === transport.tokenSuccess) {

        if (Ajax.activeRequestCount > 1 && (typeof transport.tokenSuccess) == 'undefined') {
            return;
        }

        var slPayM = this.getPaymentMethod();
        if (slPayM == this.paypalcode) {
            checkout.setLoadWaiting(true);
            new Ajax.Request(SuiteConfig.getConfig('global', 'sgps_saveorder_url'),{
                method:"post",
                parameters: Form.serialize($('firecheckout-form')),
                onSuccess: function(f) {
                    setLocation(SuiteConfig.getConfig('paypal', 'redirect_url'));
                }
            });
            return;
        }

        if (slPayM == this.servercode || slPayM == this.directcode) {
            checkout.setLoadWaiting(true);
            new Ajax.Request(SuiteConfig.getConfig('global', 'sgps_saveorder_url'),{
                method:"post",
                parameters: Form.serialize($('firecheckout-form')),
                onSuccess: function(f) {
                    checkout.setLoadWaiting(false);
                    this.reviewSave(f);
                }.bind(this)
            });
            return;
        } else {
            checkout.setLoadWaiting(true);
            new Ajax.Request(SuiteConfig.getConfig('global', 'sgps_saveorder_url'),{
                method:"post",
                parameters: Form.serialize($('firecheckout-form')),
                onSuccess: function(f) {
                    checkout.setLoadWaiting(false);
                    this.reviewSave(f);
                }.bind(this)
            });
            return;
        }
    } else {
        checkout.setLoadWaiting(true);
        new Ajax.Request(SuiteConfig.getConfig('global', 'sgps_saveorder_url'),{
            method:"post",
            parameters: Form.serialize($('firecheckout-form')),
            onSuccess: function(f) {
                checkout.setLoadWaiting(false);
                this.reviewSave(f);
            }.bind(this)
        });
        return;
    }
});
