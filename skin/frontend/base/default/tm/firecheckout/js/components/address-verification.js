var FC = FC || {};
FC.AddressVerification = Class.create();
FC.AddressVerification.prototype = {
    fields: [
        'street1',
        'street2',
        'city',
        'region_id',
        'postcode'
    ],

    initialize: function() {
        this.container = $('address-verification-window');
        if (this.container) {
            this.addObservers();
            this.initWindow();
            this.initSkipLabels();
        };
    },

    addObservers: function() {
        this.container.down('.address-verification-skip').observe('click', this.skipVerification.bind(this));
        this.container.down('.address-verification-edit').observe('click', this.editAddress.bind(this));
        var self = this;
        this.container.select('.address-verification-radio').each(function(el) {
            el.observe('click', self.updateButtons.bind(self));
        });
    },

    initWindow: function() {
        this.verificationWindow = new FC.Window({
            triggers: {},
            destroy : 1,
            size    : {
                maxWidth: 500
            }
        });
        this.verificationWindow.update(this.container).show();
    },

    initSkipLabels: function() {
        var labels = {
            'billing' : '.address-verification-skip-billing',
            'shipping': '.address-verification-skip-shipping'
        };

        for (var type in labels) {
            var label = this.container.down(labels[type]);
            if (!label) {
                continue;
            }

            var address = [':'];
            this.fields.each(function(id) {
                var field = $(type + ':' + id);
                if (!field) {
                    return;
                }

                var value = field.getValue();
                if ('region_id' === id
                    && countryRegions['US']
                    && countryRegions['US'][value]) {

                    value = countryRegions['US'][value]['code'];
                }
                address.push(value);
            });

            label.insert({
                bottom: address.join(' ')
            });
        };
    },

    getWindow: function() {
        return this.verificationWindow;
    },

    /**
     * Radio button was clicked
     */
    updateButtons: function() {
        var buttons = this.container.down('.buttons-set');
        buttons.select('.verification-option').invoke('hide');

        var options = this.getSelectedOptions();
        for (var i in options) {
            if ('edit' === options[i]) {
                buttons.select('.address-verification-edit').invoke('show');
                return;
            }
        }
        buttons.select('.address-verification-skip').invoke('show');
    },

    /**
     * @return object
     *  billing : edit,
     *  shipping: skip
     */
    getSelectedOptions: function() {
        var options = {};
        this.container.select('.address-verification-radio').each(function(el) {
            if (el.checked) {
                var type = el.readAttribute('name');
                type = type.replace('address-verification[', '');
                type = type.replace(']', '');
                options[type] = el.getValue();
            }
        });
        return options;
    },

    getVerifiedAddress: function() {
        var address = {};
        this.container.select('.address-verification-radio').each(function(el) {
            if (el.checked) {
                var type = el.readAttribute('name');
                type = type.replace('address-verification[', '');
                type = type.replace(']', '');
                if (0 === el.id.indexOf('address-verification-verified-')) {
                    address[type] = {};
                    el.up('li').select('.input-verified').each(function(input) {
                        address[type][input.readAttribute('name')] = input.getValue();
                    });
                }
            }
        });
        return address;
    },

    /**
     * "Place order using selected option" was clicked
     */
    skipVerification: function() {
        this.getWindow().hide();

        var address = this.getVerifiedAddress();
        for (var type in address) {
            this.fillAddress(address[type]);
        }

        this.doSkipVerificationRequest();
    },

    doSkipVerificationRequest: function() {
        checkout.save('?skip-address-verification=1', true);
    },

    fillAddress: function(data) {
        for (var i in data) {
            var value = data[i],
                el    = $(i);

            if (!el || (!value && el.hasClassName('required-entry'))) {
                continue;
            }
            el.setValue(value);
        }
    },

    /**
     * "Edit address" was clicked
     */
    editAddress: function() {
        this.getWindow().hide();

        var options = this.getSelectedOptions();
        for (var type in options) {
            if ('edit' !== options[type]) {
                continue;
            }
            var address = $(type + '-address');
            address.scrollTo();
            address.highlight();
        }
    },

    autocorrectAddresses: function(address) {
        for (var type in address) {
            this.fillAddress(address[type]);
        }
        this.doSkipVerificationRequest();
    }
};
