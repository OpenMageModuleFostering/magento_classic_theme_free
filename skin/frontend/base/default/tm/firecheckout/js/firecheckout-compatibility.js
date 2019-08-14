if (typeof CentinelAuthenticate == 'function') {
    CentinelAuthenticate.prototype._hideRelatedBlocks = function() {};
    CentinelAuthenticate.prototype._showRelatedBlocks = function() {};

    CentinelAuthenticate.prototype.success = function()
    {
        if (this._isRelatedBlocksLoaded() && this._isCentinelBlocksLoaded()) {
            this._showRelatedBlocks();
            $(this.centinelBlockId).hide();
            this._isAuthenticationStarted = false;

            firecheckoutWindow.hide();
            checkout.save();
        }
    };

    CentinelAuthenticate.prototype.cancel = function()
    {
        if (this._isAuthenticationStarted) {
            if (this._isRelatedBlocksLoaded()) {
                this._showRelatedBlocks();
                firecheckoutWindow.hide();
            }
            if (this._isCentinelBlocksLoaded()) {
                $(this.centinelBlockId).hide();
                $(this.iframeId).src = '';
            }
            this._isAuthenticationStarted = false;
        }
    };
}

/* SagePay Server Integration */
registerTransaction= function() {
    if($("opc-payment")) {
        var a=$("opc-payment").hasClassName("allow")
    } else {
        var a=false
    }
    if(Ajax.activeRequestCount>1||((a==false)&&$("opc-payment"))) {
        return
    }
    var c=$("wait-trn-create");
    var b=$("sage-pay-server-iframe");
    b.writeAttribute({src:""});
    new Ajax.Request(SAGE_PAY_REG_TRN_URL,{
        method:"get",
        onSuccess: function(f) {
            var d=f.responseText.evalJSON();
            var e=d.response_status;
            c.hide();
            if(e=="OK") {
                b.writeAttribute({src:d.next_url}).show();
                if($$(".col-right")[0]) {new Ajax.Updater($$(".col-right")[0],SP_PROGRESS_URL,{method:"get"})
                }
            } else {
                if(e=="INVALID"||e=="MALFORMED"||e=="ERROR"||e=="FAIL") {
                    if((typeof(SAGE_PAY_SERVER_UNIQUE)!="undefined")&&(SAGE_PAY_SERVER_UNIQUE==true)) {
                        b.hide()
                    }
                    if((a||!$("opc-payment"))) {
                        alert(Translator.translate("An error ocurred")+": \n"+d.response_status_detail)
                    }
                }
            }
        },
        onLoading: function() {
            var d=$("advice-required-entry-d-sgps-hi");
            if(d) {
                d.hide()
            }
            if(b.visible()) {
                b.hide()
            }
            c.setStyle({opacity:0.5}).show()
        }
    })
};
function createTrn() {
    registerTransaction()
}

function DumpObjectIndented(f,c) {
    var b="";
    if(c==null) {
        c=""
    }
    for(var e in f) {
        var d=f[e];
        if(typeof d=="string") {
            d=d
        } else {
            if(typeof d=="object") {
                if(d instanceof Array) {
                    d="[ "+d+" ]"
                } else {
                    var a=DumpObjectIndented(d,c+"  ");
                    d="\n"+c+"{\n"+a+"\n"+c+"}"
                }
            }
        }
        b+=c+"'"+e+"' : "+unescape(d)+",\n"
    }
    return b.replace(/,\n$/,"")
}

