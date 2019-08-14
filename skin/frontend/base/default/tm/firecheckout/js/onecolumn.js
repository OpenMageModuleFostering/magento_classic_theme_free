var OnecolumnCheckout = {
    currentStep: null,

    init: function() {
        $$('.onecolumn').first().insert({
            bottom: '<div id="scrolling-spacer"></div>'
        });
        this.stepForward($$('.onecolumn .step').first(), false);
        this.addObservers();
    },

    /**
     * @param  {DOM.Element} step   Step to activate
     * @param  {boolean} scroll      Flag, to indicate that scrolling should be used or not
     */
    stepForward: function(step, scroll) {
        if (!step) {
            return;
        }

        if (this.currentStep) {
            if (!this.validateStep(this.currentStep)) {
                return false;
            }
            this.currentStep.addClassName('completed').removeClassName('current');
        }

        this.latestStep = this.currentStep;
        this.currentStep = step;
        step.addClassName('current activated');
        this._handleScroll.bind(this).delay(0.1, scroll);
    },

    /**
     * Go to specified step and deactivate all completed steps
     */
    stepTo: function(step, scroll) {
        if (!step) {
            return;
        }

        step.nextSiblings().each(function(el) {
            el.removeClassName('current')
                .removeClassName('completed')
                .removeClassName('activated');
        });

        this.latestStep = this.currentStep;
        this.currentStep = step;
        step.removeClassName('completed').addClassName('current');
        this._handleScroll.bind(this).delay(0.1, scroll);
    },

    _handleScroll: function(scroll) {
        var step = this.currentStep;

        var sidebar = $$('.onecolumn-aside').first();
        if (sidebar && sidebar.getStyle('display') !== 'none') {
            var scrollingSpaceNeeded = step.viewportOffset().top - 20,
                viewportOffsetBottom = document.viewport.getScrollOffsets().top + document.viewport.getDimensions().height,
                availableScrollingSpace = (document.body.getHeight() - $('scrolling-spacer').getHeight()) - viewportOffsetBottom;

            if (scrollingSpaceNeeded > availableScrollingSpace) {
                if (step.viewportOffset().top === sidebar.viewportOffset().top) { // first step
                    $('scrolling-spacer').setStyle({
                        height: - availableScrollingSpace + 'px'
                    });
                } else {
                    $('scrolling-spacer').setStyle({
                        height: scrollingSpaceNeeded - availableScrollingSpace + 'px'
                    });
                }

                // min-height on content block fix
                availableScrollingSpace = (document.body.getHeight() - $('scrolling-spacer').getHeight()) - viewportOffsetBottom;
                if (availableScrollingSpace < 0) {
                    $('scrolling-spacer').setStyle({
                        height: - availableScrollingSpace + 'px'
                    });
                }
            } else {
                $('scrolling-spacer').setStyle({
                    height: 0 + 'px'
                });
            }
        }

        if (false !== scroll) {
            Effect.ScrollTo(step, {
                duration: 0.5,
                offset: -20
            });
        }
    },

    addObservers: function() {
        var self = this;

        // next step buttons
        $$('.step .next').each(function(el) {
            el.observe('click', function() {
                var step = el.up('.step'),
                    method = step.readAttribute('data-step-save');

                if (method && self[method]) {
                    self[method](el, self.stepForward.bind(self, step.next('.step')));
                } else {
                    self.stepForward(step.next('.step'));
                }
            });
        });

        // previous step buttons
        $$('.step .edit').each(function(el) {
            el.observe('click', function() {
                self.stepTo(el.up('.step'), false);
            });
        });

        // login button
        $$('.step .btn-login').each(function(el) {
            el.observe('click', function() {
                var email = $('billing\:email'),
                    password = $('billing\:customer_password'),
                    messageContainer = $$('.step-name .block-content').first();

                if (!Validation.validate(email) || !Validation.validate(password)) {
                    return;
                }

                // captcha integration
                var loginWindow = $('firecheckout-login-window');
                if (loginWindow.down('#user_login')) {
                    firecheckoutWindow
                        .update(loginWindow, {
                            maxWidth: 380
                        })
                        .show();
                    loginWindow.down('#email').setValue(email.getValue());
                    loginWindow.down('#pass').setValue(password.getValue());
                    var captchaInput = loginWindow.down('#captcha_user_login');
                    if (captchaInput) {
                        captchaInput.focus();
                    }
                    return;
                }

                self.setLoadingButton(el);
                new Ajax.Request(checkout.urls.login, {
                    parameters: {
                        'login[username]': email.getValue(),
                        'login[password]': password.getValue()
                    },
                    onSuccess: function(transport) {
                        var response = {};
                        try {
                            response = transport.responseText.evalJSON();
                        } catch (e) {
                            response.error = e;
                        }

                        self.setLoadingButton(el, false);
                        FC.Messenger.clear(messageContainer);
                        if (response.error) {
                            FC.Messenger.add(response.error, messageContainer, 'error');
                            checkout.updateCaptcha('user_login');
                            password.focus();
                            password.setSelectionRange(0, password.value.length);
                        }
                        if (response.redirect) {
                            document.location = response.redirect;
                        }
                    }
                });
            });
        });

        // forgot password button
        $$('.step .link-forgot-password').each(function(el) {
            el.observe('click', function(e) {
                Event.stop(e);
                var email = $('billing\:email'),
                    messageContainer = $$('.step-name .block-content').first();

                if (!Validation.validate(email)) {
                    return;
                }

                // captcha integration
                var forgotWindow = $('firecheckout-forgot-window');
                if (forgotWindow.down('#user_forgotpassword')) {
                    firecheckoutWindow
                        .update(forgotWindow, {
                            maxWidth: 380
                        })
                        .show();
                    forgotWindow.down('#email_address').setValue(email.getValue());
                    var captchaInput = forgotWindow.down('#captcha_user_forgotpassword');
                    if (captchaInput) {
                        captchaInput.focus();
                    }
                    return;
                }

                el.hide();
                checkout.setLoadingField(el.up('.input-box').down('input'));

                new Ajax.Request(checkout.urls.forgotpassword, {
                    parameters: {
                        'email': email.getValue()
                    },
                    onSuccess: function(transport) {
                        checkout.setLoadingField(el.up('.input-box').down('input'), false);
                        el.show();

                        FC.Messenger.clear(messageContainer);

                        var response = transport.responseText.evalJSON();
                        if (response.error) {
                            FC.Messenger.add(response.error, messageContainer, 'error');
                            checkout.updateCaptcha('user_forgotpassword');
                        } else if (response.message) {
                            FC.Messenger.add(response.message, messageContainer, 'success');
                        }
                    }
                });
            });
        });

        // instant field validation
        $$('.onecolumn').first().select('input,select,radio,checkbox,textarea').each(function(el) {
            var tagName   = el.tagName.toLowerCase(),
                eventName = 'change';

            if ('checkbox' === tagName || 'radio' === tagName) {
                eventName = 'click';
            }

            el.observe(eventName, function() {
                if (!self.canValidate(el)) {
                    return;
                }
                if (Validation.validate(el)) {
                    self.getFieldsToValidate(el).each(function(selector) {
                        var field = $$(selector).first();
                        if (field && self.canValidate(field)) {
                            Validation.validate(field);
                        }
                    });
                }
            });
        });

        // discount form
        var discountToggler = $('discount_block_toggle');
        if (discountToggler) {
            discountToggler.observe('click', function() {
                var form = this.up('li').next('.form');
                if (this.checked) {
                    form.addClassName('shown');
                } else {
                    form.removeClassName('shown');
                }
            });
        }

        // email verification
        var emailField = $('billing\:email');
        if (emailField) {
            emailField.observe('change', self.onEmailChange.bind(self));
            if (emailField.value.length && Validation.validate(emailField)) {
                self.onEmailChange();
            }
        }
    },

    onEmailChange: function() {
        var self = this,
            emailField = $('billing\:email'),
            buttonSet = $('step-name').down('.step-buttons-set');

        if (!emailField.value.length || !Validation.validate(emailField)) {
            return;
        }
        checkout.setLoadingField(emailField);
        self.setDisableButtonSet(buttonSet);
        self.verifyEmail(emailField.value, function(result) {
            checkout.setLoadingField(emailField, false);
            self.setDisableButtonSet(buttonSet, false);
            if (!result.success) {
                alert('An error has occured during request processing. Try again please');
            }
            self.toggleLogin(result.exists);
        });
    },

    verifyEmail: function(email, callback) {
        new Ajax.Request(checkout.urls.email_verification, {
            parameters: {
                email: email
            },
            onFailure: function(transport) {
                callback({
                    success: false
                });
            },
            onSuccess: function(transport) {
                try {
                    response = transport.responseText.evalJSON();
                } catch (err) {
                    callback({success: false});
                    return false;
                }
                callback({
                    success: true,
                    exists: response.exists
                });
            }
        });
    },

    toggleLogin: function(flag) {
        var checkbox = $('register-customer-checkbox'),
            name = $$('.field-name').first(),
            stepName = $$('.step-name').first();

        if (flag) {
            this.stepTo(stepName, false);
            stepName.addClassName('mode-login');
            if (checkbox) {
                checkbox.hide();
                billing.setCreateAccount(true);
            }
            name.hide();
            $('billing\:customer_password').focus();
        } else {
            stepName.removeClassName('mode-login');
            if (checkbox) {
                checkbox.show();
                if (!checkbox.down('input:checked')) {
                    billing.setCreateAccount(false);
                }
            }
            name.show();
            $('billing\:firstname').focus();
        }
    },

    /**
     * Defines field validators requirements.
     *
     * Example:
     *     There is no need to validate credit card type, if cc_number is
     *     not available yet and so on..
     *
     * @param  {DOMElement} field
     * @return {boolean}
     */
    canValidate: function(field) {
        var rules = {
            'payment[cc_type]': ['[name=payment[cc_number]]'],
            'payment[cc_cid]': ['[name=payment[cc_type]]']
        };
        if (!rules[field.name]) {
            return true;
        }

        var form = $('payment_form_' + payment.getCurrentMethod()),
            result = true;

        if (!form) {
            return true;
        }

        rules[field.name].each(function(selector) {
            var field = form.down(selector);
            if (field && !field.getValue()) {
                result = false;
                throw $break;
            }
        });
        return result;
    },

    /**
     * Defines dependencies between fields validators.
     *
     *  Example:
     *      When cc number is changed we should validate cc_type as well.
     *
     * @param  {DOMElement} field
     * @return {array}      Array of dependent field selectors
     */
    getFieldsToValidate: function(field) {
        var linkedFields = {
            'payment[cc_number]': ['[name=payment[cc_type]]']
        };
        if (!linkedFields[field.name]) {
            return [];
        }
        return linkedFields[field.name];
    },

    validateStep: function(step) {
        if (!step.validator) {
            step.validator = new Validation(step);
        }
        return step.validator.validate();
    },

    setDisableButtonSet: function(set, status) {
        if (false === status) {
            set.select('button').each(function(button) {
                button.removeClassName('disabled').enable();
            });
        } else {
            set.select('button').each(function(button) {
                button.addClassName('disabled').disable();
            });
        }
    },

    setLoadingButton: function(button, status) {
        if (false === status) {
            button.removeClassName('loading').enable();
            button.down('.field-spinner-wrapper').remove();
        } else {
            button.addClassName('loading').disable();
            button.insert({
                bottom: '<div class="field-spinner-wrapper"><div class="loader"></div></div>'
            });
        }
    },

    saveStep: function(url, button, callback, params) {
        var self = this;

        params = Object.extend({
            urlSuffix: '',
            force_validation: 1
        }, params || {});

        self.setLoadingButton(button);
        var result = checkout.update(
            url + params.urlSuffix,
            params,
            function(response) {
                self.setLoadingButton(button, false);
                try {
                    response = response.responseText.evalJSON();
                } catch (err) {
                    return;
                }
                if (response.error) {
                    return;
                }
                callback();
            }
        );
        if (false === result) {
            self.setLoadingButton(button, false);
        }
    },

    saveName: function(button, callback, options) {
        var self = this;

        var password = $('register-customer-password');
        if (password && password.visible() && password.hasClassName('hidden-registration')) {
            password.hide(); // hack to pass Validation method
        }

        if (!self.validateStep(button.up('.step'))) {
            return;
        }

        options = Object.extend({
            force_validation: 0
        }, options || {});

        self.saveStep(checkout.urls.billing_address, button, callback, options);
    },

    saveAddress: function(button, callback, options) {
        var self = this;
        if (!self.validateStep(button.up('.step'))) {
            return;
        }

        self.saveStep(
            checkout.urls.billing_address_with_validation,
            button,
            function() {
                var sameAsBilling = $('shipping:same_as_billing');
                if (sameAsBilling && !sameAsBilling.checked) {
                    self.saveStep(checkout.urls.shipping_address, button, callback, options);
                } else {
                    callback();
                }
            },
            options
        );
    },

    saveShippingMethod: function(button, callback, options) {
        var self = this;
        if (!shippingMethod.validate() || !self.validateStep(button.up('.step'))) {
            this.scrollToError($$('.step-shipping-method').first());
            return;
        }
        self.saveStep(checkout.urls.shipping_method, button, callback, options);
    },

    savePaymentMethod: function(button, callback, options) {
        var self = this;
        if (!payment.validate() || !self.validateStep(button.up('.step'))) {
            this.scrollToError($$('.step-payment-method').first());
            return;
        }
        self.saveStep(checkout.urls.payment_method, button, callback, options);
    },

    saveShippingAndPaymentMethods: function(button, callback, options) {
        var self = this;
        if (!shippingMethod.validate() || !payment.validate() || !self.validateStep(button.up('.step'))) {
            this.scrollToError($$('.step-shipping-payment-method').first());
            return;
        }
        self.saveStep(checkout.urls.shipping_method, button, function() {
            self.saveStep(checkout.urls.payment_method, button, function() {
                callback();
            }, options);
        }, options);
    },

    scrollToError: function(step) {
        var validationMessages = step.select('.messages').findAll(function(el) {
            return el.visible();
        });
        var viewportSize = document.viewport.getDimensions();
        var needToScroll = false;
        validationMessages.each(function(el) {
            var offset = el.viewportOffset();
            if (offset.top < 0 || offset.top > viewportSize.height
                || offset.left < 0 || offset.left > viewportSize.width) {

                needToScroll = true;
                throw $break;
            }
        });

        if (needToScroll) {
            Effect.ScrollTo(validationMessages[0], {
                duration: '0.5',
                offset: -20
            });
        }
    }
};

