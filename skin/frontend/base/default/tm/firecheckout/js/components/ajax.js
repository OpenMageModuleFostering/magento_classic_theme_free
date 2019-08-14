var FC = FC || {};
FC.Ajax = {
    rules: {},
    sectionsToReload: false,

    getSectionsToUpdate: function() {
        if (!this.sectionsToReload) {
            this.sectionsToReload = {};
            for (var sectionToReload in this.rules.reload) {
                this.rules.reload[sectionToReload].each(function(section) {
                    if (!this.sectionsToReload[section]) {
                        this.sectionsToReload[section] = [];
                    }
                    this.sectionsToReload[section].push(sectionToReload);
                }.bind(this));
            }
        }

        var sections = [],
            i = 0;

        do {
            if (this.sectionsToReload[arguments[i]]) {
                sections = sections.concat(this.sectionsToReload[arguments[i]]);
            }
            i++;
        } while (i < arguments.length);

        return sections;
    },

    getSectionsToUpdateAsJson: function() {
        return this.arrayToJson(this.getSectionsToUpdate.apply(this, arguments));
    },

    arrayToJson: function(array) {
        var json = {};
        array.each(function(section) {
            json[section] = 1;
        });
        return json;
    },

    getSaveTriggers: function() {
        var triggers = [],
            i = 0;

        do {
            if (this.rules['save'][arguments[i]]) {
                triggers = triggers.concat(this.rules['save'][arguments[i]]);
            }
            i++;
        } while (i < arguments.length);

        return triggers;
    }
};