checkSagePayServerError= function() {
    var a=$("sage-pay-server-error");
    if(a.innerHTML.replace(/^\s+|\s+$/g,"")) {
        var b=a.innerHTML.evalJSON();
        alert(Translator.translate(b.response_status_detail));
        if(b.Request) {
            alert("REQUEST:\n"+DumpObjectIndented(b.Request));
            alert("RESPONSE:\n"+DumpObjectIndented(b.Response))
        }
        return false
    }
    return true
};
view_iframe= function() {
    if(checkSagePayServerError()===false) {
        return
    }

    var oldContent = firecheckoutWindow.content.down();
    if (oldContent && oldContent.select('#sage-pay-server-iframe')) {
        // oldContent.update('');
    } else if (oldContent) {
        $(document.body).insert(oldContent.hide());
    }
    firecheckoutWindow
        .update($('checkout-sagepay-iframe-load').show())
        .show();

    var iframe = $('sage-pay-server-iframe');
    iframe.src = iframe.name;
    //shPlaceOrderBlock("h")
};
/*_getPlaceBlock= function() {
    return $$("#checkout-step-review .button-set p")
};
shPlaceOrderBlock= function(b) {
    var a=_getPlaceBlock();
    if((typeof(a[0])!="undefined")) {
        if(b=="s") {
            a[0].show();
            if((typeof(a[1])!="undefined")) {
                a[1].show()
            }
        } else {
            a[0].hide();
            if((typeof(a[1])!="undefined")) {
                a[1].hide()
            }
        }
    }
};*/
continueMonitor= function() {
    var a=$$("#payment-buttons-container button");
    if((typeof(a[0])!="undefined")) {
        a[0].stopObserving();
        Event.observe(a[0],"click", function(c) {
            if($("checkout-agreements")) {
                $("checkout-agreements").show()
            }
            var d=$("review-please-wait");
            if($("p_method_sagepayserver").checked===false) {
                d.innerHTML=d.innerHTML.replace(SGPS_vtwo,SGPS_vone)
            } else {
                d.innerHTML=d.innerHTML.replace(SGPS_vone,SGPS_vtwo)
            }
            /*var b=_getPlaceBlock();
            if((typeof(b[0])!="undefined")&&!(b[0].visible())) {
                shPlaceOrderBlock("s");
                if($("review-buttons-container")&&!$("review-buttons-container").visible()) {
                    $("review-buttons-container").show()
                }
            }*/
        })
    }
};
sgps_placeOrder= function() {
    var c=$("review-please-wait");
    var a="";
    var b=$("review-buttons-container");
    //new Ajax.Request(SAGE_PAY_GTSPMC, {
        //onSuccess: function(d) {
            //c.hide();
            //a=d.responseText;
            //if($('p_method_sagepayserver').checked/*a=="sagepayserver"||a=="sagepayserverdot"*/) {
                var h=false;
                if(!SAGE_PAY_SERVER_ASIFRAME) {
                    var g=$$('p.agree input[type="checkbox"]');
                    if(g.length) {
                        g.each( function(k,j) {
                            if(!k.checked) {
                                alert(Translator.translate("Please agree to all Terms and Conditions before placing the order."));
                                h=true;
                                return false
                            }
                        })
                    }
                    if(!b.visible()) {
                        b.show()
                    }
                }
                if(!h) {
                    view_iframe();
                    if($("opc-review")) {
                        $("opc-review").scrollTo();
                        try {
                            var e=$("opc-review").positionedOffset().top;
                            var f=$$("div.header")[0].getStyle("height").replace("px","");
                            if(SP_DESIGN_MODERN) {
                                f=parseInt(f)+parseInt($$("div.toplinks-bar")[0].getStyle("height").replace("px",""))+parseInt($$("div.search-bar")[0].getStyle("height").replace("px",""))+parseInt($$("div.search-bar")[0].getStyle("margin-bottom").replace("px",""));
                                f=parseInt($$("div.middle")[0].getStyle("paddingTop").replace("px",""))+parseInt(f)+48
                            } else {
                                f=parseInt($$("div.middle")[0].getStyle("paddingTop").replace("px",""))+parseInt(f)
                            }
                            e=(e-f)+"px";
                            $$("div.one-page-checkout-progress")[0].setStyle({marginTop:e})
                        } catch(i) {
                        }
                    } else {
                        if($$("div.multi-address-checkout-box div.box")[1]) {
                            $$("div.multi-address-checkout-box div.box")[1].scrollTo()
                        }
                    }
                }
            //} else {
            //    checkout.save();
            //}
        //}
        /*,
        onLoading: function() {
            if(b) {
                b.hide()
            }
            c.setStyle({opacity:0.5}).show()
        }*/
    //});
};
dstrb= function() {
    alert(SAGEPAY_SERVER_NV)
};
sagePayServerAdvance= function() {
    if(SAGE_PAY_SERVER_AAOS) {
        continueMonitor();
        if(!SGPS_ISMS) {
            sgps_placeOrder();
        } else {
            $("multishipping-billing-form").submit()
        }
    }
};
sgps_uniqueHandler= function() {
    var a=$("p_method_sagepayserver").ancestors();
    if(a[0].hasClassName("no-display")) {
        a[0].removeClassName("no-display")
    }
    if((typeof(SAGE_PAY_SERVER_UNIQUE)!="undefined")&&(SAGE_PAY_SERVER_UNIQUE==true)&&(!$("sage-pay-server-iframe").visible()||$("sage-pay-server-iframe").readAttribute("src")=="")) {
        if($("wait-trn-create").visible()) {
            return
        }
        registerTransaction()
    }
};
listenRBSagePay_bind=createTrn.bindAsEventListener();
listenRBSagePayServer_bind=sagePayServerAdvance.bindAsEventListener();
try {
    Event.observe(window,"load", function() {
        if((typeof(SAGE_PAY_VALID_INSTALL)!="undefined")&&(SAGE_PAY_VALID_INSTALL==false)) {
            if(SAGE_PAY_MODE=="live") {new PeriodicalExecuter(dstrb,3)
            } else {
                var a='<ul class="messages"><li class="error-msg">'+SAGEPAY_SERVER_NV+"</li></ul>";
                if($("checkoutSteps")) {new Insertion.Before("checkoutSteps",a)
                } else {
                    var b=$$("div.multi-address-checkout-box");
                    if(b.length>0) {new Insertion.Before(b[0],a)
                    }
                }
            }
        }
    })
} catch(er) {
};
/* SagePay Server Integration */