var OrderSummary = {
    cloneOrderTotals: function() {
        var div = $('order-total-clone');
        if (!div) {
            return;
        }
        var totals = $('checkout-review-table').down('tfoot');
        div.update('<tfoot>' + totals.innerHTML.stripScripts() + '</tfoot>');
    },

    init: function() {
        var self = this;
        self.cloneOrderTotals();
        document.observe('firecheckout:setResponseAfter', function(e) {
            self.cloneOrderTotals();
        });
    }
};

document.observe('dom:loaded', function() {
    OnecolumnCheckout.init();

    if (typeof reviewInfo !== 'undefined') {
        reviewInfo.editBlock = reviewInfo.editBlock.wrap(function(o, id) {
            o(id);

            var block = $(id),
                sameAsBilling = $('shipping:same_as_billing');

            if (-1 !== id.indexOf('address') && (!block || (sameAsBilling && sameAsBilling.checked))) {
                block = $('billing-address');
            }

            OnecolumnCheckout.stepTo(block.up('.step'), false);
        });
    }

    // USPS Address Verification
    if (FC.AddressVerification) {
        FC.AddressVerification.prototype.doSkipVerificationRequest = function() {
            var step = OnecolumnCheckout.currentStep;

            OnecolumnCheckout.saveAddress(
                step.down('.step-buttons-set .next'),
                OnecolumnCheckout.stepForward.bind(OnecolumnCheckout, step.next('.step')),
                {
                    urlSuffix: '?skip-address-verification=1'
                }
            );
        };
    }
});

document.observe('firecheckout:setLoadWaitingBefore', function(e) {
    var buttons = OnecolumnCheckout.currentStep.down('.step-buttons-set');
    if (buttons) {
        OnecolumnCheckout.setDisableButtonSet(buttons, e.memo.flag);
    }

    // enable previous step buttons
    var prevStep = OnecolumnCheckout.latestStep;
    if (prevStep) {
        buttons = prevStep.down('.step-buttons-set');
        if (buttons) {
            OnecolumnCheckout.setDisableButtonSet(buttons, false);
        }
    }
});

document.observe('firecheckout:setResponseAfter', function(e) {
    var step = false;

    if (e.memo.response.onecolumn_step) {
        step = e.memo.response.onecolumn_step;
    } else if (e.memo.response.goto_section) {
        var gotoMapping = {
            'payment'           : 'step-shipping-payment-method',
            'shipping_method'   : 'step-shipping-payment-method',
            'shipping'          : 'step-address',
            'billing'           : 'step-address',
            'review'            : 'step-review'
        };
        step = gotoMapping[e.memo.response.goto_section];
    }

    if (step) {
        OnecolumnCheckout.stepTo($(step), true);
    }
});
