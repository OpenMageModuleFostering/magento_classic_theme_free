// lightwindow.js v2.0
// Copyright (c) 2007 stickmanlabs
// Author: Kevin P Miller | http://www.stickmanlabs.com
// LightWindow is freely distributable under the terms of an MIT-style license.
/*-----------------------------------------------------------------------------------------------*/

// This will stop image flickering in IE6 when elements with images are moved
try {
    document.execCommand("BackgroundImageCache", false, true);
} catch(e) {}

var lightwindow = Class.create();
lightwindow.prototype = {
    //
    //    Setup Variables
    //
    element : null,
    contentToFetch : null,
    windowActive : false,
    dataEffects : [],
    dimensions : {
        cruft : null,
        container : null,
        viewport : {
            height : null,
            width : null,
            offsetTop : null,
            offsetLeft : null
        }
    },
    pagePosition : {
        x : 0,
        y : 0
    },
    pageDimensions : {
        width : null,
        height : null
    },
    resizeTo : {
        height : null,
        heightPercent : null,
        width : null,
        widthPercent : null,
        fixedTop : null,
        fixedLeft : null
    },
    scrollbarOffset : 18,
    navigationObservers : {
        previous : 'lightwindow_previous',
        next : 'lightwindow_next'
    },
    containerChange : {
        height : 0,
        width : 0
    },
    //
    //    Initialize the lightwindow.
    //
    initialize : function(options) {
        $('lightwindow') && $('lightwindow').remove();
        $('lightwindow_overlay') && $('lightwindow_overlay').remove();
        this.options = Object.extend({
            skinpath : '',
            resizeSpeed : 1,
            contentOffset : {
                height : 10,
                width : 0
            },
            dimensions : {
                external : {height : 250, width : 450}
            },
            classNames : {
                standard : 'lightwindow',
                action : 'lightwindow_action'
            },
            viewportPadding : 10,
            overlay : {
                opacity : 0.7,
                image : options.skinpath+'black.png',
                presetImage : options.skinpath+'black-70.png'
            },
            skin : {
                main : '<div id="lightwindow_container" >'+
                            '<div id="lightwindow_stage" >'+
                                '<div id="lightwindow_title_bar" >'+
                                    '<div id="lightwindow_title_bar_inner" >'+
                                        '<span id="lightwindow_title_bar_title"></span>'+
                                        '<a id="lightwindow_title_bar_close_link" >close</a>'+
                                    '</div>'+
                                '</div>'+
                                '<div id="lightwindow_contents" >'+
                                '</div>'+
                                '<div id="lightwindow_navigation" >'+
                                    '<a href="#" id="lightwindow_previous" >'+
                                        '<span id="lightwindow_previous_title"></span>'+
                                    '</a>'+
                                    '<a href="#" id="lightwindow_next" >'+
                                        '<span id="lightwindow_next_title"></span>'+
                                    '</a>'+
                                '</div>'+
                            '</div>'+
                        '</div>',
                loading : '<div id="lightwindow_loading" >'+
                                '<iframe name="lightwindow_loading_shim" id="lightwindow_loading_shim" src="javascript:false;" frameBorder="0" scrolling="no"></iframe>'+
                            '</div>'
            },
            hideFlash : false
        }, options || {});
        this.duration = ((11-this.options.resizeSpeed)*0.15);
        this._setupLinks();
        this._getScroll();
        this._getPageDimensions();
        this._browserDimensions();
        this._addLightWindowMarkup(false);
        this._setupDimensions();
        this._toggleTroubleElements('visible', false);
    },
    //
    //    Activate the lightwindow.
    //
    activate : function(e, link){
        // Clear out the window Contents
        this._clearWindowContents();

        // Add back in out loading panel
        this._addLoadingWindowMarkup();

        // Setup the element properties
        this._setupWindowElements(link);

        // Setup everything
        this._getScroll();
        this._browserDimensions();
        this._setupDimensions();
        this._toggleTroubleElements('hidden', false);
        this._displayLightWindow('block', 'hidden');
        this._setStatus(true);
        this._monitorKeyboard(true);
        this._prepareIE(true);
        this._loadWindow();
    },
    //
    //    Turn off the window
    //
    deactivate : function(){
        // The window is not active
        this.windowActive = false;

        // Kill the animation
        this.animating = false;

        // Clear our element
        this.element = null;

        $('lightwindow_previous').setStyle({
            visibility: 'hidden'
        });
        $('lightwindow_next').setStyle({
            visibility: 'hidden'
        });

        // hide the window.
        this._displayLightWindow('none', 'visible');

        // Clear out the window Contents
        this._clearWindowContents();

        // Stop all animation
        var queue = Effect.Queues.get('lightwindowAnimation').each(function(e){
            e.cancel();
        });

        // Undo the setup
        this._prepareIE(false);
        this._setupDimensions();
        this._toggleTroubleElements('visible', false);
        this._monitorKeyboard(false);
    },
    //
    //    Initialize specific window
    //
    createWindow : function(element, attributes) {
        this._processLink($(element));
    },
    //
    //    Reload the window with another location
    //
    openWindow : function(element) {
        var element = $(element);

        if (!element) {
            return;
        }

        // The window is active
        this.windowActive = true;

        // Clear out the window Contents
        this._clearWindowContents();

        // Add back in out loading panel
        this._addLoadingWindowMarkup();

        // Setup the element properties
        this._setupWindowElements(element);

        this._setStatus(true);
        this._loadWindow();
    },
    //
    //    Navigate the window
    //
    navigateWindow : function(direction) {
        if (direction == 'previous') {
            this.openWindow(this.navigationObservers.previous);
        } else if (direction == 'next') {
            this.openWindow(this.navigationObservers.next);
        }
    },

    //
    //  Set Links Up
    //
    _setupLinks : function() {
        var links = $$('.'+this.options.classNames.standard);
        links.each(function(link) {
            this._processLink(link);
        }.bind(this));
    },
    //
    //  Process a Link
    //
    _processLink : function(link) {
        // Take care of our inline content
        var url = link.getAttribute('href');
        if (url.indexOf('?') > -1) {
            url = url.substring(0, url.indexOf('?'));
        }

        var container = url.substring(url.indexOf('#')+1);
        if($(container)) {
            $(container).setStyle({
                display : 'none'
            });
        }

        var func = this.activate.bindAsEventListener(this, link);
        Event.stopObserving(link, 'click');
        Event.observe(link, 'click', func, false);
        link.onclick = function() {return false;};
    },
    //
    //    Add the markup to the page.
    //
    _addLightWindowMarkup : function(rebuild) {
        var overlay = Element.extend(document.createElement('div'));
        overlay.setAttribute('id', 'lightwindow_overlay');
        // FF Mac has a problem with putting Flash above a layer without a 100% opacity background, so we need to use a pre-made
        if (Prototype.Browser.Gecko || Prototype.Browser.IE) {
            overlay.setStyle({
                backgroundImage: 'url('+this.options.overlay.presetImage+')',
                backgroundRepeat: 'repeat',
                height: this.pageDimensions.height+'px'
            });
        } else {
            overlay.setStyle({
                opacity: this.options.overlay.opacity,
                backgroundImage: 'url('+this.options.overlay.image+')',
                backgroundRepeat: 'repeat',
                height: this.pageDimensions.height+'px'
            });
        }

        // fix for slowly loaded images, that affects page height
        var self = this;
        Event.observe(window, 'load', function() {
            self._getPageDimensions.bind(self)();
            $('lightwindow_overlay').setStyle({
                height: self.pageDimensions.height + 'px'
            });
        });

        var lw = document.createElement('div');
        lw.setAttribute('id', 'lightwindow');
        lw.innerHTML = this.options.skin.main;

        var body = document.getElementsByTagName('body')[0];
        body.appendChild(overlay);
        body.appendChild(lw);

        var close = $(lw).down('#lightwindow_title_bar_close_link');
        if (close) {
            Event.stopObserving(close, 'click');
            Event.observe(close, 'click', this.deactivate.bindAsEventListener(this));
            close.onclick = function() {return false;};
        }

        Event.stopObserving($('lightwindow_previous'), 'click');
        Event.observe($('lightwindow_previous'), 'click', this.navigateWindow.bind(this, 'previous'), false);
        $('lightwindow_previous').onclick = function() {return false;};
        Event.stopObserving($('lightwindow_next'), 'click');
        Event.observe($('lightwindow_next'), 'click', this.navigateWindow.bind(this, 'next'), false);
        $('lightwindow_next').onclick = function() {return false;};

        $('lightwindow_previous').setStyle({
            visibility: 'hidden'
        });
        $('lightwindow_next').setStyle({
            visibility: 'hidden'
        });

        // Because we use position absolute, kill the scroll Wheel on animations
        if (Prototype.Browser.IE) {
            Event.observe(document, 'mousewheel', this._stopScrolling.bindAsEventListener(this), false);
        } else {
            Event.observe(window, 'DOMMouseScroll', this._stopScrolling.bindAsEventListener(this), false);
        }

        Event.stopObserving(overlay, 'click');
        Event.observe(overlay, 'click', this.deactivate.bindAsEventListener(this), false);
        overlay.onclick = function() {return false;};
    },
    //
    //  Add loading window markup
    //
    _addLoadingWindowMarkup : function() {
        $('lightwindow_contents').innerHTML += this.options.skin.loading;
    },
    //
    //  Setup the window elements
    //
    _setupWindowElements : function(link) {
        this.element = link;
        this.element.title = null ? '' : link.getAttribute('title');
        this.element.author = null ? '' : link.getAttribute('author');
        this.element.caption = null ? '' : link.getAttribute('caption');
        this.element.rel = null ? '' : link.getAttribute('rel');
        this.element.params = null ? '' : link.getAttribute('params');

        // Set the window type
        this.contentToFetch = this.element.href;
    },
    //
    //  Clear the window contents out
    //
    _clearWindowContents : function() {
        // Empty the contents
        $('lightwindow_contents').innerHTML = '';

        // Reset the scroll bars
        $('lightwindow_contents').setStyle({
            overflow: 'hidden'
        });

        $('lightwindow_title_bar_title').innerHTML = '';
    },
    //
    //    Set the status of our animation to keep things from getting clunky
    //
    _setStatus : function(status) {
        this.animating = status;
        if (status) {
            Element.show('lightwindow_loading');
        }
        if (!(/MSIE 6./i.test(navigator.userAgent))) {
            this._fixedWindow(status);
        }
    },
    //
    //  Make this window Fixed
    //
    _fixedWindow : function(status) {
        if (status) {
            if (this.windowActive) {
                this._getScroll();
                $('lightwindow').setStyle({
                    position: 'absolute',
                    top: parseFloat($('lightwindow').getStyle('top'))+this.pagePosition.y+'px',
                    left: parseFloat($('lightwindow').getStyle('left'))+this.pagePosition.x+'px'
                });
            } else {
                $('lightwindow').setStyle({
                    position: 'absolute'
                });
            }
        } else {
            if (this.windowActive) {
                this._getScroll();
                $('lightwindow').setStyle({
                    position: 'fixed',
                    top: parseFloat($('lightwindow').getStyle('top'))-this.pagePosition.y+'px',
                    left: parseFloat($('lightwindow').getStyle('left'))-this.pagePosition.x+'px'
                });
            } else {
                $('lightwindow').setStyle({
                    position: 'fixed',
                    top: (parseFloat(this._getParameter('lightwindow_top')) ? parseFloat(this._getParameter('lightwindow_top'))+'px' : this.dimensions.viewport.height/2+'px'),
                    left: (parseFloat(this._getParameter('lightwindow_left')) ? parseFloat(this._getParameter('lightwindow_left'))+'px' : this.dimensions.viewport.width/2+'px')
                });
            }
        }
    },
    //
    //    Prepare the window for IE.
    //
    _prepareIE : function(setup) {
        if (Prototype.Browser.IE) {
            var height, overflowX, overflowY;
            if (setup) {
                var height = '100%';
            } else {
                var height = 'auto';
            }
            var body = document.getElementsByTagName('body')[0];
            var html = document.getElementsByTagName('html')[0];
            html.style.height = body.style.height = height;
        }
    },

    _stopScrolling : function(e) {
        if (this.animating) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.returnValue = false;
        }
    },
    //
    //    Get the scroll for the page.
    //
    _getScroll : function(){
          if(typeof(window.pageYOffset) == 'number') {
            this.pagePosition.x = window.pageXOffset;
            this.pagePosition.y = window.pageYOffset;
          } else if(document.body && (document.body.scrollLeft || document.body.scrollTop)) {
               this.pagePosition.x = document.body.scrollLeft;
            this.pagePosition.y = document.body.scrollTop;
        } else if(document.documentElement) {
            this.pagePosition.x = document.documentElement.scrollLeft;
            this.pagePosition.y = document.documentElement.scrollTop;
          }
    },
    //
    //    Reset the scroll.
    //
    _setScroll : function(x, y) {
        document.documentElement.scrollLeft = x;
        document.documentElement.scrollTop = y;
    },
    //
    //    Hide Selects from the page because of IE.
    //     We could use iframe shims instead here but why add all the extra markup for one browser when this is much easier and cleaner
    //
    _toggleTroubleElements : function(visibility, content){

        if (content) {
            var selects = $('lightwindow_contents').getElementsByTagName('select');
        } else {
            var selects = document.getElementsByTagName('select');
        }

        for(var i = 0; i < selects.length; i++) {
            selects[i].style.visibility = visibility;
        }

        if (!content) {
            if (this.options.hideFlash){
                var objects = document.getElementsByTagName('object');
                for (i = 0; i != objects.length; i++) {
                    objects[i].style.visibility = visibility;
                }
                var embeds = document.getElementsByTagName('embed');
                for (i = 0; i != embeds.length; i++) {
                    embeds[i].style.visibility = visibility;
                }
            }
//            var iframes = document.getElementsByTagName('iframe');
//            for (i = 0; i != iframes.length; i++) {
//                iframes[i].style.visibility = visibility;
//            }
        }
    },
    //
    //  Get the actual page size
    //
    _getPageDimensions : function() {
        var xScroll, yScroll;
        if (window.innerHeight && window.scrollMaxY) {
            xScroll = document.body.scrollWidth;
            yScroll = window.innerHeight + window.scrollMaxY;
        } else if (document.body.scrollHeight > document.body.offsetHeight){
            xScroll = document.body.scrollWidth;
            yScroll = document.body.scrollHeight;
        } else {
            xScroll = document.body.offsetWidth;
            yScroll = document.body.offsetHeight;
        }

        var windowWidth, windowHeight;
        if (self.innerHeight) {
            windowWidth = self.innerWidth;
            windowHeight = self.innerHeight;
        } else if (document.documentElement && document.documentElement.clientHeight) {
            windowWidth = document.documentElement.clientWidth;
            windowHeight = document.documentElement.clientHeight;
        } else if (document.body) {
            windowWidth = document.body.clientWidth;
            windowHeight = document.body.clientHeight;
        }

        if(yScroll < windowHeight){
            this.pageDimensions.height = windowHeight;
        } else {
            this.pageDimensions.height = yScroll;
        }

        if(xScroll < windowWidth){
            this.pageDimensions.width = windowWidth;
        } else {
            this.pageDimensions.width = xScroll;
        }
    },
    //
    //    Display the lightWindow.
    //
    _displayLightWindow : function(display, visibility) {
        $('lightwindow_overlay').style.display = $('lightwindow').style.display = $('lightwindow_container').style.display = display;
        $('lightwindow_overlay').style.visibility = $('lightwindow').style.visibility = $('lightwindow_container').style.visibility = visibility;
    },
    //
    //    Setup Dimensions of lightwindow.

    //
    _setupDimensions : function() {

        var originalHeight, originalWidth;
        originalHeight = this.options.dimensions.external.height;
        originalWidth = this.options.dimensions.external.width;


        var offsetHeight = this._getParameter('lightwindow_top') ? parseFloat(this._getParameter('lightwindow_top'))+this.pagePosition.y : this.dimensions.viewport.height/2+this.pagePosition.y;
        var offsetWidth = this._getParameter('lightwindow_left') ? parseFloat(this._getParameter('lightwindow_left'))+this.pagePosition.x : this.dimensions.viewport.width/2+this.pagePosition.x;

        // So if a theme has say shadowed edges, they should be consistant and take care of in the contentOffset
        $('lightwindow').setStyle({
            top: offsetHeight+'px',
            left: offsetWidth+'px'
        });

        $('lightwindow_container').setStyle({
            height: originalHeight+'px',
            width: originalWidth+'px',
            left: -(originalWidth/2)+'px',
            top: -(originalHeight/2)+'px'
        });

        $('lightwindow_contents').setStyle({
            height: originalHeight+'px',
            width: originalWidth+'px'
        });
    },
    //
    //    Monitor the keyboard while this lightwindow is up
    //
    _monitorKeyboard : function(status) {
        if (status) document.onkeydown = this._eventKeypress.bind(this);
        else document.onkeydown = '';
    },
    //
    //  Perform keyboard actions
    //
    _eventKeypress : function(e) {
        if (e == null) {
            var keycode = event.keyCode;
        } else {
            var keycode = e.which;
        }

        switch (keycode) {
            case 27:
                this.deactivate();
                break;

            case 13:
                return;

            default:
                break;
        }

        // Gotta stop those quick fingers
        if (this.animating) {
            return false;
        }

        switch (keycode) {
            case 80: case 37: // p, <-
                if (this.navigationObservers.previous && this.allowPrevious) {
                    this.navigateWindow('previous');
                }
                break;

            case 78: case 39: // n, ->
                if (this.navigationObservers.next && this.allowNext) {
                    this.navigateWindow('next');
                }
                break;

            default:
                break;
        }
    },
    //
    //    Get the value from the params attribute string.
    //
    _getParameter : function(parameter, parameters) {
        if (!this.element) return false;
        if (parameter == 'lightwindow_top' && this.element.top) {
            return unescape(this.element.top);
        } else if (parameter == 'lightwindow_left' && this.element.left) {
            return unescape(this.element.left);
        } else if (parameter == 'lightwindow_height' && this.element.height) {
            return unescape(this.element.height);
        } else if (parameter == 'lightwindow_width' && this.element.width) {
            return unescape(this.element.width);
        } else {
            if (!parameters) {
                if (this.element.params) parameters = this.element.params;
                else return;
            }
            var value;
            var parameterArray = parameters.split(',');
            var compareString = parameter+'=';
            var compareLength = compareString.length;
            for (var i = 0; i < parameterArray.length; i++) {
                if (parameterArray[i].substr(0, compareLength) == compareString) {
                    var currentParameter = parameterArray[i].split('=');
                    value = currentParameter[1];
                    break;
                }
            }
            if (!value) return false;
            else return unescape(value);
        }
    },
    //
    //  Get the Browser Viewport Dimensions
    //
    _browserDimensions : function() {
        if (Prototype.Browser.IE) {
            this.dimensions.viewport.height = document.documentElement.clientHeight;
            this.dimensions.viewport.width = document.documentElement.clientWidth;
        } else {
            this.dimensions.viewport.height = window.innerHeight;
            this.dimensions.viewport.width = document.width || document.body.offsetWidth;
        }
    },
    //
    //  Get the scrollbar offset, I don't like this method but there is really no other way I can find.
    //
    _getScrollerWidth : function() {
        var scrollDiv = Element.extend(document.createElement('div'));
        scrollDiv.setAttribute('id', 'lightwindow_scroll_div');
        scrollDiv.setStyle({
            position: 'absolute',
            top: '-10000px',
            left: '-10000px',
            width: '100px',
            height: '100px',
            overflow: 'hidden'
        });

        var contentDiv = Element.extend(document.createElement('div'));
        contentDiv.setAttribute('id', 'lightwindow_content_scroll_div');
        contentDiv.setStyle({
            width: '100%',
            height: '200px'
        });

        scrollDiv.appendChild(contentDiv);

        var body = document.getElementsByTagName('body')[0];
        body.appendChild(scrollDiv);

        var noScroll = $('lightwindow_content_scroll_div').offsetWidth;
        scrollDiv.style.overflow = 'auto';
        var withScroll = $('lightwindow_content_scroll_div').offsetWidth;

           Element.remove($('lightwindow_scroll_div'));

        this.scrollbarOffset = noScroll-withScroll;
    },

    //
    //  Load the window Information
    //
    _loadWindow : function() {
        this._processWindow();

        var newAJAX = new Ajax.Request(
            this.contentToFetch, {
                method: 'get',
                parameters: '',
                onFailure: function(transport) {
                    $('lightwindow_contents').setStyle({
                        overflow: 'auto'
                    });
                    this._setStatus(false);
                    $('lightwindow_title_bar_title').innerHTML = transport.status;
                    $('lightwindow_contents').innerHTML = '';
                    $('lightwindow_contents').insert(transport.responseText);
                }.bind(this),
                onSuccess: function(transport) {
                     $('lightwindow_contents').setStyle({
                        overflow: 'auto'
                    });
                    this._setStatus(false);

                    try {
                        var response = transport.responseText.evalJSON();
                    } catch (e) {
                        var response = {
                            title   : transport.status,
                            previous: {},
                            next    : {},
                            content : transport.responseText
                        };
                    }

                    $('lightwindow_title_bar_title').innerHTML = response.title;

                    if (response.previous.url) {
                        this.allowPrevious = true;
                        $('lightwindow_previous').href = response.previous.url;
                        $('lightwindow_previous').title = response.previous.name;
                        $('lightwindow_previous').setStyle({
                            visibility: 'visible'
                        });
                    } else {
                        this.allowPrevious = false;
                        $('lightwindow_previous').href = '#';
                        $('lightwindow_previous').setStyle({
                            visibility: 'hidden'
                        });
                    }

                    if (response.next.url) {
                        this.allowNext = true;
                        $('lightwindow_next').href = response.next.url;
                        $('lightwindow_next').title = response.next.name;
                        $('lightwindow_next').setStyle({
                            visibility: 'visible'
                        });
                    } else {
                        this.allowNext = false;
                        $('lightwindow_next').href = '#';
                        $('lightwindow_next').setStyle({
                            visibility: 'hidden'
                        });
                    }
                    $('lightwindow_contents').innerHTML = '';
                    try {
                        var content = response.content;
                        if (content && content.toElement) {
                            content = content.toElement();
                        }
                        content = Object.toHTML(content);

                        $('lightwindow_contents').insert(content.stripScripts());
                        response.content.extractScripts().map(function(script) {
                            try {
                                return QuickviewGlobalEval.defer(script);
                                // return window.eval.defer(script);
                            } catch (e) {
                                console.log(e);
                            }
                        });
                    } catch (e) {
                        contole.log(e);
                    }

                    if (typeof AjaxPro !== 'undefined') {
                        switch (typeof AjaxPro) {
                            case 'function':
                                AjaxPro().fire.delay(1, 'addObservers');
                            break;
                            case 'object':
                                AjaxPro.fire.delay(1, 'addObservers');
                            break;
                        }
                    }

                    this.calendar.addObserver();

                    if (typeof addSubmitEvent === 'function') { // AW ajaxcartpro
                        addSubmitEvent.delay(1);
                    }

                    if (typeof iCart !== 'undefined' && iCart.updateLinks) {
                        iCart.updateLinks.delay(1);
                    }

                    // fire event that product preview is ready
                    document.fire("quickshopping:previewloaded");

                }.bind(this)
            }
        );
    },

    calendar: {
        fixPosition: function(e, counter) {
            var counter = counter || 0,
                calendarBlock = $$('.calendar')[$$('.calendar').length - 1];
            if (calendarBlock) {
                calendarBlock.setStyle({
                    left  : e.pointerX() + 'px',
                    top   : e.pointerY() + 'px',
                    zIndex: 999
                });
            } else if (counter < 3) {
                this.fixPosition.bind(this).delay(0.1, e, ++counter);
            }
        },
        addObserver: function(counter) {
            var dateField = $$('input.datetime-picker')[0],
                counter   = counter || 0,
                self      = this;
            if (dateField) {
                dateField.next().observe('click', function(e) {
                    self.fixPosition.delay(0.1, e);
                });
            } else if (counter < 3) {
                this.addObserver.bind(this).delay(0.1, ++counter);
            }
        }
    },

    //
    //  Resize the Window to fit the viewport if necessary
    //
    _resizeWindowToFit : function() {
        if (this.resizeTo.height+this.dimensions.cruft.height > this.dimensions.viewport.height) {
            var heightRatio = this.resizeTo.height/this.resizeTo.width;
            this.resizeTo.height = this.dimensions.viewport.height-this.dimensions.cruft.height-(2*this.options.viewportPadding);
        }
        if (this.resizeTo.width+this.dimensions.cruft.width > this.dimensions.viewport.width) {
            var widthRatio = this.resizeTo.width/this.resizeTo.height;
            this.resizeTo.width = this.dimensions.viewport.width-2*this.dimensions.cruft.width-(2*this.options.viewportPadding);
        }
    },

    //
    //  Set the Window to a preset size
    //
    _presetWindowSize : function() {
        if (this._getParameter('lightwindow_height')) {
            this.resizeTo.height = parseFloat(this._getParameter('lightwindow_height'));
        }
        if (this._getParameter('lightwindow_width')) {
            this.resizeTo.width = parseFloat(this._getParameter('lightwindow_width'));
        }
    },

    //
    //  Process the Window
    //
    _processWindow : function() {
        // Clean out our effects
        this.dimensions.dataEffects = [];

        var originalContainerDimensions = {
            height: $('lightwindow_container').getHeight(),
            width: $('lightwindow_container').getWidth()
        };

        // Position the window
        if (!this.windowActive) {
            $('lightwindow_container').setStyle({
                height: 'auto',
                // We need to set the width to a px not auto as opera has problems with it
                width: $('lightwindow_container').getWidth() +
                    this.options.contentOffset.width + 'px'
            });
        }

        var newContainerDimensions = {
            height: $('lightwindow_container').getHeight(),
            width: $('lightwindow_container').getWidth()
        };

        // We need to record the container dimension changes
        this.containerChange = {
            height: originalContainerDimensions.height-newContainerDimensions.height,
            width: originalContainerDimensions.width-newContainerDimensions.width
        };

        // Get out general dimensions
        this.dimensions.container = {
            height: $('lightwindow_container').getHeight(),
            width: $('lightwindow_container').getWidth()
        };
        this.dimensions.cruft = {
            height: this.dimensions.container.height-$('lightwindow_contents').getHeight()+this.options.contentOffset.height,
            width: this.dimensions.container.width-$('lightwindow_contents').getWidth()+this.options.contentOffset.width
        };

        // Set Sizes if we need too
        this._presetWindowSize(); // set the max size
        this._resizeWindowToFit(); // Even if the window is preset we still don't want it to go outside of the viewport

        if (!this.windowActive) {
            // Position the window
            $('lightwindow_container').setStyle({
                left: -(this.dimensions.container.width/2)+'px',
                top: -(this.dimensions.container.height/2)+'px'
            });
        }

        // We are ready, lets show this puppy off!
        this._displayLightWindow('block', 'visible');
        this._defaultAnimationHandler();
    },

    //
    //  This is the default animation handler for LightWindow
    //
    _defaultAnimationHandler : function() {
        var resized = false;
        var ratio = this.dimensions.container.width
            - $('lightwindow_contents').getWidth()
            + this.resizeTo.width
            + this.options.contentOffset.width;

        if (ratio != $('lightwindow_container').getWidth()) {
            new Effect.Parallel([
                    new Effect.Scale('lightwindow_contents', 100*(this.resizeTo.width/$('lightwindow_contents').getWidth()), {
                        scaleFrom: 100*($('lightwindow_contents').getWidth()/($('lightwindow_contents').getWidth()+(this.options.contentOffset.width))),
                        sync: true,
                        scaleY: false,
                        scaleContent: false
                    }),
                    new Effect.Scale('lightwindow_container', 100*(ratio/(this.dimensions.container.width)), {
                        sync: true,
                        scaleY: false,
                        scaleFromCenter: true,
                        scaleContent: false
                    })
                ], {
                    duration: this.duration,
                    delay: 0.25,
                    queue: {
                        position: 'end',
                        scope: 'lightwindowAnimation'
                    }
                }
            );
        }

        ratio = this.dimensions.container.height
            - $('lightwindow_contents').getHeight()
            // - $('lightwindow_title_bar').getHeight()
            - 50
            + this.resizeTo.height
            + this.options.contentOffset.height;

        if (ratio > $('lightwindow_container').getHeight()) {
            new Effect.Parallel([
//                    new Effect.Scale('lightwindow_contents', 100*((this.resizeTo.height - 50)/$('lightwindow_contents').getHeight()), {
//                        scaleFrom: 100*($('lightwindow_contents').getHeight()/($('lightwindow_contents').getHeight()+(this.options.contentOffset.height))),
//                        sync: true,
//                        scaleX: false,
//                        scaleContent: false
//                    }),
                    new Effect.Scale('lightwindow_container', 100*((this.resizeTo.height + 0)/$('lightwindow_container').getHeight()), {
                        sync: true,
                        scaleX: false,
                        scaleFromCenter: true,
                        scaleContent: false
                    })
                ], {
                    duration: this.duration,
                    afterFinish: function() {
                        $('lightwindow_contents').setStyle({
                            height: this.resizeTo.height - 50 + 'px'
                        });
                        if (this.dimensions.dataEffects.length > 0) {
                            new Effect.Parallel(this.dimensions.dataEffects, {
                                duration: this.duration,
                                queue: {position: 'end', scope: 'lightwindowAnimation'}
                            });
                        }
                    }.bind(this),
                    queue: {position: 'end', scope: 'lightwindowAnimation'}
                }
            );
            resized = true;
        }

        // We need to do our data effect since there was no resizing
        if (!resized && this.dimensions.dataEffects.length > 0) {
            new Effect.Parallel(this.dimensions.dataEffects, {
                    duration: this.duration,
                    beforeStart: function() {
                        if (this.containerChange.height != 0 || this.containerChange.width != 0) {
                            new Effect.MoveBy('lightwindow_container', this.containerChange.height, this.containerChange.width, {
                                transition: Effect.Transitions.sinoidal
                            });
                        }
                    }.bind(this),
                    queue: {position: 'end', scope: 'lightwindowAnimation'}
                }
            );
        }
    }
};

/**
 * Safari fix. See https://github.com/skeeto/skewer-mode/issues/14
 */
QuickviewGlobalEval = (function() {
    var eval0 = (function(original, Object) {
        try {
            return [eval][0]('Object') === original;
        } catch (e) {
            return false;
        }
    }(Object, false));
    if (eval0) {
        return function(expression) {
            return [eval][0](expression);
        };
    } else {
        return function(expression) { // Safari
            return eval.call(window, expression);
        };
    }
}());