/* Relaypoint integration */
function updateshipping(url) {
    if ($("s_method_relaypoint_relaypoint") && $("s_method_relaypoint_relaypoint").checked) {
        var radioGrp = $('checkout-shipping-method-load').select('input[name="relay-point"]');
        if (radioGrp) {
            for( i = 0; i < radioGrp.length; i++) {
                if(radioGrp[i].checked == true) {
                    var radioValue = radioGrp[i].value;
                }
            }
        } else {
            if(radioValue == null) {
                FC.Messenger.add(
                    'Vous devez choisir une adresse de livraison',
                    'checkout-shipping-method-load',
                    'error'
                );
                return false;
            }
        }
        var shippingstring = new Array();
        if (radioValue) {
            shippingstring = radioValue.split("&&&");
        } else {
            FC.Messenger.add(
                "Vous devez choisir une adresse de livraison",
                'checkout-shipping-method-load',
                'error'
            );
            return false;
        }
//        var street = shippingstring[0];
//        var description = shippingstring[1];
//        var postcode = shippingstring[2];
//        var city = shippingstring[3];
//        new Ajax.Request(url, {
//            method : 'post',
//            parameters : {
//                street : street,
//                description : description,
//                postcode : postcode,
//                city : city
//            }
//        });
    }
}
/* Relaypoint integration */

/* phoenix ipayment */
function processOnepagecheckoutResponse(response) {
    processResponse (response);

    if (response.get('ret_status') == 'SUCCESS') {
        if (response.get('paydata_bank_name'))
            document.getElementById('ipayment_elv_bank_name').value = response.get('paydata_bank_name');


        var formData = Form.serialize($('firecheckout-form'), true);
        var params = {};
        for (var i in formData) {
            if (i.indexOf('payment') == 0) { // sagepay think that onestepcheckout is active if billing was supplied
                params[i] = formData[i];
            }
        }

        new Ajax.Request(
            checkout.urls.payment_method,
            {
                method:'post',
                parameters: params,
                onComplete: function() {
                    checkout.setLoadWaiting(false);
                    checkout.save('', true);
                }
            }
        );
    }
}
/* phoenix ipayment */

/* Orgone fix */
var accordion = {};
accordion.openSection = function() {}
/* Orgone fix */

