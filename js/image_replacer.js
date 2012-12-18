if (typeof (AC) === "undefined") {
    AC = {}
}
AC.ImageReplacer = Class.create({
    _defaultOptions: {
        listenToSwapView: true,
        filenameRegex: /(.*)(\.[a-z]{3}($|#.*|\?.*))/i,
        filenameInsert: "_☃x",
        ignoreCheck: /(^http:\/\/movies\.apple\.com\/|\/105\/|\/global\/elements\/quicktime\/|_(([2-9]|[1-9][0-9]+)x|nohires)(\.[a-z]{3})($|#.*|\?.*))/i,
        attribute: "data-hires",
        recursive: true,
        preload: false,
        checkExists: true,
        queueSize: 8,
        debug: false
    },
    _lowestPriority: 2,
    __replacedAttribute: "data-hires-status",
    initialize: function (b) {
        if (typeof b !== "object") {
            b = {}
        }
        this.options = Object.extend(Object.clone(this._defaultOptions), b);
        this.options.lowestPriority = this._lowestPriority;
        this.options.replacedAttribute = this.__replacedAttribute;
        if ((this.options.debug !== true) && ((typeof AC.Detector !== "undefined" && AC.Detector.isMobile()) || (AC.ImageReplacer.devicePixelRatio() <= 1))) {
            return
        }
        if (this.options.debug === true) {
            AC.ImageReplacer._devicePixelRatio = 2
        }
        Object.synthesize(this);
        if (windowHasLoaded) {
            this.__setup()
        } else {
            var a = this.__setup.bind(this);
            Event.observe(window, "load", a)
        }
    },
    log: function () {
        if (this.__canLog !== false && this.options.debug === true) {
            var a = $A(arguments);
            if (a.length < 2) {
                a = a[0]
            }
            try {
                console.log(a)
            } catch (b) {
                this.__canLog = false
            }
        }
    },
    isReplaceable: function (c) {
        if ((c.getAttribute(this.options.attribute) === "false") || (c.up("[" + this.options.attribute + '="false"]') && this.options.recursive === true)) {
            return false
        }
        var a = (typeof c.responsiveImageObject === "undefined");
        if (c.tagName.toLowerCase() === "img") {
            return a
        } else {
            if (c.hasClassName("imageLink") && c.tagName.toLowerCase() === "a") {
                return true
            } else {
                var b = AC.ImageReplacer.Image.removeCSSURLSyntax(c.getStyle("background-image"));
                return (((b.match(AC.ImageReplacer.normalImageTypeRegex) !== null) && a))
            }
        }
    },
    potentialElements: function (g, f) {
        if (typeof g === "undefined") {
            g = document.body
        }
        var b = $(g).getElementsBySelector("[" + this.options.attribute + "]");
        var a;
        var c = function (h) {
                if (typeof f === "undefined") {
                    return typeof g.up("[" + h + "]") !== "undefined"
                } else {
                    return f.getAttribute(h) !== null || typeof f.up("[" + h + "]") !== "undefined"
                }
            };
        if (this.options.recursive === true) {
            if (g !== document.body && c(this.options.attribute)) {
                b = b.concat(g)
            }
            a = [];
            var e = this.isReplaceable.bind(this);
            var d = function (h) {
                    if (e(h)) {
                        a.push(h)
                    }
                    a = a.concat(this.replaceableElementsWithinElement(h))
                }.bind(this);
            $A(b).each(d)
        } else {
            a = b
        }
        return a
    },
    prioritize: function (a) {
        var c = [];
        var d = function (f) {
                if (typeof f.responsiveImageObject !== "undefined") {
                    return
                }
                var e = new AC.ImageReplacer.Image(f, this.options);
                if (e.hiResSrc() !== null && !e.isHiRes()) {
                    if (typeof c[e.priority()] === "undefined") {
                        c[e.priority()] = []
                    }
                    c[e.priority()].push(e)
                } else {
                    if (e.hiResSrc() && e.isHiRes()) {
                        e.setStatus("already-hires")
                    } else {
                        e.setStatus("not-replaceable")
                    }
                }
            }.bind(this);
        $A(a).each(d);
        var b;
        for (b = this._lowestPriority;
        b >= 0; b--) {
            if (typeof c[b] === "undefined") {
                c[b] = []
            }
        }
        return c.flatten()
    },
    replaceableElementsWithinElement: function (d) {
        d = $(d);
        var a = this;
        var b = d.descendants();
        var c = this.isReplaceable.bind(this);
        return b.findAll(c)
    },
    addToQueue: function (a) {
        if (typeof this.__queues === "undefined") {
            this.__queues = $A()
        }
        if (this.__queues.length === 0) {
            this.__queues.push($A())
        }
        this.__queues[this.__queues.length - 1].push(a)
    },
    replace: function () {
        if (typeof this.__queues === "undefined") {
            this.__queues = $A()
        }
        if (this.__queues.length > 0 && this.__queues[0].length > 0) {
            this.__queues.push($A());
            var a = this.replace.bind(this);
            this.__replaceNextQueue(a)
        } else {
            this.log("There are no queues to replace")
        }
    },
    __replaceNextQueue: function (d) {
        var a = this.__queues[0].reverse();
        var b = this.log.bind(this);
        this.__queues.splice(0, 1);
        var c = function () {
                b("Found " + a.length + " elements to replace.");
                var e = function () {
                        var f = a.pop();
                        if (!f) {
                            b("No more images to start replacing.");
                            if (typeof d === "function") {
                                d()
                            }
                            d = Prototype.emptyFunction;
                            return
                        }
                        f.replace(function (g) {
                            b("Replaced image.", f.hiResSrc(), "status: " + f.status());
                            e()
                        })
                    };
                $R(0, this.options.queueSize - 1).each(e)
            }.bind(this);
        window.setTimeout(c, 10)
    },
    __respondToSwapView: function (c) {
        var b = c.event_data.data.incomingView.content;
        var a = c.event_data.data.sender.view.view();
        var d = this.addToQueue.bind(this);
        this.prioritize(this.potentialElements(b, a)).each(d);
        this.replace()
    },
    __setup: function () {
        if (this.options.listenToSwapView === true && "Listener" in Event && typeof AC.ViewMaster !== "undefined") {
            this.respondToSwapView = this.__respondToSwapView.bindAsEventListener(this);
            Event.Listener.listenForEvent(AC.ViewMaster, "ViewMasterDidShowNotification", false, this.respondToSwapView)
        }
        var a = this.addToQueue.bind(this);
        this.prioritize(this.potentialElements()).each(a);
        this.replace()
    }
});
AC.ImageReplacer.normalImageTypeRegex = /(\.jpg($|#.*|\?.*)|\.png($|#.*|\?.*)|\.gif($|#.*|\?.*))/;
AC.ImageReplacer.devicePixelRatio = function () {
    if (typeof AC.ImageReplacer._devicePixelRatio !== "undefined") {
        return AC.ImageReplacer._devicePixelRatio
    }
    if ("devicePixelRatio" in window && window.devicePixelRatio > 1) {
        return AC.ImageReplacer._devicePixelRatio = 2
    } else {
        return AC.ImageReplacer._devicePixelRatio = 1
    }
};
AC.ImageReplacer.Image = Class.create(Object.clone(AC.Synthesize), {
    initialize: function (b, a) {
        if (Object.isElement(b)) {
            this._el = b;
            this._tagName = this._el.tagName.toLowerCase();
            this.options = Object.extend(Object.clone(a), AC.ImageReplacer.Image.convertParametersToOptions(this.src()));
            this.setStatus("considered");
            this.synthesize()
        }
    },
    __synthesizeSetter: Prototype.emptyFunction,
    preload: function (b) {
        if (this._isPreloaded) {
            return true
        }
        this.setStatus("loading");
        var a = new Element("img");
        a.observe("load", function () {
            this._isPreloaded = true;
            this.width = a.width;
            this.height = a.height;
            this.setStatus("replaced");
            if (typeof b === "function") {
                b()
            }
        }.bind(this));
        a.observe("error", function () {
            this.setStatus("404");
            this._exists = false;
            if (typeof b === "function") {
                b()
            }
        }.bind(this));
        a.src = this.hiResSrc()
    },
    replace: function (b) {
        var a = this.replace.bind(this, b);
        if (this._exists === false) {
            this.setStatus("404");
            if (typeof b === "function") {
                b(false)
            }
            return
        }
        if (this.options.checkExists === true && typeof this._exists === "undefined") {
            return this.requestHeaders(a)
        }
        if (this.isImageLink()) {
            this._el.setAttribute("href", this.hiResSrc());
            this.setStatus("replaced");
            if (typeof b === "function") {
                b(true)
            }
        } else {
            if ((this.options.preload === true || this._tagName !== "img") && this._isPreloaded !== true) {
                return this.preload(a)
            }
            if (this._tagName === "img") {
                this._el.setAttribute("src", this.hiResSrc());
                if ((this.options.preload !== true)) {
                    this.setStatus("loading");
                    this._el.observe("load", function (c) {
                        this.setStatus("replaced");
                        if (typeof b === "function") {
                            b(true)
                        }
                    }.bindAsEventListener(this));
                    this._el.observe("error", function (c) {
                        this.setStatus("404");
                        this._el.setAttribute("src", this.src());
                        if (typeof b === "function") {
                            b(false)
                        }
                    }.bindAsEventListener(this))
                }
            } else {
                this._el.setStyle("background-image:url(" + this.hiResSrc() + ");");
                this._el.setStyle("background-size:" + (this.width / AC.ImageReplacer.devicePixelRatio()) + "px " + (this.height / AC.ImageReplacer.devicePixelRatio()) + "px;");
                if (typeof b === "function") {
                    b(true)
                }
            }
        }
        this._el.responsiveImageObject = this;
        this.synthesize()
    },
    requestHeaders: function (c) {
        var a = this;
        if (typeof a._headers === "undefined") {
            var b = new XMLHttpRequest();
            var a = this;
            src = this.hiResSrc().replace(/^http:\/\/.*\.apple\.com\//, "/");
            b.open("HEAD", src, true);
            b.onreadystatechange = function () {
                if (b.readyState == 4) {
                    if (b.status === 200) {
                        a._exists = true;
                        var f = b.getAllResponseHeaders();
                        a._headers = {
                            src: src
                        };
                        var d, e;
                        f = f.split("\r");
                        for (d = 0;
                        d < f.length; d++) {
                            e = f[d].split(": ");
                            if (e.length > 1) {
                                a._headers[e[0].replace("\n", "")] = e[1]
                            }
                        }
                    } else {
                        a._exists = false;
                        a._headers = null
                    }
                    if (typeof c === "function") {
                        c(a._headers, a)
                    }
                }
            };
            b.send(null)
        } else {
            c(a._headers, a)
        }
    },
    requestFileSize: function (c) {
        var b = this;
        if (typeof b._fileSize === "undefined") {
            var a = function (d) {
                    b._fileSize = parseFloat(d["Content-Length"]) / 1000;
                    if (typeof c === "function") {
                        c(b._fileSize, b)
                    }
                };
            this.requestHeaders(a)
        } else {
            c(b._fileSize, b)
        }
    },
    src: function () {
        if (typeof this._src !== "undefined") {
            return this._src
        }
        if (this.isImageLink()) {
            this._src = this._el.getAttribute("href")
        } else {
            if (this._tagName === "img") {
                this._src = this._el.getAttribute("src")
            } else {
                this._src = AC.ImageReplacer.Image.removeCSSURLSyntax(this._el.getStyle("background-image"));
                if (this._src === "none") {
                    return this._src = ""
                }
            }
        }
        return this._src
    },
    hiResSrc: function () {
        if (typeof this._hiResSrc !== "undefined") {
            return this._hiResSrc
        }
        var a;
        if (typeof this.options.hiresFormat === "string") {
            a = this.src().match(/^(.*)((\.[a-z]{3})($|#.*|\?.*))/i);
            if (a !== null && a.length > 1) {
                return this._hiResSrc = a[1] + "." + this.options.hiresFormat + (a[4] || "")
            }
        }
        a = this.src().match(this.options.filenameRegex);
        if (a === null) {
            return this._hiResSrc = null
        } else {
            return this._hiResSrc = a[1] + this.options.filenameInsert.replace("☃", AC.ImageReplacer.devicePixelRatio()) + a[2]
        }
    },
    isHiRes: function () {
        if (this._isHiRes === true) {
            return this._isHiRes
        }
        if (this.status() === "replaced") {
            return this._isHiRes = true
        }
        var a = this.src();
        if (a.match(AC.ImageReplacer.normalImageTypeRegex) === null) {
            return this._isHiRes = true
        }
        if (a.match(this.options.ignoreCheck) !== null) {
            return this._isHiRes = true
        }
        this._isHiRes = false
    },
    isImageLink: function () {
        if (typeof this._isImageLink !== "undefined") {
            return this._isImageLink
        }
        return this._isImageLink = (this._el.hasClassName("imageLink") && this._tagName === "a")
    },
    priority: function () {
        if (typeof this._priority !== "undefined") {
            return this._priority
        }
        if (this.options.recursive && this._el.hasAttribute(this.options.attribute) === false) {
            var a = this._el.up("[" + this.options.attribute + "]");
            if ( !! a) {
                this._priority = parseInt(a.getAttribute(this.options.attribute))
            } else {
                this._priority = this.options.lowestPriority
            }
        } else {
            this._priority = parseInt(this._el.getAttribute(this.options.attribute))
        }
        if (isNaN(this._priority) || this._priority > this.options.lowestPriority) {
            this._priority = this.options.lowestPriority
        } else {
            if (this._priority < 0) {
                this._priority = 0
            }
        }
        return this._priority
    },
    setStatus: function (a) {
        if (typeof a === "string") {
            this._status = a;
            this._el.setAttribute(this.options.replacedAttribute, a)
        }
    },
    status: function () {
        return this._el.getAttribute(this.options.replacedAttribute)
    }
});
AC.ImageReplacer.Image.removeCSSURLSyntax = function (a) {
    if (typeof a === "string" && typeof a.replace === "function") {
        return a.replace(/^url\(/, "").replace(/\)$/, "")
    }
    return ""
};
AC.ImageReplacer.Image.convertParametersToOptions = function (b) {
    if (typeof b === "string" && typeof b.toQueryParams === "function") {
        var a = b.toQueryParams(),
            c;
        for (c in a) {
            if (a.hasOwnProperty(c)) {
                a[c.camelize()] = a[c]
            }
        }
        return a
    }
    return {}
};
AC.ImageReplacer.autoInstance = new AC.ImageReplacer();
var windowHasLoaded = false;
Event.observe(window, "load", function () {
    windowHasLoaded = true
});