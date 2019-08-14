var FC = FC || {};
FC.Cart = Class.create();
FC.Cart.prototype = {
    initialize: function(config) {
        if (config) { // can be called multiple times
            this.config = config;
        }
        this.addQtyObservers();
        this.addDescriptionToggler();
        this.addLinkObservers();
    },

    addQtyObservers: function() {
        var self = this,
            qtyWrappers = $$('.qty-wrapper');

        qtyWrappers.each(function(el) {
            el.observe('mouseover', function(e) {
                qtyWrappers.invoke('removeClassName', 'shown');
                clearTimeout(self.timeout);
                el.addClassName('shown');
            });
            el.observe('mouseout', function(e) {
                self.timeout = setTimeout(Element.removeClassName, 500, el, 'shown');
            });
        });

        $$('.qty-more, .qty-less').each(function(el) {
            el.observe('click', function() {
                var qtyWrapper = this.up('.qty-wrapper'),
                    field = this.up('.qty-wrapper').down('.qty'),
                    qty = parseFloat(field.value),
                    inc = parseFloat(qtyWrapper.down('.qty-increment').getValue());

                inc = inc ? inc : 1;
                inc = (this.hasClassName('qty-more') ? inc : -inc);

                if (isNaN(qty)) {
                    qty = 0;
                }
                qty += inc;
                self.updateQty(field, qty);
            });
        });

        $$('input.qty').each(function(el) {
            el.observe('change', function() {
                self.updateQty(el);
                if (window.getSelection) {
                    if (window.getSelection().empty) {  // Chrome
                        window.getSelection().empty();
                    } else if (window.getSelection().removeAllRanges) {  // Firefox
                        window.getSelection().removeAllRanges();
                    }
                } else if (document.selection) {  // IE?
                    document.selection.empty();
                }
            });
        });
    },

    updateQty: function(field, qty) {
        qty = (qty === undefined ? field.value : qty);
        if (qty <= 0) {
            qty = 0;
            if (!confirm(checkout.translations.productRemoveConfirm)) {
                field.value = field.defaultValue;
                return;
            }
        }

        field.value = qty;

        var options = FC.Ajax.getSectionsToUpdateAsJson('cart', 'total');
        options.review = 1;
        // collect only changed item to speed up cart update
        options['updated_' + field.name] = field.value;
        options['updated_' + field.previous().name] = field.previous().value;
        checkout.update(checkout.urls.shopping_cart, options);
    },

    addLinkObservers: function() {
        $('checkout-review-table').select('a').each(function(el) {
            if (-1 != el.href.indexOf('giftcard/cart/remove')) {
                el.observe('click', function(e) {
                    if (typeof event != 'undefined') { // ie9 fix
                        event.preventDefault ? event.preventDefault() : event.returnValue = false;
                    }
                    Event.stop(e);
                    var uriParts = this.href.replace(/\/+$/, '').split('/'),
                        code = uriParts[uriParts.length - 1];

                    checkout.update(checkout.urls.giftcard, {
                        'remove_giftcard': 1,
                        'giftcard_code': code,
                        'review': 1
                    });
                    return false;
                });
            } else if (-1 != el.href.indexOf('storecredit/cart/remove')) {
                el.observe('click', function(e) {
                    if (typeof event != 'undefined') { // ie9 fix
                        event.preventDefault ? event.preventDefault() : event.returnValue = false;
                    }
                    Event.stop(e);

                    checkout.update(checkout.urls.paymentdata, {
                        'review': 1,
                        'remove_storecredit': 1
                    });
                    if ($('use_customer_balance')) {
                        $('use_customer_balance').checked = false;
                        var elements = $$('input[name="payment[method]"]');
                        for (var i=0; i<elements.length; i++) {
                            elements[i].disabled = false;
                        }
                        $('checkout-payment-method-load').show();
                        customerBalanceSubstracted = false;
                    }
                    return false;
                });
            } else if (-1 != el.href.indexOf('reward/cart/remove')) {
                el.observe('click', function(e) {
                    if (typeof event != 'undefined') { // ie9 fix
                        event.preventDefault ? event.preventDefault() : event.returnValue = false;
                    }
                    Event.stop(e);

                    checkout.update(checkout.urls.paymentdata, {
                        'review': 1,
                        'remove_rewardpoints': 1
                    });
                    if ($('use_reward_points')) {
                        $('use_reward_points').checked = false;
                        var elements = $$('input[name="payment[method]"]');
                        for (var i=0; i<elements.length; i++) {
                            elements[i].disabled = false;
                        }
                        $('checkout-payment-method-load').show();
                        rewardPointsSubstracted = false;
                    }
                    return false;
                });
            } else if (-1 != el.href.indexOf('ugiftcert/checkout/remove')) {
                el.observe('click', function(e) {
                    if (typeof event != 'undefined') { // ie9 fix
                        event.preventDefault ? event.preventDefault() : event.returnValue = false;
                    }
                    Event.stop(e);
                    var uriParts = this.href.replace(/\/+$/, '').split('/'),
                        code = uriParts[uriParts.length - 1];

                    checkout.update(checkout.urls.coupon, {
                        'remove_ugiftcert': 1,
                        'gc': code,
                        'review': 1
                    });
                    return false;
                });
            } else if (-1 != el.href.indexOf('awgiftcard/card/remove')) {
                el.observe('click', function(e) {
                    if (typeof event != 'undefined') { // ie9 fix
                        event.preventDefault ? event.preventDefault() : event.returnValue = false;
                    }
                    Event.stop(e);
                    var uriParts = this.href.replace(/\/+$/, '').split('/'),
                        code = uriParts[uriParts.length - 1];

                    new Ajax.Request(awgiftcardRemoveUrl, { // see firecheckout/aw_giftcard/cart_giftcard.phtml
                        method:'post',
                        parameters: {
                            'giftcard_code': code
                        },
                        onComplete: function() {
                            checkout.update(checkout.urls.shopping_cart, {
                                'review': 1
                            });
                        }
                    });
                    return false;
                });
            }
        });
    },

    addDescriptionToggler: function() {
        var self = this;
        $('checkout-review-table').select('.short-description .std').each(function(el) {
            var description = el.innerHTML,
                i = self.config.descriptionLength,
                letter;

            if (description.length <= i * 1.3) {
                return;
            }

            // we can't place toggler inside these tags
            // if we are inside one of them - try to move the pointer before them
            var tagsToSkip = ['dl', 'ul', 'ol', 'table'],
                begin      = description.substr(0, i),
                openedTags = closedTags = [],
                k = 0,
                tagName;

            while ((tagName = tagsToSkip[k++])) {
                while (begin.length > 10) {
                    openedTags = begin.match(new RegExp('<' + tagName + '.+?>', 'g'));
                    closedTags = begin.match(new RegExp('<' + tagName + '/>', 'g'));

                    if (!openedTags && !closedTags) { // no restricted elements - both regexp doesn't match
                        break;
                    }

                    if (!openedTags || !closedTags // one regexp doesn't match - tag is now closed on this position
                        || openedTags.length != closedTags.length) { // we are inside restricted tags

                        i -= 4;
                        begin = description.substr(0, i);
                    } else {
                        break;
                    }
                }

                if (!openedTags && !closedTags) { // no restricted elements - both regexp doesn't match
                    continue;
                }
                if (!openedTags || !closedTags) { // one regexp doesn't match - tag is now closed on this position
                    return;
                }
                if (openedTags.length != closedTags.length) { // we are inside restricted tags
                    return;
                }
            }

            // make offset to prevent breaking of html tags
            var j = i;
            while ((letter = description[j])) {
                j--;
                if (letter === '<') { // we was inside html tag, need to change the i value
                    i = j + 1;
                    break;
                } else if (letter === '>') { // we was outside html tag
                    break;
                }
            }

            var dots    = '…',
                begin   = description.substr(0, i),
                end     = '<div style="display:none;">' + dots + description.substr(i).replace(/^\s+/, '') + '</div>',
                toggler = '<a href="javascript:" class="description-toggler">' + dots + '</a>';

            el.update(begin + toggler + end);

            el.down('.description-toggler').observe('click', function(e) {
                self.toggleDescription(this);
            });
        });
    },

    toggleDescription: function(toggler) {
        var el = $(toggler).next();
        if (toggler.hasClassName('active')) {
            el.hide();
            $(toggler).removeClassName('active');
        } else {
            el.show();
            $(toggler).addClassName('active');
        }
    }
};
