var FC = FC || {};
FC.Messenger = {
    add: function(message, section, type) {
        section = $(section);
        if (!section) {
            return;
        }
        var ul = section.select('.messages')[0];
        if (!ul) {
            section.insert({
                top: '<ul class="messages"></ul>'
            });
            ul = section.select('.messages')[0];
        }
        var li = $(ul).select('.' + type + '-msg')[0];
        if (!li) {
            $(ul).insert({
                top: '<li class="' + type + '-msg"><ul></ul></li>'
            });
            li = $(ul).select('.' + type + '-msg')[0];
        }
        $(li).select('ul')[0].insert(
            '<li>' + message + '</li>'
        );
    },

    clear: function(section) {
        section = $(section);
        if (!section) {
            return;
        }
        var ul = section.select('.messages')[0];
        if (ul) {
            ul.remove();
        }
    }
};
