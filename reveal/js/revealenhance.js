
window.revealenhance = function () {
    'use strict';
    if (!NodeList.prototype.forEach) {
        console.log("adding NodeList.prototype.forEach");
        NodeList.prototype.forEach = Array.prototype.forEach;
    }
    if (!NodeList.prototype[Symbol.iterator]) {
        console.log("adding NodeList.prototype[Symbol.iterator]");
        NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
    }
    const isFullScreen = function () {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    };
    const toggleFullScreen = function (value) {
        if (value == undefined) {
            value = !isFullScreen();
        }
        if (value) {
            var element = document.documentElement;

            // Check which implementation is available
            var requestMethod = element.requestFullscreen ||
                element.webkitRequestFullscreen ||
                element.webkitRequestFullScreen ||
                element.mozRequestFullScreen ||
                element.msRequestFullscreen;

            if (requestMethod) {
                requestMethod.apply(element);
            }
        } else {
            (document.webkitExitFullscreen || document.mozCancelFullScreen).apply(document);
        }
    };
    const create = ef.create;
    var data = function (arg) {
        return { $data: arg };
    };
    var tlines = create(`
>div
	#style = display: inline-block; text-align: left;
	+lines
`);
    var tscrtext = (function () {
        var tmpl = create(`
>div.scrtext-out
	#style = overflow-y: hidden; height: calc(1.2*2.11em); text-align: center; margin-bottom: 10px;
	>h2.scrtext
		#style = white-space: pre; position:relative; top: calc({{top=0}}*-1.2em); transition: top .7s cubic-bezier(0.495, 0.165, 0.200, 1.025); {{tr}}
		.{{text}}
`);
        var w = function (text, interval) {
            var that = this;
            if (typeof text == 'string') {
                text = text.split('\n');
            }
            var cur = text[0];
            var index = 1;
            var step = () => {
                var next = text[index++];
                if (index >= text.length)
                    index = 0;
                ef.bundle(() => {
                    this.$data.tr = 'transition: none !important;';
                    this.$data.top = 0;
                    this.$data.text = cur + '\n' + next;
                });
                ef.exec(true);
                cur = next;
                setTimeout(() => {
                    this.$data.tr = '';
                    this.$data.top = 1;
                    ef.exec(true);
                }, interval / 5);
                // if(this.$data.top + 1 < text.length){
                // 	this.$data.top++;
                // 	this.$data.dur = 0.7;
                // }
                // else{
                // 	this.$data.dur = 0.7;
                // 	this.$data.top = 0;
                // }
            }
            this.setInterval = (interval) => {
                if (this.timer) {
                    window.clearInterval(this.timer);
                    this.timer = null;
                }
                if (interval)
                    this.timer = window.setInterval(step, interval);
            };
            this.setInterval(interval);
            tmpl.apply(this, [{ $data: { text: cur + '\n' + cur, top: 0 } }]);
        };
        w.prototype = tmpl.prototype;
        return w;
    })();

    var tkvline = (function () {
        var tmpl = create(`
>div
	#style = white-space: pre;
	.{{text}}{{value}}
`);
        var w = function (text, value, update) {
            var that = this;
            if (typeof (value) == 'function') {
                update = value;
                value = update({ state: that });
            }
            if (update) {
                var realUpdate = function () {
                    var value = update({ state: that });
                    if (typeof (value) == 'number') {
                        value = value.toFixed(3);
                    }
                    that.$data.value = value;
                }
            }
            tmpl.apply(this, [{ $data: { text: text, value: value }, $methods: { update: realUpdate }, update: realUpdate }]);
        };
        w.prototype = tmpl.prototype;
        return w;
    })();
    var tswitch = (function () {
        var tmpl = create(
            `
>div
	#style = display: inline-block; margin: 10px;
	>label.switch
		#data-prevent-swipe
		>input
			#type=checkbox
			%checked = {{checked}}
		>span.slider.round
	REM >br
	>div
		#style = margin-right: {{mr=0}};
		.{{text}}
`)
        var con = function (initstate, changed, text) {
            var that = this;
            if (!text) {
                text = '';
            }
            tmpl.apply(this, [{
                $data: { checked: initstate, text: text }, $methods: {
                    changed: () => {
                        var b = that.$data.checked;
                    }
                }
            }]);
            // if(text){
            // 	this.$data.mr = '1em';
            // }
            this.$subscribe('checked', ({ value }) => {
                // console.log('sw changed ' + value);
                changed(value);
            });
            changed(initstate);
        };
        con.prototype = tmpl.prototype;
        return con;
    })();
    var tpanel = create(`
>div.panel-out
    >div.panel
        .emmmmm
`);
    var getLs = () => {
        try {
            return window.localStorage;
        } catch (error) {
            console.log(error);
        }
    }
    var strg = function (name) {
        this.name = name;
        this.loaded = false;
        this.data = {};
        if (getLs()) {
            this.save = () => {
                window.localStorage.setItem(name, JSON.stringify(this.data));
            };
            this.load = () => {
                var json = window.localStorage.getItem(name);
                this.loaded = false;
                if (json != null) {
                    try {
                        this.data = JSON.parse(json);
                        this.loaded = true;
                    } catch (e) {
                        console.log(e);
                    }
                }
            };
        } else {
            this.save = this.load = () => { };
        }
        this.load();
    };
    var optstrg = new strg('revealoptions');
    if (!optstrg.loaded) {
        optstrg.data = {
            bgdim: true,
            bgblur: true
        };
    }

    String.prototype.replaceAll = function(search, replacement) {
        return this.replace(new RegExp(search, 'g'), replacement);
    };
    for (const ele of document.querySelectorAll('[data-blanks]')) {
        ele.innerHTML = ele.innerHTML.replaceAll('\\[', '<span class="blank-line"><span data-frag ' + ele.dataset['blanks'] + '>').replaceAll('\\]', "</span></span>");
    }

    var fragnum = 0;
    var isingroup = false;
    var shortClasses = {
        'fl': 'fade-left',
        'dya-center': ['flexbox-h-center', 'stretch']
    };
    var fragments = document.querySelectorAll('[data-frag]');
    for (const fragment of fragments) {
        var classList = fragment.classList;
        var dataset = fragment.dataset;
        classList.add('fragment');
        console.log('frag', fragment);
        var dfrag = dataset['frag'];
        var splits = dfrag.split(/\, ?/);
        for (const v of splits) {
            if (v == '1' || v == 'h') {
                var parent = fragment.parentNode;
                var outer = document.createElement('div');
                outer.className = 'frag-outer';
                parent.replaceChild(outer, fragment);
                outer.appendChild(fragment);
                outer.style.height = 0;
            } else if (v == 'w' || v == 'wi') {
                var parent = fragment.parentNode;
                var outer = document.createElement('div');
                outer.className = 'frag-outer';
                parent.replaceChild(outer, fragment);
                outer.appendChild(fragment);
                if (v == 'wi') {
                    outer.style.display = 'inline-block';
                }
                outer.style.width = 0;
                outer.style.overflow = 'display';
            } else if (v == 'd') {
                fragment.classList.add('frag-display');
            } else if (v == 'begin') {
                isingroup = true;
            } else if (v == 'end') {
                isingroup = false;
            } else if (shortClasses[v]) {
                classList.add(shortClasses[v]);
            }
        }
        if (!dataset.fragmentIndex) {
            dataset.fragmentIndex = fragnum.toString();
            if (!isingroup) {
                fragnum++;
            }
        }
    }
    const onFragmentShown = function (event) {
        for (var fragment of event.fragments) {
            console.log('shown', fragment);
            var dfrag = fragment.dataset['frag'];
            var splits = dfrag.split(/\, ?/);
            for (const v of splits) {
                if (v == '1' || v == 'h') {
                    // console.log('shown', fragment, fragment.offsetWidth);
                    var outer = fragment.parentNode;
                    if (outer.matches('section[hidden] *')) {
                        outer.style.height = null;
                    } else {
                        outer.style.height = fragment.offsetHeight + 'px';
                    }
                } else if (v == 'w' || v == 'wi') {
                    // console.log('shown', fragment, fragment.offsetWidth);
                    var outer = fragment.parentNode;
                    if (outer.matches('section[hidden] *')) {
                        outer.style.width = null;
                    } else {
                        outer.style.width = fragment.offsetWidth + 'px';
                    }
                }
            }
        }
    };
    const onFragmentHidden = function (event) {
        for (var fragment of event.fragments) {
            // console.log('hidden', fragment);
            var dfrag = fragment.dataset['frag'];
            var splits = dfrag.split(/\, ?/);
            for (const v of splits) {
                if (v == '1' || v == 'h') {
                    fragment.parentNode.style.height = 0;
                } else if (v == 'w' || v == 'wi') {
                    fragment.parentNode.style.width = 0;
                }
            }
        }
    };
    Reveal.addEventListener('fragmentshown', onFragmentShown);
    Reveal.addEventListener('fragmenthidden', onFragmentHidden);
    for (const key in shortClasses) {
        if (shortClasses.hasOwnProperty(key)) {
            const val = shortClasses[key];
            var selected = document.querySelectorAll('.all-' + key + ' *, ' + key);
            var blackStr = '.no-' + key;
            for (const ele of selected) {
                if (!ele.matches(blackStr)) {
                    if (typeof val == 'string') {
                        ele.classList.add(val);
                    } else {
                        for (const cls of val) {
                            ele.classList.add(cls);
                        }
                    }
                }
            }
        }
    }
    var myboxes = (function () {
        var myboxes = document.querySelectorAll('[data-mybox]');
        var array = [];
        for (const ele of myboxes) {
            array.push(myboxes);
            var classList = ele.classList;
            var dataset = ele.dataset;
            console.log('frag', ele);
            var dfrag = dataset['mybox'];
            var splits = dfrag.split(/\, ?/);
            for (const v of splits) {
                if (v == 'dynamic-center') {
                    // TODO
                    // ele.classList.add()
                }
            }
            dataset.fragmentIndex = fragnum.toString();
            if (!isingroup) {
                fragnum++;
            }
        }
        return array;
    })();


    Reveal.addEventListener('ready', function (event) {
        var isSpeaker = Reveal.isSpeakerNotes(); // (finally they added this API.)
        if (isSpeaker) {
            optstrg.save = function () { };
        }
        window.dimsw = new tswitch(optstrg.data.bgdim, (s) => {
            (document.getElementsByClassName('backgrounds')[0]).classList.toggle('dim-enabled', s);
            optstrg.data.bgdim = s;
            optstrg.save();
        }, '背景暗化');
        dimsw.$mount({ target: '#config' });
        const blursw = new tswitch(!isSpeaker && optstrg.data.bgblur, (s) => {
            (document.getElementsByClassName('backgrounds')[0]).classList.toggle('blur-enabled', s);
            optstrg.data.bgblur = s;
            optstrg.save();
        }, '背景虚化');
        blursw.$mount({ target: '#config' });
        const fssw = new tswitch(isFullScreen(), (s) => {
            if (s == isFullScreen())
                return;
            toggleFullScreen(s);
        }, '全屏模式');
        fssw.$mount({ target: '#config' });
        var fsc = function (event) {
            fssw.$data.checked = isFullScreen();
        };
        document.addEventListener('webkitfullscreenchange', fsc, false);
        document.addEventListener('mozfullscreenchange', fsc, false);
        document.addEventListener('fullscreenchange', fsc, false);
        document.addEventListener('MSFullscreenChange', fsc, false);
        for (const frag of fragments) {
            // console.log('checking', frag);
            if (frag.classList.contains('visible')) {
                onFragmentShown({ fragment: frag });
            }
        }
    });
    Reveal.addEventListener('blackTheme', function () {
        document.getElementById('theme').setAttribute('href', 'css/theme/black.css');
    }, false);
    Reveal.addEventListener('whiteTheme', function () {
        document.getElementById('theme').setAttribute('href', 'css/theme/white.css');
    }, false);
}