/* Payone integration */
if (window.payone) {
    window.payone.handleResponseCreditcardCheck = function(response) {
        if (response.status != 'VALID') {
            // Failure
            alert(response.customermessage);
            checkout.setLoadWaiting(false);
            return false;
        }
        // Success!
        var pseudocardpan = response.pseudocardpan;
        var truncatedcardpan = response.truncatedcardpan;
        $('payone_pseudocardpan').setValue(pseudocardpan);
        $('payone_truncatedcardpan').setValue(truncatedcardpan);
        // $('payone_creditcard_cc_number').setValue(truncatedcardpan); // validation
        cid = $('payone_creditcard_cc_cid');
        if (cid != undefined) {
            // $('payone_creditcard_cc_cid').setValue('')
        }
        checkout.setLoadWaiting(false);
        checkout.save('', true); // suffix, force
        // Post payment form to Magento:
//    var request = new Ajax.Request(payment.saveUrl, {
//        method : 'post',
//        onComplete : payment.onComplete,
//        onSuccess : payment.onSave,
//        onFailure : checkout.ajaxFailure.bind(checkout),
//        parameters : Form.serialize(payment.form)
//    });
    };
}
/* Payone integration */

/* Klarna integration */
document.observe('dom:loaded', function() {
    if (typeof Klarna !== 'undefined') {
        var FirecheckoutToKlarna = function() {
            var mapping = {
                'billing[firstname]': [
                    'payment[invoice_first_name]',
                    'payment[part_first_name]',
                    'payment[klarna_partpayment_firstname]',
                    'payment[klarna_invoice_firstname]'
                ],
                'billing[lastname]': [
                    'payment[invoice_last_name]',
                    'payment[part_last_name]',
                    'payment[klarna_partpayment_lastname]',
                    'payment[klarna_invoice_lastname]'
                ],
                'billing[street][]': [
                    'payment[invoice_street]',
                    'payment[part_street]',
                    'payment[klarna_partpayment_street]',
                    'payment[klarna_invoice_street]'
                ],
                'billing[postcode]': [
                    'payment[invoice_zipcode]',
                    'payment[part_zipcode]',
                    'payment[klarna_partpayment_zipcode]',
                    'payment[klarna_invoice_zipcode]'
                ],
                'billing[region]': [
                    'payment[invoice_city]',
                    'payment[part_city]',
                    'payment[klarna_partpayment_city]',
                    'payment[klarna_invoice_city]'
                ],
                'billing[city]': [
                    'payment[invoice_city]',
                    'payment[part_city]',
                    'payment[klarna_partpayment_city]',
                    'payment[klarna_invoice_city]'
                ],
                'billing[telephone]': [
                    'payment[invoice_phone_number]',
                    'payment[part_phone_number]',
                    'payment[klarna_partpayment_phonenumber]',
                    'payment[klarna_invoice_phonenumber]'
                ],
//                'billing[gender]': [
//                    'payment[invoice_gender]',
//                    'payment[part_gender]',
//                    'payment[klarna_partpayment_gender]',
//                    'payment[klarna_invoice_gender]'
//                ],
                'billing[day]': [
                    'payment[invoice_dob_day]',
                    'payment[part_dob_day]',
                    'payment[klarna_partpayment_dob_day]',
                    'payment[klarna_invoice_dob_day]',
                ],
                'billing[month]': [
                    'payment[invoice_dob_month]',
                    'payment[part_dob_month]',
                    'payment[klarna_partpayment_dob_month]',
                    'payment[klarna_invoice_dob_month]',
                ],
                'billing[year]': [
                    'payment[invoice_dob_year]',
                    'payment[part_dob_year]',
                    'payment[klarna_partpayment_dob_year]',
                    'payment[klarna_invoice_dob_year]'
                ]
            };
            var blocked = [];

            for (var name in mapping) {
                var el = $$('[name="' + name + '"]').first();
                if (!el) {
                    continue;
                }
                el.observe('change', function() {
                    var i = 0,
                        klarnaName;
                    while ((klarnaName = mapping[this.readAttribute('name')][i])) {
                        var klarnaEl = $$('[name="' + klarnaName + '"]').first();
                        i++;
                        if (!klarnaEl) {
                            continue;
                        }
                        klarnaEl.setValue(this.getValue());
                    }
                });
            }
        }();
    }
});
/* Klarna integration */

