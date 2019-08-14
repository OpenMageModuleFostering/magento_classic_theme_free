var FC = FC || {};
FC.DependentFields = {
    rules: {},

    /**
     * @param {String} identifier Unique string to identify rule
     * @param {Object} rule
     *
     *  Rule examples:
     *      1. Short notation {
     *          field: 'billing:country_id',
     *          value: 'US',
     *          dependentField: 'billing:company',
     *          match: 'hidden',
     *          unmatch: 'required'
     *      }
     *
     *      2. Full notation {
     *          fields: {
     *              'billing:country_id': ['US', 'GB'],         // Selectbox
     *              'billing:city': '*',                        // Any non empty value
     *              'billing:register_account': true            // Checkbox
     *              's_method_freeshipping_freeshipping': false // Radio
     *          },
     *          dependentField: ['billing:company', 'billing:email'],
     *          match: {
     *              status: 'hidden',
     *              method: function() {
     *                  alert('match');
     *              }
     *          },
     *          unmatch: {
     *              status: 'required',
     *              method: function() {
     *                  alert('unmatch');
     *              }
     *          }
     *      }
     */
    addRule: function(identifier, rule) {
        rule.dependentField = [].concat(rule.dependentField);

        // move field to fields object
        if (rule.field) {
            if (!rule.fields) {
                rule.fields = {};
            }
            rule.fields[rule.field] = rule.value;
        }

        // transform values into array
        for (fieldId in rule.fields) {
            rule.fields[fieldId] = [].concat(rule.fields[fieldId]);
        }

        this.rules[identifier] = rule;

        for (fieldId in rule.fields) {
            var field = $(fieldId);
            if (!field) {
                continue;
            }

            if (field.tagName === 'INPUT' && field.type === 'radio') {
                var radios = $$('[name="' + field.name + '"]');
                radios.each(function(radio) {
                    radio.observe('click', this.check.bind(this, identifier))
                }.bind(this));

                continue;
            }

            field.observe('change', this.check.bind(this, identifier));
        }

        this.check(identifier);
    },

    checkAll: function() {
        for (identifier in this.rules) {
            this.check(identifier);
        }
    },

    check: function(identifier) {
        if (!identifier || !this.rules[identifier]) {
            return this.checkAll();
        }

        var fields = this.rules[identifier].fields,
            dependentFields = this.rules[identifier].dependentField,
            matched = true;

        if (!dependentFields.length) {
            return;
        }

        for (fieldId in fields) {
            var field = $(fieldId),
                possibleValues = fields[fieldId];

            if (!field) {
                continue;
            }

            // todo file elemets
            var value = field.getValue(),
                stringValue = value + '';
            if (-1 !== possibleValues.indexOf('*') && stringValue.length) {
                continue;
            }

            if (field.tagName === 'INPUT' && ['checkbox', 'radio'].indexOf(field.type) > -1) {
                value = field.checked;
            }

            if (-1 === possibleValues.indexOf(value)) {
                matched = false;
                break;
            }
        }

        if (matched && this.rules[identifier].postMatch) {
            matched = this.rules[identifier].postMatch();
        }

        var instructions = this.rules[identifier].match;
        if (!matched) {
            instructions = this.rules[identifier].unmatch;
        }

        var status = null,
            method = null;
        switch (typeof instructions) {
            case 'string':
                status = instructions;
                break;
            case 'function':
                method = instructions;
                break;
            case 'object':
                status = instructions.status;
                method = instructions.method;
                break;
        }

        if (status) {
            dependentFields.each(function(dependentField) {
                dependentField = $(dependentField);
                if (!dependentField) {
                    return;
                }
                this.setFieldStatus(dependentField, status)
            }.bind(this));
        }
        if (method) {
            method();
        }
    },

    setFieldStatus: function(field, status) {
        var label = field.up('.input-box').previous('label'),
            wrapper = field.up('.input-box').up();

        switch (status) {
            case 'required':
                if (field.hasClassName('required-entry')) {
                    return;
                }
                wrapper.show();
                if (label) {
                    label.addClassName('required');
                    label.insert({top: '<em>*</em>'});
                }
                field.addClassName('required-entry');
                break;
            case 'optional':
                wrapper.show();
                if (label) {
                    label.removeClassName('required');
                    label.innerHTML = label.innerHTML.replace('<em>*</em>', '');
                }
                field.removeClassName('required-entry');
                field.removeClassName('validation-failed');
                if ($('advice-required-entry-' + field.id)) {
                    $('advice-required-entry-' + field.id).remove();
                }
                break;
            case 'hidden':
                this.setFieldStatus(field, 'optional');
                wrapper.hide();
                break;
        }
    }
};
