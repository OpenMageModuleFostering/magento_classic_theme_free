var FC = FC || {};
FC.Taxvat = {

    patterns: {
        'AT': /^U[0-9]{8}$/,
        'BE': /^0?[0-9]{*}$/,
        'CZ': /^[0-9]{8,10}$/,
        'DE': /^[0-9]{9}$/,
        'CY': /^[0-9]{8}[A-Z]$/,
        'DK': /^[0-9]{8}$/,
        'EE': /^[0-9]{9}$/,
        'GR': /^[0-9]{9}$/,
        'ES': /^[0-9A-Z][0-9]{7}[0-9A-Z]$/,
        'FI': /^[0-9]{8}$/,
        'FR': /^[0-9A-Z]{2}[0-9]{9}$/,
        'GB': /^([0-9]{9}|[0-9]{12})~(GD|HA)[0-9]{3}$/,
        'UK': /^([0-9]{9}|[0-9]{12})~(GD|HA)[0-9]{3}$/,
        'HU': /^[0-9]{8}$/,
        'IE': /^[0-9][A-Z0-9\\+\\*][0-9]{5}[A-Z]$/,
        'IT': /^[0-9]{11}$/,
        'LT': /^([0-9]{9}|[0-9]{12})$/,
        'LU': /^[0-9]{8}$/,
        'LV': /^[0-9]{11}$/,
        'MT': /^[0-9]{8}$/,
        'NL': /^[0-9]{9}B[0-9]{2}$/,
        'PL': /^[0-9]{10}$/,
        'PT': /^[0-9]{9}$/,
        'SE': /^[0-9]{12}$/,
        'SI': /^[0-9]{8}$/,
        'SK': /^[0-9]{10}$/
    },

    isValid: function(number, countryCode) {
        var pattern = this.patterns[countryCode];
        if (!pattern) {
            // this.message = 'The provided CountryCode is invalid for the VAT number';
            return false;
        }

        number = number.replace(countryCode, '');
        if (!number.match(pattern)) {
            // this.message = 'Invalid VAT number';
            return false;
        }

        return true;
    }
};