/* phone field formatting */
//document.observe('dom:loaded', function() {
//    if (typeof txtBoxFormat === 'function') {
//        var ids = ['billing:telephone', 'shipping:telephone'];
//        ids.each(function(id) {
//            var field = $(id);
//            if (field) {
//                field.writeAttribute('size', 30);
//                field.writeAttribute('maxlength', 15);
//                field.observe('keypress', function(e) {
//                    txtBoxFormat(this, '(999) 9999-9999', e);
//                });
//            }
//        });
//    }
//});
/* phone field formatting */

/* Billpay integration */
function billpayGetForm() {
    var form = $('firecheckout-form');
    if (!form) {
        form = $('gcheckout-onepage-form');
    }
    if (!form) {
        form = $('co-payment-form');
    }

    return form;
};
/* Billpay integration */

/* MultiFees */
document.observe('dom:loaded', function() {
    if (typeof MultiFees !== 'undefined') {
        firecheckoutMultifees = function(el) {
            var params = { review: 1 },
                url;
            if ($(el).up('#shipping-method')) {
                params['is_payment_fee'] = 0;
                params['is_shipping_fee'] = 1;
                url = checkout.urls.shipping_method;
            } else {
                params['is_payment_fee'] = 1;
                params['is_shipping_fee'] = 0;
                url = checkout.urls.payment_method;
            }
            checkout.update(url, params);
        };
        MultiFees.labelClick = MultiFees.labelClick.wrap(function(original, el) {
            if (false === original(el)) {
                return;
            }
            firecheckoutMultifees(el);
        });
        MultiFees.showShipping = MultiFees.showShipping.wrap(function(original, code) {
            original(code);
            $('multifees_shipping_'+code) && $('multifees_shipping_'+code)
                .select('input[type="checkbox"]').each(function(el) {
                    el.stopObserving('change');
                    el.observe('change', function(e) {
                        firecheckoutMultifees(this);
                    });
                });
        });
        checkout.update(checkout.urls.shipping_method);
        checkout.update(checkout.urls.payment_method);
    }
});
/* MultiFees */

function hiddenOnChange(input, callback) {
   var oldvalue = input.getValue();
   setInterval(function(){
      if (input.getValue() != oldvalue){
          oldvalue = input.getValue();
          callback();
      }
   }, 100);
}

/* infostrates tnt */
document.observe('inforstrates:shippingMethodTntCompleted', function(response) {
    checkout.save('', true);
});
ShippingMethod.prototype.addObservers = ShippingMethod.prototype.addObservers.wrap(function(original) {
    original();
    var tntField = $('tnt_relais1');
    if (tntField) {
        hiddenOnChange(tntField, function() {
            if (!tntField.getValue().length) {
                return;
            }

            //41 RUE RODIER&&&PEINTURE RODIER COLOR C3071&&&75009&&&PARIS 09
            var parts = tntField.getValue().split('&&&'),
                keys = ['street1', 'company', 'postcode', 'city'],
                input, i;

            for (i in parts) {
                input = $('shipping:' + keys[i]) || $('billing:' + keys[i]);
                if (input) {
                    input.setValue(parts[i]);
                }
            }

            var shippingCountry = $('shipping:country_id'),
                billingCountry = $('billing:country_id');
            if (billingCountry && shippingCountry) {
                shippingCountry.setValue(billingCountry.getValue());
            }

            if ($('shipping:same_as_billing')) {
                $('shipping:same_as_billing').checked = false;
                shipping.setSameAsBilling(false);
            }

            reviewInfo && reviewInfo.update('shipping-address');
        });
    }
});
/* infostrates tnt */

/* Webtex Giftcards */
if (typeof OnepageGiftcard !== 'undefined') {
    OnepageGiftcard.prototype.save = OnepageGiftcard.prototype.save.wrap(function(original) {
        checkout.setLoadWaiting(true);
        var request = new Ajax.Request(this.saveUrl, {
            method:'post',
            onComplete: this.onComplete,
            onSuccess: this.onSave,
            onFailure: checkout.ajaxFailure.bind(checkout),
            parameters: Form.serialize(checkout.form)
        });
    });
    OnepageGiftcard.prototype.nextStep = OnepageGiftcard.prototype.nextStep.wrap(function(original, transport) {
        original(transport);
        checkout.update.bind(checkout).defer(checkout.urls.shipping_method, {review: 1});
    });
}
/* Webtex Giftcards */

