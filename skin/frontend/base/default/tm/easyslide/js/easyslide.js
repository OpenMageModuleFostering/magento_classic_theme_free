document.observe('dom:loaded', function() {
    $$('.easyslide-link').each(function(el) {
        el.observe('click', function(e) {
            if (this.hasClassName('target-self')) {
                return true;
            }

            e.stop();
            var options = '';
            if (this.hasClassName('target-popup')) {
                options = 'width=600,height=400';
            }
            window.open(this.href, this.up().id, options);
        });
    });
});

/* Make easyslider works good on the mobile devices with various screen width */
var EasysliderMobile = Class.create();
EasysliderMobile.prototype = {
    initialize: function(slider) {
        this.slider = slider;

        var self = this;
        setTimeout(function() {
            self.updateSize();
        }, 500);

    },

    updateSize: function() {
        var slider = this.slider,
            ratio  = parseInt(slider.scroller.getStyle('width')) / parseInt(slider.scroller.getStyle('height')),
            width  = slider.wrapper.up().getWidth();

        var padding = parseFloat(slider.wrapper.getStyle('padding-left'))
            + parseFloat(slider.wrapper.getStyle('padding-right'));

        width -= padding;

        var clone = new Image();
        clone.src = slider.sections[0].down('img').src;
        originalWidth = clone.width;
        if (!originalWidth) {
            originalWidth = parseInt(slider.sections[0].getStyle('width'));
        }

        width  = (width > originalWidth ? originalWidth : width);
        height = width / ratio;

        slider.sectionWidth = width;
        slider.wrapper.setStyle({
            width: width + 'px',
            height: height + 'px'
        });
        slider.scroller.setStyle({
            width: width + 'px',
            height: height + 'px'
        });
        slider.sections.each(function(el) {
            el.setStyle({
                width: width + 'px',
                height: height + 'px'
            });
            if (el.getStyle('left') && el.getStyle('left') !== '0px') {
                el.setStyle({
                    left: -width + 'px'
                });
            }
            el.down('img').setStyle({
                width: width + 'px'
            });
        });
    }
};

/* Don't forget about screen orientation change */
var mobileSliders = [];
document.observe("easyslide:init", function(event) {
    mobileSliders.push(new EasysliderMobile(event.memo.slider));
});

if ('addEventListener' in window) {
    var supportsOrientationChange = "onorientationchange" in window,
        orientationEvent = supportsOrientationChange ? "orientationchange" : "resize",
        sliderResizeTimer;
    window.addEventListener(orientationEvent, function() {
        clearTimeout(sliderResizeTimer);
        sliderResizeTimer = setTimeout(function() {
            mobileSliders.each(function(mobileSlider) {
                mobileSlider.updateSize();
            });
        }, 500);
    }, false);
}

/**
 * @author Bruno Bornsztein <bruno@missingmethod.com>
 * @copyright 2007 Curbly LLC
 * @package Glider
 * @license MIT
 * @url http://www.missingmethod.com/projects/glider/
 * @version 0.0.3
 * @dependencies prototype.js 1.5.1+, effects.js
 */
/*  Thanks to Andrew Dupont for refactoring help and code cleanup - http://andrewdupont.net/  */

