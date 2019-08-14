var AddressAutocomplete = (function() {

    var config = {};

    function getAutocomplete(el) {
        return el.addressAutocomplete;
    }

    /**
     * Find region_id by it's code, or name
     *
     * @param  {Object} address
     * @return {Number}
     */
    function findRegionId(address) {
        var id,
            regionCode = address.region_code,
            regionName = address.region,
            countryCode = address.country_id,
            regions = config.regions;

        if (regions[countryCode]) {
            // 1. search by codes
            for (id in regions[countryCode]) {
                if (regions[countryCode][id].code === regionCode) {
                    return id;
                }
            }
            // 2. search by name
            for (id in regions[countryCode]) {
                if (regions[countryCode][id].name === regionName) {
                    return id;
                }
            }
        }
        return false;
    }

    function extractFieldValueFromPlace(name, value, place) {
        var i = 0;
        while ((field = place.address_components[i])) {
            if (field.types[0] === name) {
                return field[value];
            }
            i++;
        }
        return '';
    }

    /**
     * Extract address from google place object
     * @param  {Object} place   @see autocomplete.getPlace()
     * @return {Object}
     */
    function extractAddress(place) {
        if (!place || !place.address_components) {
            return false;
        }

        var mapping = {
            'country_id'    : '{{country.short_name}}',
            'street1'       : '{{street_number.short_name}} {{route.short_name}}',
            'street2'       : '',
            'city'          : '{{locality.long_name}}',
            'postcode'      : '{{postal_code.short_name}}',
            'region'        : '{{administrative_area_level_1.long_name}}',
            'region_id'     : '',
            'region_code'   : '{{administrative_area_level_1.short_name}}'
        };
        if (config.street_number_placement === 'line1_end') {
            mapping.street1 = '{{route.short_name}} {{street_number.short_name}}';
        } else if (config.street_number_placement === 'line2') {
            mapping.street1 = '{{route.short_name}}';
            mapping.street2 = '{{street_number.short_name}}';
        }

        var address = {};
        for (var i in mapping) {
            if (!mapping[i].length) {
                address[i] = '';
                continue;
            }

            address[i] = [];

            var re = /\{\{(.+?)\}\}/g;
            while ((fields = re.exec(mapping[i]))) {
                var field = fields[1].split('.')[0],
                    value = fields[1].split('.')[1];

                var fieldValue = extractFieldValueFromPlace(field, value, place);
                if (fieldValue) {
                    address[i].push(fieldValue);
                }
            }
            address[i] = address[i].join(' ');
        }

        address.street_1 = address.street1;
        address.street_2 = address.street2;
        address.region_id = findRegionId(address);
        return address;
    }

    return {
        fill: function(address, fieldPrefix) {
            for (var id in address) {
                var value = address[id];
                if (false === value) {
                    continue;
                }

                var el = document.getElementById(fieldPrefix + id);
                if (!el || el.getValue() == value) {
                    continue;
                }

                el.setValue(value);
                if (el.simulate) {
                    el.simulate('change');
                }
            }
        },

        init: function() {
            var self = this,
                rules = [{
                    ids: ['billing:street1', 'shipping:street1', 'street_1'],
                    types: ['address'],
                    listeners: {
                        place_changed: function(el) {
                            // 1. Match field prefix (billing:, shipping: or empty string)
                            var fieldPrefix = '';
                            ['billing:', 'shipping:'].each(function(prefix) {
                                if (el.id.indexOf(prefix) !== -1) {
                                    fieldPrefix = prefix;
                                    throw $break;
                                }
                            });

                            // 2. Extract address from google place
                            var address = extractAddress(getAutocomplete(el).getPlace());
                            if (!address) {
                                return;
                            }

                            // 3. Fill the form
                            this.fill(address, fieldPrefix);
                        }
                    }
                }];

            rules.each(function(rule) {
                rule.ids.each(function(id) {
                    var el = document.getElementById(id);
                    if (!el) {
                        return;
                    }

                    var autocomplete = new google.maps.places.Autocomplete(el, {
                        types: rule.types
                    });
                    el.addressAutocomplete = autocomplete;

                    if (rule.listeners) {
                        for (var i in rule.listeners) {
                            autocomplete.addListener(i, rule.listeners[i].bind(self, el));
                        }
                    }
                });
            });
        },

        setConfig: function(json) {
            config = json;
        }
    };
})();
