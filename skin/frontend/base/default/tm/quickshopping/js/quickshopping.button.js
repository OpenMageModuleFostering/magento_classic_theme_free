var QuickviewButton = Class.create();
QuickviewButton.prototype = {
    initialize: function(parent)
    {
        var that = this;
        $$(parent).each(function(el, index){
            el.observe('mouseover', that.showButton);
            el.observe('mouseout', that.hideButton);
        });
    },

    showButton: function(e)
    {
        el = this;
        while (el.tagName != 'LI') {
            el = el.up();
        }
        var link = $(el).select('.quickshoppinglink')[0];
        link && link.setStyle({
            display: 'block'
        });
    },

    hideButton: function(e)
    {
        el = this;
        while (el.tagName != 'LI') {
            el = el.up();
        }
        var link = $(el).select('.quickshoppinglink')[0];
        link && link.setStyle({
            display: 'none'
        });
    }
};
