var FC = FC || {};
FC.Housenumber = Class.create();
FC.Housenumber.prototype = {
    settings: {
        /**
         * Array of country codes
         * @type {Array}
         */
        optional: [],

        /**
         * Array of country codes
         * @type {Array}
         */
        required: ['*']
    },

    initialize: function(addressType, config) {
        Object.extend(this.settings, config || {});
        this.addressType = addressType;
        this.createField();
        this.updateFieldStatus();
        this.addObservers();
    },

    createField: function() {
        var street1  = $(this.addressType + ':street1'),
            parent   = street1.up('li'),
            housenum = $(this.addressType + ':street2'),
            housenumLi = housenum.up('li'),
            wrapper1 = new Element('div', {'class': 'field street1'}),
            wrapper2 = new Element('div', {'class': 'field housenum'});

        parent.removeClassName('wide');
        parent.addClassName('fields');

        parent.insert({top: wrapper1});
        wrapper1.insert({top: street1.up().previous()});
        wrapper1.insert({bottom: street1.up()});

        parent.insert({bottom: wrapper2});
        wrapper2.insert({top: housenum.up()});
        housenum.insert({
            before: '<label for="' + this.addressType + ':street2">' + this.settings.label + '</label>'
        });
        housenumLi.remove();
    },

    updateFieldStatus: function() {
        var countryEl = $(this.addressType + ':country_id'),
            housenumEl = $(this.addressType + ':street2'),
            label = housenumEl.previous('label');

        if (this.isRequired(countryEl.getValue())) {
            if (housenumEl.hasClassName('required-entry')) {
                return;
            }
            label.addClassName('required');
            label.insert({top: '<em>*</em>'});
            housenumEl.addClassName('required-entry');
        } else {
            label.removeClassName('required');
            label.innerHTML = label.innerHTML.replace('<em>*</em>', '');
            housenumEl.removeClassName('required-entry');
            housenumEl.removeClassName('validation-failed');
            if ($('advice-required-entry-' + this.addressType + ':street2')) {
                $('advice-required-entry-' + this.addressType + ':street2').remove();
            }
        }
    },

    isRequired: function(countryCode) {
        // if country is in required array
        if (-1 !== this.settings.required.indexOf(countryCode)) {
            return true;
        }

        // if country is in optional array
        if (-1 !== this.settings.optional.indexOf(countryCode)) {
            return false;
        }

        // if asterisk is in required array
        if (-1 !== this.settings.required.indexOf('*')) {
            return true;
        }

        // optional if not required
        return false;
    },

    addObservers: function() {
        var countryEl = $(this.addressType + ':country_id');
        if (countryEl) {
            countryEl.observe('change', this.updateFieldStatus.bind(this));
        }
    }
};