/* Customweb_PayUnity */
if (typeof Customweb !== 'undefined') {
    Customweb.CheckoutPreloadFlag = true; // disable preload functionality
}
/* Customweb_PayUnity */

/* Bpost_ShippingManager */
if (typeof bpostShippingManagerBase !== 'undefined') {
    bpostShippingManagerBase.prototype.updateShippingAddress = bpostShippingManagerBase.prototype.updateShippingAddress.wrap(function(o, details) {
        o(details);
        checkout.update(checkout.urls.shipping_method);
    });
}
/* Bpost_ShippingManager */

/* Webshopapps_Desttype */
document.observe('dom:loaded', function() {
    $('billing:dest_type') && $('billing:dest_type').observe('change', function() {
        checkout.update(checkout.urls.billing_address, {
            'shipping-method': 1,
            'review'         : 1
        });
    });
    $('shipping:dest_type') && $('shipping:dest_type').observe('change', function() {
        checkout.update(checkout.urls.shipping_address, {
            'shipping-method': 1,
            'review'         : 1
        });
    });
});
/* Webshopapps_Desttype */

/* AW_Storecredit */
document.observe('dom:loaded', function() {
    if ($('use_storecredit')) {
        $('use_storecredit').observe('click', function() {
            var sections = FC.Ajax.getSectionsToUpdate('payment-method');
            if (sections.length) {
                checkout.update(
                    checkout.urls.payment_method,
                    FC.Ajax.arrayToJson(sections)
                );
            }
        });
    }
    if (typeof storeCreditManager !== 'undefined') {
        if (storeCreditManager.grandTotalInit) {
            storeCreditManager.grandTotalInit();
        }
        if (storeCreditManager.storecreditInit()) {
            storeCreditManager.storecreditInit();
        }
    }
});
/* AW_Storecredit */

/* TIG_PostNL deliveryoptions */
document.observe('postnl:selectOptionSaved', function() {
    var sections = FC.Ajax.getSectionsToUpdate('shipping-method');
    if (sections.length) {
        checkout.update(
            checkout.urls.shipping_method,
            FC.Ajax.arrayToJson(sections)
        );
    }
});
/* TIG_PostNL deliveryoptions */

// craftyclicks postcode lookup
if (typeof CraftyPostcodeCreate !== 'undefined') {
    CraftyPostcodeCreate = CraftyPostcodeCreate.wrap(function(o) {
        var instance = o();

        instance.populate_form_fields = instance.populate_form_fields.wrap(function(original, j) {
            original(j);

            var el;
            if (-1 !== this.config.result_elem_id.indexOf('billing')) {
                el = $('billing:country_id') || $('billing:postcode');
            } else {
                el = $('shipping:country_id') || $('shipping:postcode')
            }
            if (el) {
                if (document.createEvent) {
                    var oEvent = document.createEvent("HTMLEvents");
                    oEvent.initEvent('change', true, true);
                    el.dispatchEvent.bind(el).delay(0.1, oEvent);
                } else {
                    var oEvent = document.createEventObject();
                    setTimeout(function() {
                        el.fireEvent('onchange', oEvent);
                    }, 20);
                }
            }
        });

        return instance;
    });
}
// craftyclicks postcode lookup

/* Phoenix_Wirecard Seamless see js/phoenix/wirecard_checkout_page/processing.js */
if (typeof wirecardCheckoutPageApplication !== 'undefined') {
    FireCheckout.prototype.setResponse = FireCheckout.prototype.setResponse.wrap(function (next, transport) {
        if (payment.currentMethod.indexOf("wirecard_checkout_page") === -1) {
            next(transport);
            return;
        }
        outerTransport = transport;
        nextStep = next;
        var outerResponse = eval('(' + outerTransport.responseText + ')');
        if (typeof outerResponse.redirect == 'undefined') {
            nextStep(outerTransport);
        }
        else {
            var params = {'paymentMethod': payment.currentMethod};
            var request = new Ajax.Request(
                qmoreIsIframe,
                {
                    method: 'get',
                    parameters: params,
                    onSuccess: function (innerTransport) {
                        if (innerTransport && innerTransport.responseText) {
                            try {
                                var innerResponse = eval('(' + innerTransport.responseText + ')');
                                var outerResponse = eval('(' + outerTransport.responseText + ')');
                            }
                            catch (e) {
                                innerResponse = {};
                            }
                            if (innerResponse.isIframe) {
                                //show iframe and set link
                                toggleQMoreIFrame();
                                $('qmore-iframe').src = outerResponse.redirect;
                            }
                            else {
                                nextStep(outerTransport);
                            }
                        }
                    },
                    onFailure: function (innerTransport) {
                        nextStep(outerTransport);
                    }
                });
        }
    });
}
/* Phoenix_Wirecard Seamless */