Easyslider = Class.create();
Object.extend(Object.extend(Easyslider.prototype, Abstract.prototype), {
    initialize: function(wrapper, options){
        this.handStopped = false;
        this.animating = false;
        this.wrapper = $(wrapper);
        this.scroller = this.wrapper.down('div.scroller');
        this.contentDiv = this.scroller.down('div');
        this.current = $(this.contentDiv.children[0].id);
        this.sectionWidth = this.contentDiv.children[0].getWidth();
        this.slideRelations = {};

        this.options = Object.extend({
            effectType: 'mosaic',
            duration: 3.0,
            frequency: 3,
            eRows: Prototype.Browser.IE ? 3 : 6,
            eCols: Prototype.Browser.IE ? 6 : 12,
            eColor: '#FFFFFF'
        }, options || {});

        this.effects = {
            'scroll'        : this.scroll,
            'speedscroll'   : this.speedscroll,
            'fade'          : this.fade,
            'blend'         : this.blend,
            'mosaic'        : this.mosaic
        };

        this.sections = this.wrapper.getElementsBySelector('div.section');
        $$('body').first().fire('easyslide:init', { 'slider': this });

        for (var i = 0; i < this.sections.length; i++) {
            var nextSibling = this.sections[i].nextSiblings()[0];
            if (nextSibling){
                this.slideRelations[this.sections[i].id] = nextSibling.id;
            } else {
                this.slideRelations[this.sections[i].id] = this.sections[0].id;
            }
            this.effects[this.options.effectType].bind(this)().prepare(this.sections[i], i);
        }

        this.events = {
            mouseover: this.pause.bind(this),
            mouseout: this.resume.bind(this)
        };

        this.addObservers();

        if (this.options.autoGlide) {
            this.start();
        } else {
            this.handStopped = true;
        }
    },

    scroll: function() {
        var glider = this;
        return {
            prepare: function(el, i) {
                if (i > 0) {
                    $(el).setStyle('left: ' + glider.sectionWidth + 'px;');
                } else {
                    glider.toggleControl($$('a[href="#' + el.id + '"]')[0]);
                }
            },
            animate: function(elementIdToShow, direction) {
                $(elementIdToShow).setStyle('left: ' + (direction === 'normal' ? glider.sectionWidth : -glider.sectionWidth) + 'px;');

                new Effect.Parallel([
                    new Effect.Move(elementIdToShow, {
                        sync: true,
                        x: 0,
                        y: 0,
                        mode: 'absolute'
                    }),
                    new Effect.Move(glider.current.id, {
                        sync: true,
                        x: direction === 'normal' ? -glider.sectionWidth : glider.sectionWidth,
                        y: 0,
                        mode: 'absolute'
                    })
                ], {
                    duration: glider.options.duration,
                    afterFinish: function() {
                        glider.setAnimating(false);
                    }.bind(glider)
                });

            }
        };
    },

    speedscroll: function() {
        var glider = this;
        return {
            prepare: function(el, i) {
                if (i > 0) {
                    $(el).setStyle('left: ' + glider.sectionWidth + 'px;');
                } else {
                    glider.toggleControl($$('a[href="#' + el.id + '"]')[0]);

                }
            },
            animate: function(elementIdToShow, direction) {
                $(elementIdToShow).setStyle('left: ' + (direction === 'normal' ? glider.sectionWidth : -glider.sectionWidth) + 'px;');
                $(elementIdToShow).setStyle({zIndex: 5});
                $(glider.current.id).setStyle({zIndex: 1});
                var currentId = glider.current.id;

                new Effect.Move(elementIdToShow, {
                    x: 0,
                    y: 0,
                    mode: 'absolute',
                    transition: Effect.Transitions.linear,
                    duration: glider.options.duration / 2,
                    afterFinish: function() {
                        moveCurrent.cancel();
                        $(currentId).setStyle('left: ' + (direction === 'normal' ? -glider.sectionWidth : glider.sectionWidth) + 'px;');
                        glider.setAnimating(false);
                    }
                });

                var moveCurrent = new Effect.Move(glider.current.id, {
                    x: direction === 'normal' ? -glider.sectionWidth : glider.sectionWidth,
                    y: 0,
                    mode: 'absolute',
                    transition: Effect.Transitions.linear,
                    duration: glider.options.duration
                });
            }
        };
    },

    fade: function() {
        var glider = this;
        return {
            prepare: function(el, i) {
                if (i > 0) {
                    el.setOpacity(0);
                    $(el).setStyle({ zIndex : '0' });
                } else {
                    glider.toggleControl($$('a[href="#' + el.id + '"]')[0]);
                    $(el).setStyle({ zIndex : '998' });
                    $$('.easyslide-controls-wrapper')[0].setStyle({ zIndex : '999' });
                }
            },
            animate: function(elementIdToShow, direction) {
                $(elementIdToShow).setStyle({ zIndex : '998' });
                $(glider.current.id).setStyle({ zIndex : '0' });

                new Effect.Opacity(glider.current.id, {
                    duration: glider.options.duration,
                    from: 1.0,
                    to: 0.0,
                    afterFinish: function() {
                        new Effect.Opacity(elementIdToShow, {
                            duration: glider.options.duration,
                            from: 0.0,
                            to: 1.0,
                            afterFinish: function() {
                                glider.setAnimating(false);
                            }.bind(glider)
                        });

                    }.bind(glider)
                });
            }
        };
    },

    blend: function() {
        var glider = this;
        return {
            prepare: function(el, i) {
                if (i > 0) {
                    el.setOpacity(0);
                    $(el).setStyle({ zIndex : '0' });
                } else {
                    glider.toggleControl($$('a[href="#' + el.id + '"]')[0]);
                    $(el).setStyle({ zIndex : '998' });
                    $$('.easyslide-controls-wrapper')[0].setStyle({ zIndex : '999' });
                }
            },
            animate: function(elementIdToShow, direction) {
                $(elementIdToShow).setStyle({ zIndex : '998' });
                $(glider.current.id).setStyle({ zIndex : '0' });
                new Effect.Parallel([
                    new Effect.Opacity(glider.current.id, {
                        sync: true,
                        duration: glider.options.duration,
                        from: 1.0,
                        to: 0.0
                    }),
                    new Effect.Opacity(elementIdToShow, {
                        sync: true,
                        duration: glider.options.duration,
                        from: 0.0,
                        to: 1.0
                    })
                ], {
                    duration: glider.options.duration,
                    afterFinish: function() {
                        glider.setAnimating(false);
                    }.bind(glider)
                });
            }
        };
    },

    mosaic: function() {
        var glider = this;
        var delayedAppear = function(eSquare) {
            var opacity = Math.random();
            new Effect.Parallel([
                new Effect.Appear ( eSquare, {from: 0, to: opacity, duration: this.options.duration} ),
                new Effect.Appear ( eSquare, {from: opacity, to: 0, duration: this.options.duration/1.25} )
            ], {sync: false});
        };
        return {
            prepare: function(el, i) {
                if (i > 0) {
                    el.setStyle({ zIndex : 0 });
                    el.hide();
                } else {
                    el.setStyle({ zIndex : 999 });
                    glider.toggleControl($$('a[href="#' + el.id + '"]')[0]);
                }
                if (i == (glider.sections.length - 1)) {
                    glider.eSquares = [];
                    var elDimension = el.getDimensions();
                    var elWidth     = elDimension.width;
                    var elHeight    = elDimension.height;

                    var sqWidth     = elWidth / glider.options.eCols;
                    var sqHeight    = elHeight / glider.options.eRows;

                    $R(0, glider.options.eCols-1).each(function(col) {
                        glider.eSquares[col] = [];
                        $R(0, glider.options.eRows-1).each(function(row) {
                            var sqLeft = col * sqWidth;
                            var sqTop  = row * sqHeight;
                            glider.eSquares[col][row] = new Element('div').setStyle({
                                opacity         : 0,
                                backgroundColor : glider.options.eColor,
                                position        : 'absolute',
                                zIndex          : 5,
                                left            : sqLeft + 'px',
                                top             : sqTop + 'px',
                                width           : sqWidth + 'px',
                                height          : sqHeight + 'px'
                            });

                            el.up('div').insert(glider.eSquares[col][row]);
                        }.bind(glider));
                    }.bind(glider));
                }
            },

            animate: function(elementIdToShow, direction) {
                $(elementIdToShow).setStyle({ zIndex : 999 });
                $(glider.current.id).setStyle({ zIndex : 0 });
                new Effect.Parallel([
                    new Effect.Fade(glider.current.id, {sync: true}),
                    new Effect.Appear(elementIdToShow, {sync: true})
                ], {
                    duration: glider.options.duration,
                    afterFinish: function() {
                        glider.setAnimating(false);
                    }.bind(glider)
                });
                $R(0, glider.options.eCols-1).each(function(col) {
                    $R(0, glider.options.eRows-1).each(function(row) {
                        var eSquare = glider.eSquares[col][row];
                        var delay = Math.random() * (glider.options.duration / 3) * 1000;
                        setTimeout(delayedAppear.bind(glider, eSquare), delay);
                    }.bind(this));
                }.bind(this));
            }
        };
    },

    setAnimating: function(flag) {
        this.animating = flag;
        if (flag) {
            $$('.easyslide-controls-wrapper')[0].addClassName('disabled');
        } else {
            $$('.easyslide-controls-wrapper')[0].removeClassName('disabled');
        }
    },

    addObservers: function(){
        this.wrapper.observe('mouseover', this.events.mouseover);
        this.wrapper.observe('mouseout', this.events.mouseout);

        var descriptions = this.wrapper.getElementsBySelector('div.sliderdescription');
        descriptions.invoke('observe', 'mouseover', this.makeActive);
        descriptions.invoke('observe', 'mouseout', this.makeInactive);

        //Nubmbers
        var controls = this.wrapper.getElementsBySelector('div.easyslide-controls a.easyslide-num');
        controls.invoke('observe', 'click', this.numClick.bind(this));

        //Arrows
        var stop = this.wrapper.getElementsBySelector('div.easyslide-controls a.easyslidestop');
        stop.invoke('observe', 'click', this.stop.bind(this));

        var play = this.wrapper.getElementsBySelector('div.easyslide-controls a.easyslideplay');
        play.invoke('observe', 'click', this.start.bind(this));

        var prev = this.wrapper.getElementsBySelector('div.easyslide-controls a.easyslideprev');
        prev.invoke('observe', 'click', this.previous.bind(this));

        var next = this.wrapper.getElementsBySelector('div.easyslide-controls a.easyslidenext');
        next.invoke('observe', 'click', this.next.bind(this));
    },

    numClick: function(event){
        var element = Event.findElement(event, 'a'); /*clicked link*/
        var nextElementId = element.href.split('#')[1];
        var direction = 'normal';
        for (var i in this.slideRelations) {
            if (i === this.current.id) {
                direction = 'normal';
                break;
            }
            if (i === nextElementId) {
                direction = 'reverse';
                break;
            }
        }
        this.animate(nextElementId, direction);
        Event.stop(event);
    },

    animate: function(elementIdToShow, direction){
        if (this.animating || this.current.id == elementIdToShow) {
            return;
        }
        this.setAnimating(true);
        this.toggleControl($$('a[href="#' + elementIdToShow + '"]')[0]);

        this.effects[this.options.effectType].bind(this)().animate(elementIdToShow, direction);

        this.current = $(elementIdToShow);
    },

    next: function(event){
        var nextMove = '';
        nextMove = this.slideRelations[this.current.id];
        this.animate(nextMove, 'normal');
        if (event) {
            Event.stop(event);
        }
    },

    previous: function(event){
        var prevMove = '';
        for (var i in this.slideRelations) {
            if (this.slideRelations[i] == this.current.id) {
                prevMove = i;
                break;
            }
        }
        this.animate(prevMove, 'reverse');
        if (event) {
            Event.stop(event);
        }
    },

    makeActive: function(event){
        var element = Event.findElement(event, 'div');
        element.addClassName('active');
    },

    makeInactive: function(event){
        var element = Event.findElement(event, 'div');
        element.removeClassName('active');
    },

    toggleControl: function(el){
        if (!el) return false;
        $$('.easyslide-controls a').invoke('removeClassName', 'active');
        el.addClassName('active');
    },

    stop: function(event){
        this.handStopped = true;
        clearTimeout(this.timer);
        Event.stop(event);
    },

    start: function(event){
        this.handStopped = false;
        this.periodicallyUpdate();
        if (event) {
            Event.stop(event);
        }
    },

    pause: function(event){
        if (!this.handStopped) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        Event.stop(event);
    },

    resume: function(event){
        if (!this.handStopped) {
            this.periodicallyUpdate();
        }
    },

    periodicallyUpdate: function(){
        if (this.timer != null) {
            clearTimeout(this.timer);
            this.next();
        }
        this.timer = setTimeout(this.periodicallyUpdate.bind(this), this.options.frequency * 1000);
    }
});