/* HeidelpayCD_Edition */
if (typeof Heidelpay !== 'undefined') {
    FireCheckout.prototype.setResponse = FireCheckout.prototype.setResponse.wrap(function (next, transport) {
        if (payment.currentMethod.indexOf("hcdcc") === -1 && payment.currentMethod.indexOf("hcddc") === -1) {
            next(transport);
            return;
        }
        var response;
        try {
            response = transport.responseText.evalJSON();
            /*
            * we need to use the hcdcc_URL from the server-response (the state-value is changing)
            */
            // console.log(response.update_section['payment-method']);
            // console.log( $('checkout-payment-method-load') );

        } catch (err) {
            alert('An error has occured during request processing. Try again please');
            checkout.setLoadWaiting(false);
            $('review-please-wait').hide();
            return false;
        }

        // we need to use the hcdcc_URL from the server-response (the state-value is changing) it's injected as "redirect"-URL
        if (response.success && response.redirect) {
            // taken from heidelpaycd.js and slightly modified
            var actPayment = payment.currentMethod;
            var form = new Element('form', {
                    style:'display:none',
                    action: response.redirect,
                    method: "POST"
                });
                $(document.body).insert(form);

                var data = {
                        ACCOUNT_BRAND: $$("." + actPayment + "_ACCOUNT_BRAND")[0].value ,
                        ACCOUNT_NUMBER: $$("." + actPayment +"_ACCOUNT_NUMBER")[0].value,
                        ACCOUNT_HOLDER: $$("." + actPayment + "_ACCOUNT_HOLDER")[0].value,
                        ACCOUNT_EXPIRY_MONTH: $$("." + actPayment + "_ACCOUNT_EXPIRY_MONTH")[0].value,
                        ACCOUNT_EXPIRY_YEAR: $$("." + actPayment + "_ACCOUNT_EXPIRY_YEAR")[0].value,
                        ACCOUNT_VERIFICATION: $$("." + actPayment + "_ACCOUNT_VERIFICATION")[0].value
                };

                for ( var key in data ) {
                    form.insert(
                            {bottom: new Element(
                                    'input',
                                    {type: 'text', name: key.replace(/_/,"."), value: data[key] }
                            )}
                    );

                };
                form.submit();
            // end: taken from heidelpaycd.js
        } else {
            next(transport);
            return;
        }
    });
}
/* HeidelpayCD_Edition */

/* Magestore_Giftvoucher */
document.observe('giftvoucher:success', function() {
    checkout.update(checkout.urls.shopping_cart);
});
/* Magestore_Giftvoucher */

/* JRD_Paczkomaty */
document.observe('firecheckout:shippingMethod:addObserversAfter', function() {
    var wrapper = $('paczkomaty_dropdown_wrapper');
    if (wrapper && wrapper.down('select')) {
        wrapper.down('select').observe('change', function() {
            checkout.update(checkout.urls.shipping_method);
        });
        if ($('paczkomaty_customer_telephone')) {
            $('paczkomaty_customer_telephone').observe('change', function() {
                checkout.update(checkout.urls.shipping_method);
            });
        }
    }
});
/* JRD_Paczkomaty */

// Billpay
document.observe('firecheckout:paymentMethod:addObserversAfter', function() {
    if (typeof billpayPaymentSelected === 'function'
        && payment.getCurrentMethod()
        && payment.getCurrentMethod().indexOf('billpay') === 0) {

        billpayPaymentSelected();
    }
});
