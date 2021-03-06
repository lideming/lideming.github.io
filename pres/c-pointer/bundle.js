(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}((function () { 'use strict';

    // file: utils.ts
    var __awaiter = (window && window.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const _object_assign = Object.assign;
    const _object_hasOwnProperty = Object.prototype.hasOwnProperty;
    /** The name "utils" tells it all. */
    var utils = new class Utils {
        constructor() {
            // Time & formatting utils:
            this.fileSizeUnits = ['B', 'KB', 'MB', 'GB'];
            /**
             * Build a DOM tree from a JavaScript object.
             * @example utils.buildDOM({
                    tag: 'div.item#firstitem',
                    child: ['Name: ', { tag: 'span.name', textContent: name } ],
                })
             */
            this.buildDOM = null;
            this.jsxFactory = null;
            this.jsx = null;
        }
        strPadLeft(str, len, ch = ' ') {
            while (str.length < len) {
                str = ch + str;
            }
            return str;
        }
        formatTime(sec) {
            if (typeof sec !== 'number' || isNaN(sec))
                return '--:--';
            sec = Math.round(sec);
            var min = Math.floor(sec / 60);
            sec %= 60;
            return this.strPadLeft(min.toString(), 2, '0') + ':' + this.strPadLeft(sec.toString(), 2, '0');
        }
        formatFileSize(size) {
            if (typeof size !== "number" || isNaN(size))
                return 'NaN';
            var unit = 0;
            while (unit < this.fileSizeUnits.length - 1 && size >= 1024) {
                unit++;
                size /= 1024;
            }
            return size.toFixed(2) + ' ' + this.fileSizeUnits[unit];
        }
        formatDateTime(date) {
            var now = new Date();
            var sameday = date.getFullYear() === now.getFullYear()
                && date.getMonth() === now.getMonth()
                && date.getDate() === now.getDate();
            return sameday ? date.toLocaleTimeString() : date.toLocaleString();
        }
        numLimit(num, min, max) {
            return (num < min || typeof num != 'number' || isNaN(num)) ? min :
                (num > max) ? max : num;
        }
        createName(nameFunc, existsFunc) {
            for (let num = 0;; num++) {
                let str = nameFunc(num);
                if (!existsFunc(str))
                    return str;
            }
        }
        /**
         * btoa, but supports Unicode and uses UTF-8 encoding.
         * @see https://stackoverflow.com/questions/30106476
         */
        base64EncodeUtf8(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
                return String.fromCharCode(('0x' + p1));
            }));
        }
        sleepAsync(time) {
            return new Promise((resolve) => {
                setTimeout(resolve, time);
            });
        }
        /** Remove all children from the node */
        clearChildren(node) {
            while (node.lastChild)
                node.removeChild(node.lastChild);
        }
        /** Remove all children from the node (if needed) and append one (if present) */
        replaceChild(node, newChild) {
            this.clearChildren(node);
            if (newChild)
                node.appendChild(newChild);
        }
        /** Add or remove a classname for the element
         * @param force - true -> add; false -> remove; undefined -> toggle.
         */
        toggleClass(element, clsName, force) {
            var clsList = element.classList;
            if (clsList.toggle)
                return clsList.toggle(clsName, force);
            if (force === undefined)
                force = !clsList.contains(clsName);
            if (force)
                clsList.add(clsName);
            else
                clsList.remove(clsName);
            return force;
        }
        /** Fade out the element and remove it */
        fadeout(element) {
            element.classList.add('fading-out');
            var cb = null;
            var end = () => {
                if (!end)
                    return; // use a random variable as flag ;)
                end = null;
                element.removeEventListener('transitionend', onTransitionend);
                element.classList.remove('fading-out');
                element.remove();
                cb && cb();
            };
            var onTransitionend = function (e) {
                if (e.eventPhase === Event.AT_TARGET)
                    end();
            };
            element.addEventListener('transitionend', onTransitionend);
            setTimeout(end, 350); // failsafe
            return {
                get finished() { return !end; },
                onFinished(callback) {
                    if (!end)
                        callback();
                    else
                        cb = callback;
                },
                cancel() { end === null || end === void 0 ? void 0 : end(); }
            };
        }
        listenPointerEvents(element, callback, options) {
            element.addEventListener('mousedown', function (e) {
                if (callback({ type: 'mouse', ev: e, point: e, action: 'down' }) === 'track') {
                    var mousemove = function (e) {
                        callback({ type: 'mouse', ev: e, point: e, action: 'move' });
                    };
                    var mouseup = function (e) {
                        document.removeEventListener('mousemove', mousemove, true);
                        document.removeEventListener('mouseup', mouseup, true);
                        callback({ type: 'mouse', ev: e, point: e, action: 'up' });
                    };
                    document.addEventListener('mousemove', mousemove, true);
                    document.addEventListener('mouseup', mouseup, true);
                }
            }, options);
            var touchDown = false;
            element.addEventListener('touchstart', function (e) {
                var ct = e.changedTouches[0];
                var ret = callback({
                    type: 'touch', touch: 'start', ev: e, point: ct,
                    action: touchDown ? 'move' : 'down'
                });
                if (!touchDown && ret === 'track') {
                    touchDown = true;
                    var touchmove = function (e) {
                        var ct = e.changedTouches[0];
                        callback({ type: 'touch', touch: 'move', ev: e, point: ct, action: 'move' });
                    };
                    var touchend = function (e) {
                        if (e.touches.length === 0) {
                            touchDown = false;
                            element.removeEventListener('touchmove', touchmove);
                            element.removeEventListener('touchend', touchend);
                        }
                        var ct = e.changedTouches[0];
                        callback({
                            type: 'touch', touch: 'end', ev: e, point: ct,
                            action: touchDown ? 'move' : 'up'
                        });
                    };
                    element.addEventListener('touchmove', touchmove, options);
                    element.addEventListener('touchend', touchend, options);
                }
            }, options);
        }
        addEvent(element, event, handler) {
            element.addEventListener(event, handler);
            return {
                remove: () => element.removeEventListener(event, handler)
            };
        }
        injectCss(css, options) {
            var _a;
            document.head.appendChild(utils.buildDOM({ tag: (_a = options === null || options === void 0 ? void 0 : options.tag) !== null && _a !== void 0 ? _a : 'style', text: css }));
        }
        arrayRemove(array, val) {
            for (let i = 0; i < array.length; i++) {
                if (array[i] === val) {
                    array.splice(i, 1);
                    i--;
                }
            }
        }
        arrayInsert(array, val, pos) {
            if (pos === undefined)
                array.push(val);
            else
                array.splice(pos, 0, val);
        }
        arrayMap(arr, func) {
            if (arr instanceof Array)
                return arr.map(func);
            var idx = 0;
            var ret = new Array(arr.length);
            for (var item of arr) {
                ret[idx] = (func(item, idx));
                idx++;
            }
            return ret;
        }
        arrayForeach(arr, func) {
            var idx = 0;
            for (var item of arr) {
                func(item, idx++);
            }
        }
        arrayFind(arr, func) {
            if (arr instanceof Array)
                return arr.find(func);
            var idx = 0;
            for (var item of arr) {
                if (func(item, idx++))
                    return item;
            }
            return null;
        }
        arraySum(arr, func) {
            var sum = 0;
            this.arrayForeach(arr, (x) => {
                var val = func(x);
                if (val)
                    sum += val;
            });
            return sum;
        }
        objectApply(obj, kv, keys) {
            if (kv) {
                if (!keys)
                    return _object_assign(obj, kv);
                for (const key in kv) {
                    if (_object_hasOwnProperty.call(kv, key) && (!keys || keys.indexOf(key) >= 0)) {
                        const val = kv[key];
                        obj[key] = val;
                    }
                }
            }
            return obj;
        }
        mod(a, b) {
            if (a < 0)
                a = b + a;
            return a % b;
        }
        readBlobAsDataUrl(blob) {
            return new Promise((resolve, reject) => {
                var reader = new FileReader();
                reader.onload = (ev) => {
                    resolve(reader.result);
                };
                reader.onerror = (ev) => reject();
                reader.readAsDataURL(blob);
            });
        }
    };
    Array.prototype.remove = function (item) {
        utils.arrayRemove(this, item);
    };
    class Timer {
        constructor(callback) {
            this.callback = callback;
            this.cancelFunc = undefined;
        }
        timeout(time) {
            this.tryCancel();
            var handle = setTimeout(this.callback, time);
            this.cancelFunc = () => window.clearTimeout(handle);
        }
        interval(time) {
            this.tryCancel();
            var handle = setInterval(this.callback, time);
            this.cancelFunc = () => window.clearInterval(handle);
        }
        animationFrame() {
            this.tryCancel();
            var handle = requestAnimationFrame(this.callback);
            this.cancelFunc = () => cancelAnimationFrame(handle);
        }
        tryCancel() {
            if (this.cancelFunc) {
                this.cancelFunc();
                this.cancelFunc = undefined;
            }
        }
    }
    utils.Timer = Timer;
    class BuildDOMCtx {
        constructor(dict) {
            this.dict = dict !== null && dict !== void 0 ? dict : {};
        }
        static EnsureCtx(ctxOrDict, origctx) {
            var ctx;
            if (ctxOrDict instanceof BuildDOMCtx)
                ctx = ctxOrDict;
            else
                ctx = new BuildDOMCtx(ctxOrDict);
            if (origctx) {
                if (!origctx.actions)
                    origctx.actions = [];
                ctx.actions = origctx.actions;
            }
            return ctx;
        }
        setDict(key, node) {
            if (!this.dict)
                this.dict = {};
            this.dict[key] = node;
        }
        addUpdateAction(action) {
            if (!this.actions)
                this.actions = [];
            this.actions.push(action);
            // BuildDOMCtx.executeAction(action);
        }
        update() {
            if (!this.actions)
                return;
            for (const a of this.actions) {
                BuildDOMCtx.executeAction(a);
            }
        }
        static executeAction(a) {
            switch (a[0]) {
                case 'text':
                    a[1].textContent = a[2]();
                    break;
                case 'hidden':
                    a[1].hidden = a[2]();
                    break;
                case 'update':
                    a[2](a[1]);
                    break;
                default:
                    console.warn('unknown action', a);
                    break;
            }
        }
    }
    var createElementFromTag = function (tag) {
        var reg = /[#\.^]?[\w\-]+/y;
        var match;
        var ele;
        while (match = reg.exec(tag)) {
            var val = match[0];
            var ch = val[0];
            if (ch === '.') {
                ele.classList.add(val.substr(1));
            }
            else if (ch === '#') {
                ele.id = val.substr(1);
            }
            else {
                if (ele)
                    throw new Error('unexpected multiple tags');
                ele = document.createElement(val);
            }
        }
        return ele;
    };
    function tryHandleValues(obj, ctx) {
        if (typeof (obj) === 'string') {
            return document.createTextNode(obj);
        }
        if (typeof obj === 'function') {
            const val = obj();
            if (!val || typeof val !== 'object') {
                const node = document.createTextNode(val);
                ctx === null || ctx === void 0 ? void 0 : ctx.addUpdateAction(['text', node, obj]);
                return node;
            }
            else {
                throw new Error('Unexpected function return value');
            }
        }
        if (Node && obj instanceof Node)
            return obj;
        return null;
    }
    var buildDomCore = function (obj, ttl, ctx) {
        if (ttl-- < 0)
            throw new Error('ran out of TTL');
        var r = tryHandleValues(obj, ctx);
        if (r)
            return r;
        if (obj instanceof JsxNode)
            return obj.buildDom(ctx, ttl);
        if ('getDOM' in obj)
            return obj.getDOM();
        const tag = obj.tag;
        if (!tag)
            throw new Error('no tag');
        var node = createElementFromTag(tag);
        if (obj['_ctx'])
            ctx = BuildDOMCtx.EnsureCtx(obj['_ctx'], ctx);
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var val = obj[key];
                buildDOMHandleKey(key, val, node, ctx, ttl);
            }
        }
        const init = obj['init'];
        if (init)
            init(node);
        return node;
    };
    var buildDOMHandleKey = function (key, val, node, ctx, ttl) {
        if (key === 'child') {
            if (val instanceof Array) {
                val.forEach(function (x) {
                    node.appendChild(buildDomCore(x, ttl, ctx));
                });
            }
            else {
                node.appendChild(buildDomCore(val, ttl, ctx));
            }
        }
        else if (key === '_key') {
            ctx.setDict(val, node);
        }
        else if (key === 'text') {
            if (typeof val === 'function') {
                ctx.addUpdateAction(['text', node, val]);
            }
            else {
                node.textContent = val;
            }
        }
        else if (key === 'class') {
            node.className = val;
        }
        else if (key === 'hidden' && typeof val === 'function') {
            ctx.addUpdateAction(['hidden', node, val]);
        }
        else if (key === 'update' && typeof val === 'function') {
            ctx.addUpdateAction(['update', node, val]);
        }
        else if (key === 'init') ;
        else {
            node[key] = val;
        }
    };
    const buildDOM = utils.buildDOM = function (obj, ctx) {
        return buildDomCore(obj, 32, ctx);
    };
    class JsxNode {
        constructor(tag, attrs, childs) {
            this.tag = tag;
            this.attrs = attrs;
            this.child = childs;
        }
        getDOM() {
            return this.buildDom(null, 64);
        }
        _getDOMExpr() {
            return Object.assign({ tag: this.tag, child: this.child }, this.attrs);
        }
        buildDom(ctx, ttl) {
            return this.buildView(ctx, ttl).getDOM();
        }
        buildView(ctx, ttl) {
            if (ttl-- < 0)
                throw new Error('ran out of TTL');
            if (typeof this.tag === 'string')
                return buildDomCore(this._getDOMExpr(), ttl, ctx);
            if (this.child)
                for (const it of this.child) {
                    this.tag.addChild(jsxBuildCore(it, ttl, ctx));
                }
            return this.tag;
        }
        addChild(child) {
            if (this.child == null)
                this.child = [];
            this.child.push(child);
        }
    }
    function jsxBuildCore(node, ttl, ctx) {
        if (ttl-- < 0)
            throw new Error('ran out of TTL');
        var r = tryHandleValues(node, ctx);
        if (r)
            return r;
        if (node instanceof JsxNode) {
            return node.buildView(ctx, ttl);
        }
        else {
            throw new Error("Unknown node type");
        }
    }
    function jsxBuild(node, ctx) {
        return jsxBuildCore(node, 64, ctx || new BuildDOMCtx());
    }
    function jsxFactory(tag, attrs, ...childs) {
        if (typeof tag === 'string') {
            return new JsxNode(tag, attrs, childs);
        }
        else {
            return new JsxNode(new tag(attrs), undefined, childs);
        }
    }
    const jsx = utils.jsx = utils.jsxFactory = jsxFactory;
    class SettingItem {
        constructor(key, type, initial) {
            this.onRender = null;
            this.key = key;
            type = this.type = typeof type === 'string' ? SettingItem.types[type] : type;
            if (!type || !type.serialize || !type.deserialize)
                throw new Error("invalid 'type' arugment");
            this.readFromStorage(initial);
        }
        readFromStorage(initial) {
            var str = this.key ? localStorage.getItem(this.key) : null;
            this.isInitial = !str;
            this.set(str ? this.type.deserialize(str) : initial, true);
        }
        render(fn, dontRaiseNow) {
            if (!dontRaiseNow)
                fn(this.data);
            const oldFn = this.onRender;
            const newFn = fn;
            if (oldFn)
                fn = function (x) { oldFn(x); newFn(x); };
            this.onRender = fn;
            return this;
        }
        bindToBtn(btn, prefix) {
            if (this.type !== SettingItem.types.bool)
                throw new Error('only for bool type');
            var span = document.createElement('span');
            btn.insertBefore(span, btn.firstChild);
            this.render(function (x) {
                btn.classList.toggle('disabled', !x);
                prefix = prefix || ["❌", "✅"];
                span.textContent = prefix[+x];
            });
            var thiz = this;
            btn.addEventListener('click', function () { thiz.toggle(); });
            return this;
        }
        remove() {
            localStorage.removeItem(this.key);
        }
        save() {
            this.isInitial = false;
            localStorage.setItem(this.key, this.type.serialize(this.data));
        }
        set(data, dontSave) {
            this.data = data;
            this.isInitial = false;
            this.onRender && this.onRender(data);
            if (!dontSave && this.key)
                this.save();
        }
        get() {
            return this.data;
        }
        toggle() {
            if (this.type !== SettingItem.types.bool)
                throw new Error('only for bool type');
            this.set((!this.data));
        }
        loop(arr) {
            var curData = this.data;
            var oldIndex = arr.findIndex(function (x) { return x === curData; });
            var newData = arr[(oldIndex + 1) % arr.length];
            this.set(newData);
        }
    }
    SettingItem.types = {
        bool: {
            serialize: function (data) { return data ? 'true' : 'false'; },
            deserialize: function (str) { return str === 'true' ? true : str === 'false' ? false : undefined; }
        },
        str: {
            serialize: function (x) { return x; },
            deserialize: function (x) { return x; }
        },
        json: {
            serialize: function (x) { return JSON.stringify(x); },
            deserialize: function (x) { return JSON.parse(x); }
        }
    };
    class Callbacks {
        constructor() {
            this.list = null;
        }
        invoke(...args) {
            var _a;
            (_a = this.list) === null || _a === void 0 ? void 0 : _a.forEach((x) => x.apply(this, args));
        }
        add(callback) {
            if (!this.list)
                this.list = [callback];
            else
                this.list.push(callback);
            return callback;
        }
        remove(callback) {
            if (this.list)
                this.list.remove(callback);
        }
    }
    class Lazy {
        constructor(func) {
            this._func = func;
            this._value = undefined;
        }
        get computed() { return !this._func; }
        get rawValue() { return this._value; }
        get value() {
            if (this._func) {
                this._value = this._func();
                this._func = undefined;
            }
            return this._value;
        }
    }
    class Semaphore {
        constructor(init) {
            this.queue = new Array();
            this.maxCount = 1;
            this.runningCount = 0;
            utils.objectApply(this, init);
        }
        enter() {
            if (this.runningCount === this.maxCount) {
                var resolve;
                var prom = new Promise((res) => { resolve = res; });
                this.queue.push(resolve);
                return prom;
            }
            else {
                this.runningCount++;
                return Promise.resolve();
            }
        }
        exit() {
            if (this.runningCount === this.maxCount && this.queue.length) {
                if (window.queueMicrotask) {
                    window.queueMicrotask(this.queue.shift());
                }
                else {
                    setTimeout(this.queue.shift(), 0);
                }
            }
            else {
                this.runningCount--;
            }
        }
        run(func) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.enter();
                try {
                    yield func();
                }
                finally {
                    this.exit();
                }
            });
        }
    }
    /** Just like CancellationToken[Source] on .NET */
    class CancelToken {
        constructor() {
            this.cancelled = false;
            this.onCancelled = new Callbacks();
        }
        cancel() {
            if (this.cancelled)
                return;
            this.cancelled = true;
            this.onCancelled.invoke();
        }
        throwIfCancelled() {
            if (this.cancelled)
                throw new Error("operation cancelled.");
        }
    }
    class DataUpdatingHelper {
        update(newData) {
            const oldData = this.items;
            var dataDict = {};
            for (const n of newData) {
                dataDict[this.dataSelectId(n)] = n;
            }
            var itemDict = {};
            var removed = [];
            for (const d of oldData) {
                const id = this.selectId(d);
                if (dataDict[id] !== undefined) {
                    itemDict[id] = d;
                }
                else {
                    removed.push(d);
                }
            }
            for (let i = removed.length - 1; i >= 0; i--)
                this.removeItem(removed[i]);
            var pos = 0;
            for (const n of newData) {
                const d = itemDict[this.dataSelectId(n)];
                if (d !== undefined) {
                    this.updateItem(d, n);
                }
                else {
                    this.addItem(n, pos);
                }
                pos++;
            }
        }
        selectId(obj) { return obj.id; }
        dataSelectId(obj) { return obj.id; }
        addItem(obj, pos) { }
        updateItem(old, data) { }
        removeItem(obj) { }
    }
    class EventRegistrations {
        constructor() {
            this.list = [];
        }
        add(event, func) {
            this.list.push({ event, func });
            event.add(func);
            return func;
        }
        removeAll() {
            while (this.list.length) {
                var r = this.list.pop();
                r.event.remove(r.func);
            }
        }
    }
    class TextCompositionWatcher {
        constructor(dom) {
            this.isCompositing = false;
            this.dom = dom.getDOM();
            this.dom.addEventListener('compositionstart', (ev) => {
                this.isCompositing = true;
            });
            this.dom.addEventListener('compositionend', (ev) => {
                this.isCompositing = false;
            });
        }
    }

    // file: I18n.ts
    /** Internationalization (aka i18n) helper class */
    class I18n {
        constructor() {
            this.data = {};
            this.curLang = 'en';
            this.missing = new Map();
        }
        /** Get i18n string for `key`, return `key` when not found. */
        get(key, arg) {
            return this.get2(key, arg) || key;
        }
        /** Get i18n string for `key`, return `null` when not found. */
        get2(key, arg, lang) {
            lang = lang || this.curLang;
            var langObj = this.data[lang];
            if (!langObj) {
                console.log('i18n missing lang: ' + lang);
                return null;
            }
            var r = langObj[key];
            if (!r) {
                if (!this.missing.has(key)) {
                    this.missing.set(key, 1);
                    console.log('i18n missing key: ' + key);
                }
                return null;
            }
            if (arg) {
                for (const key in arg) {
                    if (arg.hasOwnProperty(key)) {
                        const val = arg[key];
                        r = r.replace('{' + key + '}', val);
                        // Note that it only replaces the first occurrence.
                    }
                }
            }
            return r;
        }
        /** Fills data with an 2darray */
        add2dArray(array) {
            const langObjs = [];
            const langs = array[0];
            for (const lang of langs) {
                langObjs.push(this.data[lang] = this.data[lang] || {});
            }
            for (let i = 1; i < array.length; i++) {
                const line = array[i];
                const key = line[0];
                for (let j = 0; j < line.length; j++) {
                    const val = line[j];
                    langObjs[j][key] = val;
                }
            }
        }
        renderElements(elements) {
            console.log('i18n elements rendering');
            elements.forEach(x => {
                for (const node of x.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        // console.log('node', node);
                        var r = this.get2(node.beforeI18n || node.textContent);
                        if (r) {
                            node.beforeI18n = node.beforeI18n || node.textContent;
                            node.textContent = r;
                        }
                        else {
                            if (node.beforeI18n) {
                                node.textContent = node.beforeI18n;
                            }
                            console.log('missing key for node', node);
                        }
                    }
                }
            });
        }
        /**
         * Detect the best available language using
         * the user language preferences provided by the browser.
         * @param langs Available languages
         */
        static detectLanguage(langs) {
            var cur = null;
            var curIdx = -1;
            var languages = [];
            // ['en-US'] -> ['en-US', 'en']
            (navigator.languages || [navigator.language]).forEach(lang => {
                languages.push(lang);
                if (lang.indexOf('-') > 0)
                    languages.push(lang.substr(0, lang.indexOf('-')));
            });
            langs.forEach((l) => {
                var idx = languages.indexOf(l);
                if (!cur || (idx !== -1 && idx < curIdx)) {
                    cur = l;
                    curIdx = idx;
                }
            });
            return cur || langs[0];
        }
    }
    function createStringBuilder(i18n) {
        var formatCache = new WeakMap();
        return function (literals, ...placeholders) {
            if (placeholders.length === 0) {
                return i18n.get(literals[0]);
            }
            // Generate format string from template string if it's not cached:
            let formatString = formatCache.get(literals);
            if (formatString === undefined) {
                formatString = '';
                for (let i = 0; i < literals.length; i++) {
                    const lit = literals[i];
                    formatString += lit;
                    if (i < placeholders.length) {
                        formatString += '{' + i + '}';
                    }
                }
                formatCache.set(literals, formatString);
            }
            var r = i18n.get(formatString);
            for (var i = 0; i < placeholders.length; i++) {
                r = r.replace('{' + i + '}', placeholders[i]);
            }
            return r;
        };
    }
    var i18n = new I18n();
    const I = createStringBuilder(i18n);

    const version = "1.5.8";

    var css = ":root {--color-bg: white;--color-text: black;--color-text-gray: #666;--color-bg-selection: hsl(5, 100%, 85%);--color-primary: hsl(5, 100%, 67%);--color-primary-darker: hsl(5, 100%, 60%);--color-primary-dark: hsl(5, 100%, 40%);--color-primary-dark-depends: hsl(5, 100%, 40%);--color-primary-verydark: hsl(5, 100%, 20%);--color-primary-light: hsl(5, 100%, 83%);--color-primary-lighter: hsl(5, 100%, 70%);--color-fg-11: #111111;--color-fg-22: #222222;--color-fg-33: #333333;--color-bg-cc: #cccccc;--color-bg-dd: #dddddd;--color-bg-ee: #eeeeee;--color-bg-f8: #f8f8f8;--color-shadow: rgba(0, 0, 0, .5);}.no-selection {user-select: none;-ms-user-select: none;-moz-user-select: none;-webkit-user-select: none;}/* listview item */.item {display: block;padding: 10px;/* background: #ddd; *//* animation: showing .3s forwards; */text-decoration: none;line-height: 1.2;}a.item {color: inherit;}.clickable, .item {cursor: pointer;transition: transform .3s;-webkit-tap-highlight-color: transparent;}.item:hover, .dragover {background: var(--color-bg-ee);}.keyboard-input .item:focus {outline-offset: -2px;}.dragover-placeholder {/* border-top: 2px solid gray; */position: relative;}.dragover-placeholder::before {content: \"\";display: block;position: absolute;transform: translate(0, -1px);height: 2px;width: 100%;background: gray;z-index: 100;pointer-events: none;}.clickable:active, .item:active {transition: transform .07s;transform: scale(.97);}.item:active {background: var(--color-bg-dd);}.item.no-transform:active {transform: none;}.item.active {background: var(--color-bg-dd);}.loading-indicator {position: relative;margin: .3em;margin-top: 3em;margin-bottom: 1em;text-align: center;white-space: pre-wrap;cursor: default;animation: loading-fadein .3s;}.loading-indicator-text {margin: 0 auto;}.loading-indicator.running .loading-indicator-inner {display: inline-block;position: relative;vertical-align: bottom;}.loading-indicator.running .loading-indicator-inner::after {content: \"\";height: 1px;margin: 0%;background: var(--color-text);display: block;animation: fadein .5s 1s backwards;}.loading-indicator.running .loading-indicator-text {margin: 0 .5em;animation: fadein .3s, loading-first .3s .5s cubic-bezier(0.55, 0.055, 0.675, 0.19) reverse, loading-second .3s .8s cubic-bezier(0.55, 0.055, 0.675, 0.19), loading .25s 1.1s cubic-bezier(0.55, 0.055, 0.675, 0.19) alternate-reverse infinite;}.loading-indicator.error {color: red;}.loading-indicator.fading-out {transition: max-height;animation: loading-fadein .3s reverse;}@keyframes loading-fadein {0% {opacity: 0;max-height: 0;}100% {opacity: 1;max-height: 200px;}}@keyframes fadein {0% {opacity: 0;}100% {opacity: 1;}}@keyframes loading-first {0% {transform: translate(0, -2em) scale(1) rotate(360deg);}100% {transform: translate(0, 0) scale(1) rotate(0deg);}}@keyframes loading-second {0% {transform: translate(0, -2em);}100% {transform: translate(0, 0);}}@keyframes loading {0% {transform: translate(0, -1em);}100% {transform: translate(0, 0);}}@keyframes showing {0% {opacity: .3;transform: translate(-20px, 0)}100% {opacity: 1;transform: translate(0, 0)}}@keyframes showing-top {0% {opacity: .3;transform: translate(0, -20px)}100% {opacity: 1;transform: translate(0, 0)}}@keyframes showing-right {0% {opacity: .3;transform: translate(20px, 0)}100% {opacity: 1;transform: translate(0, 0)}}.overlay {background: rgba(0, 0, 0, .2);position: absolute;top: 0;left: 0;right: 0;bottom: 0;animation: fadein .3s;z-index: 10001;overflow: hidden;contain: strict;will-change: transform;}.overlay.fixed {position: fixed;}.overlay.nobg {background: none;will-change: auto;}.overlay.centerchild {display: flex;align-items: center;justify-content: center;}.dialog * {box-sizing: border-box;}.dialog {font-size: 14px;position: relative;overflow: auto;background: var(--color-bg);border-radius: 5px;box-shadow: 0 0 12px var(--color-shadow);animation: dialogin .2s ease-out;z-index: 10001;display: flex;flex-direction: column;max-height: 100%;contain: content;will-change: transform;}.dialog.resize {resize: both;}.fading-out .dialog {transition: transform .3s ease-in;transform: scale(.85);}.dialog-title, .dialog-content, .dialog-bottom {padding: 10px;}.dialog-title {background: var(--color-bg-ee);}.dialog-content {flex: 1;padding: 5px 10px;overflow: auto;}.dialog-content.flex {display: flex;flex-direction: column;}.dialog-bottom {padding: 5px 10px;}@keyframes dialogin {0% {transform: scale(.85);}100% {transform: scale(1);}}.input-label {font-size: 80%;color: var(--color-text-gray);margin: 5px 0 3px 0;}.input-text {display: block;width: 100%;padding: 5px;border: solid 1px gray;background: var(--color-bg);color: var(--color-text);}.dialog .input-text {margin: 5px 0;}textarea.input-text {resize: vertical;}.labeled-input {display: flex;flex-direction: column;}.labeled-input .input-text {flex: 1;}.labeled-input:focus-within .input-label {color: var(--color-primary-darker);}.input-text:focus {border-color: var(--color-primary-darker);}.input-text:active {border-color: var(--color-primary-dark);}.btn {display: block;text-align: center;transition: all .2s;padding: 0 .4em;min-width: 3em;line-height: 1.5em;background: var(--color-primary);color: white;text-shadow: 0 0 4px var(--color-primary-verydark);box-shadow: 0 0 3px var(--color-shadow);cursor: pointer;-ms-user-select: none;-moz-user-select: none;-webkit-user-select: none;user-select: none;position: relative;overflow: hidden;}.btn:hover {transition: all .05s;background: var(--color-primary-darker);}.btn.btn-down, .btn:active {transition: all .05s;background: var(--color-primary-dark);box-shadow: 0 0 1px var(--color-shadow);}.btn.disabled {background: var(--color-primary-light);}.dialog .btn {margin: 10px 0;}.btn-big {padding: 5px;}.tab {display: inline-block;color: var(--color-text-gray);margin: 0 5px;}.tab.active {color: var(--color-text);}*[hidden] {display: none !important;}.context-menu {position: absolute;overflow: hidden;background: var(--color-bg);border: solid 1px #777;box-shadow: 0 0px 12px var(--color-shadow);min-width: 100px;max-width: 450px;outline: none;z-index: 10001;animation: context-menu-in .2s ease-out forwards;will-change: transform;}.context-menu .item.dangerous {transition: color .3s, background .3s;color: red;}.context-menu .item.dangerous:hover {transition: color .1s, background .1s;background: red;color: white;}@keyframes context-menu-in {0% {transform: scale(.9);}100% {transform: scale(1);}}*.menu-shown {background: var(--color-bg-dd);}.menu-info {white-space: pre-wrap;color: var(--color-text-gray);padding: 5px 10px;/* animation: showing .3s; */cursor: default;}.toasts-container {position: absolute;bottom: 0;right: 0;padding: 5px;width: 300px;z-index: 10001;overflow: hidden;}.toast {margin: 5px;padding: 10px;border-radius: 5px;box-shadow: 0 0 10px var(--color-shadow);background: var(--color-bg);white-space: pre-wrap;animation: showing-right .3s;}.fading-out {transition: opacity .3s;opacity: 0;pointer-events: none;}";

    // file: viewlib.ts
    var __awaiter$1 = (window && window.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    function getWebfxCss() { return css; }
    let cssInjected = false;
    function injectWebfxCss() {
        if (!cssInjected) {
            utils.injectCss(getWebfxCss(), { tag: 'style.webfx-injected-style' });
            cssInjected = true;
        }
    }
    class View {
        constructor(dom) {
            this.parentView = undefined;
            this._position = undefined;
            this.domctx = new BuildDOMCtx();
            this._dom = undefined;
            this._onactive = undefined;
            this._onActiveCbs = undefined;
            if (dom)
                this.domExprCreated(dom);
        }
        static getView(obj) { return obj instanceof View ? obj : new View(obj); }
        get position() { return this._position; }
        get domCreated() { return !!this._dom; }
        get dom() {
            this.ensureDom();
            return this._dom;
        }
        get hidden() { return this.dom.hidden; }
        set hidden(val) { this.dom.hidden = val; }
        ensureDom() {
            if (!this._dom) {
                var r = this.createDom();
                this.domExprCreated(r);
            }
        }
        domExprCreated(r) {
            this._dom = utils.buildDOM(r, this.domctx);
            this.postCreateDom();
            this.updateDom();
        }
        createDom() {
            return document.createElement('div');
        }
        /** Will be called when the dom is created */
        postCreateDom() {
        }
        /** Will be called when the dom is created, after postCreateDom() */
        updateDom() {
            this.domctx.update();
        }
        /** Assign key-values and call `updateDom()` */
        updateWith(kv) {
            utils.objectApply(this, kv);
            this.updateDom();
        }
        toggleClass(clsName, force) {
            utils.toggleClass(this.dom, clsName, force);
        }
        appendView(view) { return this.dom.appendView(view); }
        getDOM() { return this.dom; }
        addChild(child) {
            if (child instanceof View) {
                this.appendView(child);
            }
            else {
                this.dom.appendChild(utils.buildDOM(child));
            }
        }
        get onactive() { return this._onactive; }
        set onactive(val) {
            if (!!this._onactive !== !!val) {
                if (val) {
                    this._onActiveCbs = [
                        (e) => {
                            this._onactive(e);
                        },
                        (e) => {
                            this.handleKeyDown(e, this._onactive);
                        }
                    ];
                    this.dom.addEventListener('click', this._onActiveCbs[0]);
                    this.dom.addEventListener('keydown', this._onActiveCbs[1]);
                }
                else {
                    this.dom.removeEventListener('click', this._onActiveCbs[0]);
                    this.dom.removeEventListener('keydown', this._onActiveCbs[1]);
                    this._onActiveCbs = undefined;
                }
            }
            this._onactive = val;
        }
        handleKeyDown(e, onactive) {
            if (e.code === 'Enter') {
                const rect = this.dom.getBoundingClientRect();
                onactive(new MouseEvent('click', {
                    clientX: rect.x, clientY: rect.y,
                    relatedTarget: this.dom
                }));
                e.preventDefault();
            }
        }
    }
    Node.prototype.getDOM = function () { return this; };
    Node.prototype.addChild = function (child) {
        this.appendChild(utils.buildDOM(child));
    };
    Node.prototype.appendView = function (view) {
        this.appendChild(view.dom);
    };
    class ContainerView extends View {
        constructor() {
            super(...arguments);
            this.items = [];
        }
        appendView(view) {
            this.addView(view);
        }
        addView(view, pos) {
            var _a;
            const items = this.items;
            if (view.parentView)
                throw new Error('the view is already in a container view');
            view.parentView = this;
            if (pos === undefined) {
                view._position = items.length;
                items.push(view);
                this.dom.appendChild(view.dom);
            }
            else {
                items.splice(pos, 0, view);
                this.dom.insertBefore(view.dom, ((_a = items[pos + 1]) === null || _a === void 0 ? void 0 : _a.dom) || null);
                for (let i = pos; i < items.length; i++) {
                    items[i]._position = i;
                }
            }
        }
        removeView(view) {
            view = this._ensureItem(view);
            view.dom.remove();
            var pos = view._position;
            view.parentView = view._position = undefined;
            this.items.splice(pos, 1);
            for (let i = pos; i < this.items.length; i++) {
                this.items[i]._position = i;
            }
        }
        removeAllView() {
            while (this.length)
                this.removeView(this.length - 1);
        }
        updateChildrenDom() {
            for (const item of this.items) {
                item.updateDom();
            }
        }
        _ensureItem(item) {
            if (typeof item === 'number')
                item = this.items[item];
            else if (!item)
                throw new Error('item is null or undefined.');
            else if (item.parentView !== this)
                throw new Error('the item is not in this listview.');
            return item;
        }
        [Symbol.iterator]() { return this.items[Symbol.iterator](); }
        get length() { return this.items.length; }
        get(idx) {
            return this.items[idx];
        }
        map(func) { return utils.arrayMap(this, func); }
        find(func) { return utils.arrayFind(this, func); }
        forEach(func) { return utils.arrayForeach(this, func); }
    }
    /** DragManager is used to help exchange information between views */
    var dragManager = new class DragManager {
        constructor() {
            /** The item being dragged */
            this._currentItem = null;
            this._currentArray = null;
            this.onDragStart = new Callbacks();
            this.onDragEnd = new Callbacks();
        }
        get currentItem() { var _a, _b, _c; return (_c = (_a = this._currentItem) !== null && _a !== void 0 ? _a : (_b = this._currentArray) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : null; }
        ;
        get currentArray() {
            if (this._currentItem)
                return [this._currentItem];
            return this._currentArray;
        }
        start(item) {
            this._currentItem = item;
            console.log('drag start', item);
            this.onDragStart.invoke();
        }
        startArray(arr) {
            this._currentArray = arr;
            console.log('drag start array', arr);
            this.onDragStart.invoke();
        }
        end() {
            this._currentItem = null;
            this._currentArray = null;
            console.log('drag end');
            this.onDragEnd.invoke();
        }
    };
    class ListViewItem extends View {
        constructor() {
            super(...arguments);
            this.dragging = undefined;
            this._selected = false;
            this.onSelectedChanged = new Callbacks();
            // https://stackoverflow.com/questions/7110353
            this.enterctr = 0;
            this.dragoverPlaceholder = null;
        }
        get listview() { return this.parentView; }
        get selectionHelper() { return this.listview.selectionHelper; }
        get dragData() { return this.dom.textContent; }
        get selected() { return this._selected; }
        set selected(v) {
            this._selected = v;
            this.domCreated && this.updateDom();
            this.onSelectedChanged.invoke();
        }
        remove() {
            if (!this.listview)
                return;
            this.listview.remove(this);
        }
        postCreateDom() {
            super.postCreateDom();
            this.dom.setAttribute('role', 'listitem');
            this.dom.addEventListener('click', (ev) => {
                var _a, _b, _c;
                if ((_a = this.listview) === null || _a === void 0 ? void 0 : _a.selectionHelper.handleItemClicked(this, ev))
                    return;
                (_c = (_b = this.listview) === null || _b === void 0 ? void 0 : _b.onItemClicked) === null || _c === void 0 ? void 0 : _c.call(_b, this);
            });
            this.dom.addEventListener('keydown', (ev) => {
                var _a, _b, _c, _d, _e, _f;
                if (ev.code === 'Enter') {
                    if (ev.altKey) {
                        const rect = this.dom.getBoundingClientRect();
                        const mouseev = new MouseEvent('contextmenu', {
                            clientX: rect.left, clientY: rect.top,
                            relatedTarget: this.dom
                        });
                        (_c = ((_a = this.onContextMenu) !== null && _a !== void 0 ? _a : (_b = this.listview) === null || _b === void 0 ? void 0 : _b.onContextMenu)) === null || _c === void 0 ? void 0 : _c(this, mouseev);
                    }
                    else {
                        if ((_d = this.listview) === null || _d === void 0 ? void 0 : _d.selectionHelper.handleItemClicked(this, ev))
                            return;
                        (_f = (_e = this.listview) === null || _e === void 0 ? void 0 : _e.onItemClicked) === null || _f === void 0 ? void 0 : _f.call(_e, this);
                    }
                    ev.preventDefault();
                }
                else if (this.listview && (ev.code === 'ArrowUp' || ev.code === 'ArrowDown')) {
                    const direction = ev.code === 'ArrowUp' ? -1 : 1;
                    const item = this.listview.get(this.position + direction);
                    if (item) {
                        item.dom.focus();
                        ev.preventDefault();
                    }
                }
                else if (this.listview && (ev.code === 'PageUp' || ev.code === 'PageDown')) {
                    const dir = ev.code === 'PageUp' ? -1 : 1;
                    const scrollBox = this.listview.scrollBox;
                    const targetY = dir > 0 ? (this.dom.offsetTop + scrollBox.offsetHeight)
                        : (this.dom.offsetTop + this.dom.offsetHeight - scrollBox.offsetHeight);
                    const len = this.listview.length;
                    let item = this;
                    while (dir > 0 ? (targetY > item.dom.offsetTop + item.dom.offsetHeight)
                        : (targetY < item.dom.offsetTop)) {
                        const nextIdx = item.position + dir;
                        if (nextIdx < 0 || nextIdx >= len)
                            break;
                        item = this.listview.get(nextIdx);
                    }
                    if (item && item !== this) {
                        item.dom.focus();
                        ev.preventDefault();
                    }
                }
                else if (this.listview && (ev.code === 'Home' || ev.code === 'End')) {
                    this.listview.get(ev.code == 'Home' ? 0 : (this.listview.length - 1)).dom.focus();
                    ev.preventDefault();
                }
                else if (this.listview && this.listview.selectionHelper.handleItemKeyDown(this, ev)) ;
            });
            this.dom.addEventListener('contextmenu', (ev) => {
                var _a, _b, _c;
                (_c = ((_a = this.onContextMenu) !== null && _a !== void 0 ? _a : (_b = this.listview) === null || _b === void 0 ? void 0 : _b.onContextMenu)) === null || _c === void 0 ? void 0 : _c(this, ev);
            });
            this.dom.addEventListener('dragstart', (ev) => {
                var _a, _b;
                if (!((_a = this.dragging) !== null && _a !== void 0 ? _a : (_b = this.listview) === null || _b === void 0 ? void 0 : _b.dragging)) {
                    ev.preventDefault();
                    return;
                }
                var arr = [];
                if (this.selected) {
                    arr = [...this.selectionHelper.selectedItems];
                    arr.sort((a, b) => a.position - b.position); // remove this line to get a new feature!
                }
                else {
                    arr = [this];
                }
                dragManager.startArray(arr);
                ev.dataTransfer.setData('text/plain', arr.map(x => x.dragData).join('\r\n'));
                arr.forEach(x => x.dom.style.opacity = '.5');
            });
            this.dom.addEventListener('dragend', (ev) => {
                var arr = dragManager.currentArray;
                dragManager.end();
                ev.preventDefault();
                arr.forEach(x => x.dom.style.opacity = '');
            });
            this.dom.addEventListener('dragover', (ev) => {
                this.dragHandler(ev, 'dragover');
            });
            this.dom.addEventListener('dragenter', (ev) => {
                this.dragHandler(ev, 'dragenter');
            });
            this.dom.addEventListener('dragleave', (ev) => {
                this.dragHandler(ev, 'dragleave');
            });
            this.dom.addEventListener('drop', (ev) => {
                this.dragHandler(ev, 'drop');
            });
        }
        dragHandler(ev, type) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const item = dragManager.currentItem;
            let items = dragManager.currentArray;
            const drop = type === 'drop';
            const arg = {
                source: item, target: this,
                sourceItems: items,
                event: ev, drop: drop,
                accept: false
            };
            if (item instanceof ListViewItem) {
                if (((_a = this.listview) === null || _a === void 0 ? void 0 : _a.moveByDragging) && item.listview === this.listview) {
                    ev.preventDefault();
                    const selfInside = (items.indexOf(this) >= 0);
                    const after = ev.clientY - this.dom.getBoundingClientRect().top > this.dom.offsetHeight / 2;
                    if (!(selfInside && drop))
                        arg.accept = after ? 'move-after' : 'move';
                    if (!drop) {
                        ev.dataTransfer.dropEffect = 'move';
                    }
                    else {
                        if (items.indexOf(this) === -1) {
                            let newpos = this.position;
                            if (after)
                                newpos++;
                            for (const it of items) {
                                if (it !== this) {
                                    if (newpos > it.position)
                                        newpos--;
                                    this.listview.move(it, newpos);
                                    newpos++;
                                }
                            }
                        }
                    }
                }
            }
            const onDragover = (_b = this.onDragover) !== null && _b !== void 0 ? _b : (_c = this.listview) === null || _c === void 0 ? void 0 : _c.onDragover;
            if (!arg.accept && onDragover) {
                onDragover(arg);
                if (drop || arg.accept)
                    ev.preventDefault();
            }
            const onContextMenu = (_d = this.onContextMenu) !== null && _d !== void 0 ? _d : (_e = this.listview) === null || _e === void 0 ? void 0 : _e.onContextMenu;
            if (!arg.accept && item === this && onContextMenu) {
                if (drop)
                    onContextMenu(this, ev);
                else
                    ev.preventDefault();
            }
            if (type === 'dragenter' || type == 'dragover' || type === 'dragleave' || drop) {
                if (type === 'dragenter') {
                    this.enterctr++;
                }
                else if (type === 'dragleave') {
                    this.enterctr--;
                }
                else if (type === 'drop') {
                    this.enterctr = 0;
                }
                let hover = this.enterctr > 0;
                this.toggleClass('dragover', hover);
                let placeholder = hover && (arg.accept === 'move' || arg.accept === 'move-after') && arg.accept;
                if (placeholder != ((_g = (_f = this.dragoverPlaceholder) === null || _f === void 0 ? void 0 : _f[1]) !== null && _g !== void 0 ? _g : false)) {
                    (_h = this.dragoverPlaceholder) === null || _h === void 0 ? void 0 : _h[0].remove();
                    this.dragoverPlaceholder = null;
                    if (placeholder) {
                        this.dragoverPlaceholder = [
                            utils.buildDOM({ tag: 'div.dragover-placeholder' }),
                            placeholder
                        ];
                        var before = this.dom;
                        if (arg.accept === 'move-after')
                            before = before.nextElementSibling;
                        this.dom.parentElement.insertBefore(this.dragoverPlaceholder[0], before);
                    }
                }
            }
        }
        ;
    }
    class ListView extends ContainerView {
        constructor(container) {
            super(container);
            // private items: Array<T> = [];
            this.onItemClicked = null;
            /**
             * Allow user to drag an item.
             */
            this.dragging = false;
            /**
             * Allow user to drag an item and change its position.
             */
            this.moveByDragging = false;
            this.selectionHelper = new SelectionHelper();
            this._scrollBox = null;
            this.onItemMoved = null;
            /**
             * When dragover or drop
             */
            this.onDragover = null;
            this.onContextMenu = null;
            this.selectionHelper.itemProvider = this;
        }
        get scrollBox() { return this._scrollBox || this.dom; }
        set scrollBox(val) { this._scrollBox = val; }
        postCreateDom() {
            super.postCreateDom();
            this.dom.setAttribute('role', 'list');
        }
        add(item, pos) {
            this.addView(item, pos);
            if (this.dragging)
                item.dom.draggable = true;
        }
        remove(item, keepSelected) {
            item = this._ensureItem(item);
            if (!keepSelected && item.selected)
                this.selectionHelper.toggleItemSelection(item);
            this.removeView(item);
        }
        move(item, newpos) {
            var _a;
            item = this._ensureItem(item);
            this.remove(item, true);
            this.add(item, newpos);
            (_a = this.onItemMoved) === null || _a === void 0 ? void 0 : _a.call(this, item, item.position);
        }
        /** Remove all items */
        removeAll() {
            while (this.length)
                this.remove(this.length - 1);
        }
        /** Remove all items and all DOM children */
        clear() {
            this.removeAll();
            utils.clearChildren(this.dom);
        }
        ReplaceChild(dom) {
            this.clear();
            this.dom.appendChild(dom.getDOM());
        }
    }
    class SelectionHelper {
        constructor() {
            this._enabled = false;
            this.onEnabledChanged = new Callbacks();
            this.itemProvider = null;
            this.ctrlForceSelect = false;
            this.selectedItems = [];
            this.onSelectedItemsChanged = new Callbacks();
            /** For shift-click */
            this.lastToggledItem = null;
        }
        get enabled() { return this._enabled; }
        set enabled(val) {
            if (!!val === !!this._enabled)
                return;
            this._enabled = val;
            while (this.selectedItems.length)
                this.toggleItemSelection(this.selectedItems[0], false);
            this.lastToggledItem = null;
            this.onEnabledChanged.invoke();
        }
        get count() { return this.selectedItems.length; }
        /** Returns true if it's handled by the helper. */
        handleItemClicked(item, ev) {
            if (!this.enabled) {
                if (!this.ctrlForceSelect || !ev.ctrlKey)
                    return false;
                this.enabled = true;
            }
            if (ev.shiftKey && this.lastToggledItem && this.itemProvider) {
                var toSelect = !!this.lastToggledItem.selected;
                var start = item.position, end = this.lastToggledItem.position;
                if (start > end)
                    [start, end] = [end, start];
                for (let i = start; i <= end; i++) {
                    this.toggleItemSelection(this.itemProvider.get(i), toSelect);
                }
                this.lastToggledItem = item;
            }
            else {
                this.toggleItemSelection(item);
            }
            ev.preventDefault();
            return true;
        }
        /** Returns true if it's handled by the helper. */
        handleItemKeyDown(item, ev) {
            if (!this.enabled)
                return false;
            if (this.itemProvider && ev.ctrlKey && ev.code === 'KeyA') {
                const len = this.itemProvider.length;
                for (let i = 0; i < len; i++) {
                    this.toggleItemSelection(this.itemProvider.get(i), true);
                }
                ev.preventDefault();
                return true;
            }
            return false;
        }
        toggleItemSelection(item, force) {
            if (force !== undefined && force === !!item.selected)
                return;
            if (item.selected) {
                item.selected = false;
                this.selectedItems.remove(item);
                this.onSelectedItemsChanged.invoke('remove', item);
            }
            else {
                item.selected = true;
                this.selectedItems.push(item);
                this.onSelectedItemsChanged.invoke('add', item);
            }
            this.lastToggledItem = item;
            if (this.count === 0 && this.ctrlForceSelect)
                this.enabled = false;
        }
    }
    class ItemActiveHelper {
        constructor(init) {
            this.funcSetActive = (item, val) => item.toggleClass('active', val);
            this.current = null;
            utils.objectApply(this, init);
        }
        set(item) {
            if (this.current === item)
                return;
            if (this.current)
                this.funcSetActive(this.current, false);
            this.current = item;
            if (this.current)
                this.funcSetActive(this.current, true);
        }
    }
    class Section extends View {
        constructor(arg) {
            super();
            this.titleView = new TextView({ tag: 'span.section-title' });
            this.headerView = new View({
                tag: 'div.section-header',
                child: [
                    this.titleView
                ]
            });
            this.ensureDom();
            if (arg) {
                if (arg.title)
                    this.setTitle(arg.title);
                if (arg.content)
                    this.setContent(arg.content);
                if (arg.actions)
                    arg.actions.forEach(x => this.addAction(x));
            }
        }
        createDom() {
            return {
                _ctx: this,
                tag: 'div.section',
                child: [
                    this.headerView
                ]
            };
        }
        setTitle(text) {
            this.titleView.text = text;
        }
        setContent(view) {
            var dom = this.dom;
            var firstChild = dom.firstChild;
            while (dom.lastChild !== firstChild)
                dom.removeChild(dom.lastChild);
            dom.appendChild(view.getDOM());
        }
        addAction(arg) {
            var view = new View({
                tag: 'div.section-action.clickable',
                text: arg.text,
                tabIndex: 0
            });
            view.onactive = arg.onclick;
            this.headerView.dom.appendChild(view.dom);
        }
    }
    class LoadingIndicator extends View {
        constructor(init) {
            super();
            this._status = 'running';
            this.onclick = null;
            if (init)
                utils.objectApply(this, init);
        }
        get state() { return this._status; }
        set state(val) {
            this._status = val;
            ['running', 'error', 'normal'].forEach(x => this.toggleClass(x, val === x));
        }
        get content() { return this._text; }
        set content(val) { this._text = val; this.ensureDom(); this._textdom.textContent = val; }
        reset() {
            this.state = 'running';
            this.content = I `Loading`;
            this.onclick = null;
        }
        error(err, retry) {
            this.state = 'error';
            this.content = I `Oh no! Something just goes wrong:` + '\r\n' + err;
            if (retry) {
                this.content += '\r\n' + I `[Click here to retry]`;
            }
            this.onclick = retry;
        }
        action(func) {
            return __awaiter$1(this, void 0, void 0, function* () {
                try {
                    yield func();
                }
                catch (error) {
                    this.error(error, () => this.action(func));
                }
            });
        }
        createDom() {
            return {
                _ctx: this,
                tag: 'div.loading-indicator',
                child: [{
                        tag: 'div.loading-indicator-inner',
                        child: [{ tag: 'div.loading-indicator-text', _key: '_textdom' }]
                    }],
                onclick: (e) => this.onclick && this.onclick(e)
            };
        }
        postCreateDom() {
            this.reset();
        }
    }
    class Overlay extends View {
        createDom() {
            return { tag: 'div.overlay' };
        }
        setCenterChild(centerChild) {
            this.toggleClass('centerchild', centerChild);
            return this;
        }
        setNoBg(nobg) {
            this.toggleClass('nobg', nobg);
            return this;
        }
        setFixed(fixed) {
            this.toggleClass('fixed', fixed);
            return this;
        }
    }
    class EditableHelper {
        constructor(element) {
            this.editing = false;
            this.beforeEdit = null;
            this.onComplete = null;
            this.element = element;
        }
        startEdit(onComplete) {
            if (this.editing)
                return;
            this.editing = true;
            var ele = this.element;
            var beforeEdit = this.beforeEdit = ele.textContent;
            utils.toggleClass(ele, 'editing', true);
            var input = utils.buildDOM({
                tag: 'input', type: 'text', value: beforeEdit
            });
            while (ele.firstChild)
                ele.removeChild(ele.firstChild);
            ele.appendChild(input);
            input.select();
            input.focus();
            var stopEdit = () => {
                var _a;
                this.editing = false;
                utils.toggleClass(ele, 'editing', false);
                events.forEach(x => x.remove());
                input.remove();
                (_a = this.onComplete) === null || _a === void 0 ? void 0 : _a.call(this, input.value);
                onComplete === null || onComplete === void 0 ? void 0 : onComplete(input.value);
            };
            var events = [
                utils.addEvent(input, 'keydown', (evv) => {
                    if (evv.code === 'Enter') {
                        stopEdit();
                        evv.preventDefault();
                    }
                }),
                utils.addEvent(input, 'focusout', (evv) => { stopEdit(); }),
            ];
        }
        startEditAsync() {
            return new Promise((resolve) => this.startEdit(resolve));
        }
    }
    class MenuItem extends ListViewItem {
        constructor(init) {
            super();
            this.text = '';
            this.cls = 'normal';
            this.onclick = null;
            utils.objectApply(this, init);
        }
        createDom() {
            return {
                tag: 'div.item.no-selection',
                tabIndex: 0
            };
        }
        postCreateDom() {
            super.postCreateDom();
            this.onactive = (ev) => {
                var _a;
                if (this.parentView instanceof ContextMenu) {
                    if (!this.parentView.keepOpen)
                        this.parentView.close();
                }
                (_a = this.onclick) === null || _a === void 0 ? void 0 : _a.call(this, ev);
            };
        }
        updateDom() {
            this.dom.textContent = this.text;
            if (this.cls !== this._lastcls) {
                if (this._lastcls)
                    this.dom.classList.remove(this._lastcls);
                if (this.cls)
                    this.dom.classList.add(this.cls);
            }
        }
    }
    class MenuLinkItem extends MenuItem {
        constructor(init) {
            super(init);
            this.link = '';
            this.download = '';
            utils.objectApply(this, init);
        }
        createDom() {
            var dom = super.createDom();
            dom.tag = 'a.item.no-selection';
            dom.target = "_blank";
            return dom;
        }
        updateDom() {
            super.updateDom();
            this.dom.href = this.link;
            this.dom.download = this.download;
        }
    }
    class MenuInfoItem extends MenuItem {
        constructor(init) {
            super(init);
            this.text = '';
            utils.objectApply(this, init);
        }
        createDom() {
            return {
                tag: 'div.menu-info'
            };
        }
        updateDom() {
            super.updateDom();
            this.dom.textContent = this.text;
        }
    }
    class ContextMenu extends ListView {
        constructor(items) {
            super({ tag: 'div.context-menu', tabIndex: 0 });
            this.keepOpen = false;
            this.useOverlay = true;
            this._visible = false;
            this.overlay = null;
            this.onClose = new Callbacks();
            this._originalFocused = null;
            items === null || items === void 0 ? void 0 : items.forEach(x => this.add(x));
        }
        get visible() { return this._visible; }
        ;
        postCreateDom() {
            super.postCreateDom();
            this.dom.addEventListener('focusout', (e) => {
                !this.dom.contains(e.relatedTarget) && this.close();
            });
            this.dom.addEventListener('keydown', (e) => {
                if (e.code === 'Escape') {
                    e.preventDefault();
                    this.close();
                }
            });
        }
        show(arg) {
            if (this._visible) {
                console.warn("[ContextMenu] show() called when it's already visible.");
                return;
            }
            if ('ev' in arg)
                arg = {
                    x: arg.ev.clientX,
                    y: arg.ev.clientY
                };
            this._visible = true;
            if (this.useOverlay) {
                if (!this.overlay) {
                    this.overlay = new Overlay().setFixed(true);
                    this.overlay.dom.style.background = 'rgba(0, 0, 0, .1)';
                    this.overlay.dom.addEventListener('mousedown', (ev) => {
                        if (ev.eventPhase !== Event.AT_TARGET)
                            return;
                        ev.preventDefault();
                        this.close();
                    });
                }
                this.overlay.appendView(this);
                document.body.appendChild(this.overlay.dom);
            }
            else {
                document.body.appendChild(this.dom);
            }
            this._originalFocused = document.activeElement;
            this.dom.focus();
            var width = this.dom.offsetWidth, height = this.dom.offsetHeight;
            var parentWidth = document.body.offsetWidth;
            var parentHeight = document.body.offsetHeight;
            if (this.useOverlay) {
                const overlayDom = this.overlay.dom;
                parentWidth = overlayDom.offsetWidth;
                parentHeight = overlayDom.offsetHeight;
            }
            var x = arg.x, y = arg.y;
            if (x + width > parentWidth)
                x -= width;
            if (y + height > parentHeight)
                y -= height;
            if (x < 0)
                x = 0;
            if (y < 0)
                y = 0;
            this.dom.style.left = x + 'px';
            this.dom.style.top = y + 'px';
            this.dom.style.transformOrigin = `${arg.x - x}px ${arg.y - y}px`;
        }
        close() {
            var _a, _b;
            if (this._visible) {
                this._visible = false;
                this.onClose.invoke();
                (_b = (_a = this._originalFocused) === null || _a === void 0 ? void 0 : _a['focus']) === null || _b === void 0 ? void 0 : _b.call(_a);
                this._originalFocused = null;
                if (this.overlay)
                    utils.fadeout(this.overlay.dom);
                utils.fadeout(this.dom);
            }
        }
    }
    class Dialog extends View {
        constructor() {
            super();
            this.content = new ContainerView({ tag: 'div.dialog-content' });
            this.shown = false;
            this.btnTitle = new TabBtn({ active: true, clickable: false });
            this.btnClose = new TabBtn({ text: I `Close`, right: true });
            this.title = 'Dialog';
            this.allowClose = true;
            this.showCloseButton = true;
            this.onShown = new Callbacks();
            this.onClose = new Callbacks();
            this.focusTrap = new View({ tag: 'div.focustrap', tabIndex: 0 });
            this.btnClose.onClick.add(() => this.allowClose && this.close());
        }
        static get defaultParent() {
            if (!Dialog._defaultParent)
                Dialog._defaultParent = new DialogParent();
            return Dialog._defaultParent;
        }
        static set defaultParent(val) {
            Dialog._defaultParent = val;
        }
        get width() { return this.dom.style.width; }
        set width(val) { this.dom.style.width = val; }
        get contentFlex() { return this.content.dom.classList.contains('flex'); }
        set contentFlex(val) { this.content.toggleClass('flex', !!val); }
        get resizable() { return this.dom.classList.contains('resize'); }
        set resizable(val) { this.toggleClass('resize', !!val); }
        createDom() {
            return {
                _ctx: this,
                _key: 'dialog',
                tag: 'div.dialog',
                tabIndex: 0,
                style: 'width: 300px',
                child: [
                    {
                        _key: 'domheader',
                        tag: 'div.dialog-title',
                        child: [
                            { tag: 'div', style: 'clear: both;' }
                        ]
                    },
                    this.content,
                    this.focusTrap
                ]
            };
        }
        postCreateDom() {
            super.postCreateDom();
            this.addBtn(this.btnTitle);
            this.addBtn(this.btnClose);
            this.overlay = new Overlay().setCenterChild(true).setNoBg(true);
            this.overlay.dom.appendView(this);
            this.overlay.dom.addEventListener('mousedown', (ev) => {
                if (this.allowClose && ev.button === 0 && ev.target === this.overlay.dom) {
                    ev.preventDefault();
                    this.close();
                }
            });
            this.overlay.dom.addEventListener('keydown', (ev) => {
                if (this.allowClose && ev.keyCode === 27) { // ESC
                    ev.preventDefault();
                    this.close();
                }
                else if (ev.target === this.dom && ev.code === 'Tab' && ev.shiftKey) {
                    ev.preventDefault();
                    let tabables = this.dom.querySelectorAll('a, [tabindex]');
                    if (tabables.length >= 2 && tabables[tabables.length - 2]['focus']) {
                        // the last tabable is `focusTrap`, so the index used here is `length - 2`
                        tabables[tabables.length - 2]['focus']();
                    }
                }
            });
            // title bar pointer event handler:
            {
                let offset;
                utils.listenPointerEvents(this.domheader, (e) => {
                    if (e.action === 'down') {
                        if (e.ev.target !== this.domheader && e.ev.target !== this.btnTitle.dom)
                            return;
                        e.ev.preventDefault();
                        const rectOverlay = this.overlay.dom.getBoundingClientRect();
                        const rect = this.dom.getBoundingClientRect();
                        offset = {
                            x: e.point.pageX - rectOverlay.x - rect.x,
                            y: e.point.pageY - rectOverlay.y - rect.y
                        };
                        return 'track';
                    }
                    else if (e.action === 'move') {
                        e.ev.preventDefault();
                        const rect = this.overlay.dom.getBoundingClientRect();
                        const pageX = utils.numLimit(e.point.pageX, rect.left, rect.right);
                        const pageY = utils.numLimit(e.point.pageY, rect.top, rect.bottom);
                        this.setOffset(pageX - offset.x, pageY - offset.y);
                    }
                });
            }
            this.dom.addEventListener('resize', () => {
                if (this.dom.style.width)
                    this.width = this.dom.style.width;
            });
            this.focusTrap.dom.addEventListener('focus', (ev) => {
                this.dom.focus();
            });
        }
        updateDom() {
            this.btnTitle.updateWith({ text: this.title });
            this.btnTitle.hidden = !this.title;
            this.btnClose.hidden = !(this.allowClose && this.showCloseButton);
        }
        addBtn(btn) {
            this.ensureDom();
            this.domheader.insertBefore(btn.dom, this.domheader.lastChild);
        }
        addContent(view, replace) {
            this.ensureDom();
            if (replace)
                this.content.removeAllView();
            this.content.appendView(View.getView(view));
        }
        setOffset(x, y) {
            this.dom.style.left = x ? x + 'px' : '';
            this.dom.style.top = y ? y + 'px' : '';
            this.overlay.setCenterChild(false);
        }
        getOffset() {
            var x = this.dom.style.left ? parseFloat(this.dom.style.left) : 0;
            var y = this.dom.style.top ? parseFloat(this.dom.style.top) : 0;
            return { x, y };
        }
        center() {
            this.setOffset(0, 0);
            this.overlay.setCenterChild(true);
        }
        show(ev) {
            var _a;
            if (this.shown)
                return;
            this.shown = true;
            (_a = this._cancelFadeout) === null || _a === void 0 ? void 0 : _a.call(this);
            this.ensureDom();
            Dialog.defaultParent.onDialogShowing(this);
            this.setTransformOrigin(ev);
            this.dom.focus();
            (this.autoFocus || this).dom.focus();
            this.onShown.invoke();
        }
        setTransformOrigin(ev) {
            if (ev) {
                const rect = this.dom.getBoundingClientRect();
                this.dom.style.transformOrigin = `${ev.x - rect.x}px ${ev.y - rect.y}px`;
            }
            else {
                this.dom.style.transformOrigin = '';
            }
        }
        close() {
            if (!this.shown)
                return;
            this.shown = false;
            this.setTransformOrigin(undefined);
            this.onClose.invoke();
            this._cancelFadeout = utils.fadeout(this.overlay.dom).cancel;
            Dialog.defaultParent.onDialogClosing(this);
        }
        waitClose() {
            return new Promise((resolve) => {
                var cb = this.onClose.add(() => {
                    this.onClose.remove(cb);
                    resolve();
                });
            });
        }
    }
    Dialog._defaultParent = null;
    class DialogParent extends View {
        constructor(dom) {
            super(dom !== null && dom !== void 0 ? dom : document.body);
            this.bgOverlay = new Overlay();
            this.dialogCount = 0;
            this._cancelFadeout = null;
        }
        onDialogShowing(dialog) {
            var _a;
            if (this.dialogCount++ === 0) {
                (_a = this._cancelFadeout) === null || _a === void 0 ? void 0 : _a.call(this);
                this.appendView(this.bgOverlay);
            }
            this.appendView(dialog.overlay);
        }
        onDialogClosing(dialog) {
            if (--this.dialogCount === 0) {
                this._cancelFadeout = utils.fadeout(this.bgOverlay.dom).cancel;
            }
        }
    }
    class TabBtn extends View {
        constructor(init) {
            super();
            this.text = '';
            this.clickable = true;
            this.active = false;
            this.right = false;
            this.onclick = null;
            this.onClick = new Callbacks();
            utils.objectApply(this, init);
        }
        createDom() {
            return {
                tag: 'span.tab.no-selection'
            };
        }
        postCreateDom() {
            this.onactive = (ev) => {
                var _a;
                (_a = this.onclick) === null || _a === void 0 ? void 0 : _a.call(this, ev);
                this.onClick.invoke(ev);
            };
        }
        updateDom() {
            this.dom.textContent = this.text;
            this.dom.tabIndex = this.clickable ? 0 : -1;
            this.toggleClass('clickable', this.clickable);
            this.toggleClass('active', this.active);
            this.dom.style.float = this.right ? 'right' : 'left';
        }
    }
    class InputView extends View {
        constructor(init) {
            super();
            this.multiline = false;
            this.type = 'text';
            this.placeholder = '';
            utils.objectApply(this, init);
        }
        get value() { return this.dom.value; }
        set value(val) { this.dom.value = val; }
        createDom() {
            return this.multiline ? { tag: 'textarea.input-text' } : { tag: 'input.input-text' };
        }
        updateDom() {
            super.updateDom();
            if (this.dom instanceof HTMLInputElement) {
                this.dom.type = this.type;
                this.dom.placeholder = this.placeholder;
            }
        }
    }
    class TextView extends View {
        get text() { return this.dom.textContent; }
        set text(val) { this.dom.textContent = val; }
    }
    class ButtonView extends TextView {
        constructor(init) {
            super();
            this.disabled = false;
            this.type = 'normal';
            utils.objectApply(this, init);
            this.updateDom();
        }
        get onclick() { return this.onactive; }
        set onclick(val) { this.onactive = val; }
        createDom() {
            return { tag: 'div.btn', tabIndex: 0 };
        }
        updateDom() {
            super.updateDom();
            this.toggleClass('disabled', this.disabled);
            this.toggleClass('btn-big', this.type === 'big');
        }
    }
    class LabeledInputBase extends View {
        constructor(init) {
            super();
            this.label = '';
            utils.objectApply(this, init);
        }
        get dominput() { return this.input.dom; }
        createDom() {
            return {
                _ctx: this,
                tag: 'div.labeled-input',
                child: [
                    { tag: 'div.input-label', text: () => this.label },
                    this.input
                ]
            };
        }
        updateDom() {
            super.updateDom();
            this.input.domCreated && this.input.updateDom();
        }
    }
    class LabeledInput extends LabeledInputBase {
        constructor(init) {
            super();
            utils.objectApply(this, init);
            if (!this.input)
                this.input = new InputView();
        }
        get value() { return this.dominput.value; }
        set value(val) { this.dominput.value = val; }
        updateDom() {
            this.input.type = this.type;
            super.updateDom();
        }
    }
    var FlagsInput;
    (function (FlagsInput_1) {
        class FlagsInput extends ContainerView {
            constructor(flags) {
                super();
                flags === null || flags === void 0 ? void 0 : flags.forEach(f => {
                    var flag = f instanceof Flag ? f : new Flag({ text: Object.prototype.toString.call(f) });
                    this.addView(flag);
                });
            }
            createDom() {
                return { tag: 'div.flags-input' };
            }
        }
        FlagsInput_1.FlagsInput = FlagsInput;
        class Flag extends TextView {
            get parentInput() { return this.parentView; }
            constructor(init) {
                super();
                utils.objectApply(this, init);
            }
            createDom() {
                return { tag: 'div.flags-input-item' };
            }
        }
        FlagsInput_1.Flag = Flag;
    })(FlagsInput || (FlagsInput = {}));
    class ToastsContainer extends View {
        constructor() {
            super(...arguments);
            this.parentDom = null;
            this.toasts = [];
        }
        createDom() {
            return { tag: 'div.toasts-container' };
        }
        addToast(toast) {
            if (this.toasts.length === 0)
                this.show();
            this.toasts.push(toast);
        }
        removeToast(toast) {
            this.toasts.remove(toast);
            if (this.toasts.length === 0)
                this.remove();
        }
        show() {
            var parent = this.parentDom || document.body;
            parent.appendChild(this.dom);
        }
        remove() {
            this.dom.remove();
        }
    }
    ToastsContainer.default = new ToastsContainer();
    class Toast extends View {
        constructor(init) {
            super();
            this.text = '';
            this.shown = false;
            this.timer = new Timer(() => this.close());
            utils.objectApply(this, init);
            if (!this.container)
                this.container = ToastsContainer.default;
        }
        show(timeout) {
            if (!this.shown) {
                this.container.addToast(this);
                this.container.appendView(this);
                this.shown = true;
            }
            if (timeout)
                this.timer.timeout(timeout);
            else
                this.timer.tryCancel();
        }
        close() {
            if (!this.shown)
                return;
            this.shown = false;
            utils.fadeout(this.dom)
                .onFinished(() => this.container.removeToast(this));
        }
        createDom() {
            return { tag: 'div.toast' };
        }
        updateDom() {
            this.dom.textContent = this.text;
        }
        static show(text, timeout) {
            var toast = new Toast({ text });
            toast.show(timeout);
            return toast;
        }
    }
    class MessageBox extends Dialog {
        constructor() {
            super(...arguments);
            this.allowClose = false;
            this.title = 'Message';
            this.result = 'none';
        }
        addResultBtns(results) {
            for (const r of results) {
                this.addBtnWithResult(new TabBtn({ text: i18n.get('msgbox_' + r), right: true }), r);
            }
            return this;
        }
        setTitle(title) {
            this.title = title;
            if (this.domCreated)
                this.updateDom();
            return this;
        }
        addText(text) {
            this.addContent(new TextView({ tag: 'div.messagebox-text', textContent: text }));
            return this;
        }
        allowCloseWithResult(result, showCloseButton) {
            this.result = result;
            this.allowClose = true;
            this.showCloseButton = !!showCloseButton;
            if (this.domCreated)
                this.updateDom();
            return this;
        }
        addBtnWithResult(btn, result) {
            btn.onClick.add(() => { this.result = result; this.close(); });
            this.addBtn(btn);
            return this;
        }
        showAndWaitResult() {
            return __awaiter$1(this, void 0, void 0, function* () {
                this.show();
                yield this.waitClose();
                return this.result;
            });
        }
    }
    class ViewToggle {
        constructor(init) {
            this.shownKeys = [];
            this.toggleMode = 'remove';
            this.container = null;
            utils.objectApply(this, init);
            this.setShownKeys(this.shownKeys);
        }
        add(key, view) {
            const oldVal = this.items[key];
            if (oldVal) {
                if (oldVal instanceof Array) {
                    this.items[key].push(view);
                }
                else {
                    this.items[key] = [oldVal, view];
                }
            }
            else {
                this.items[key] = view;
            }
            this.toggleView(view, this.shownKeys.indexOf(key) >= 0);
        }
        setShownKeys(keys) {
            this.shownKeys = keys;
            const items = this.items;
            for (const key in items) {
                const show = keys.indexOf(key) >= 0;
                if (Object.prototype.hasOwnProperty.call(items, key)) {
                    const val = items[key];
                    if (val) {
                        if (val instanceof Array) {
                            for (const v of val) {
                                this.toggleView(v, show);
                            }
                        }
                        else if (val) {
                            this.toggleView(val, show);
                        }
                    }
                }
            }
        }
        toggleView(view, show, mode) {
            if (!mode)
                mode = this.toggleMode;
            if (mode == 'display') {
                view.dom.style.display = show ? '' : 'none';
            }
            else if (mode == 'hidden') {
                view.dom.hidden = !show;
            }
            else if (mode == 'remove') {
                if (show) {
                    this.container.appendView(view);
                }
                else {
                    view.dom.remove();
                }
            }
            else {
                throw new Error('Unknown toggle mode');
            }
        }
    }

    var webfx = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BuildDOMCtx: BuildDOMCtx,
        ButtonView: ButtonView,
        Callbacks: Callbacks,
        CancelToken: CancelToken,
        ContainerView: ContainerView,
        ContextMenu: ContextMenu,
        DataUpdatingHelper: DataUpdatingHelper,
        Dialog: Dialog,
        DialogParent: DialogParent,
        EditableHelper: EditableHelper,
        EventRegistrations: EventRegistrations,
        get FlagsInput () { return FlagsInput; },
        I: I,
        I18n: I18n,
        InputView: InputView,
        ItemActiveHelper: ItemActiveHelper,
        JsxNode: JsxNode,
        LabeledInput: LabeledInput,
        LabeledInputBase: LabeledInputBase,
        Lazy: Lazy,
        ListView: ListView,
        ListViewItem: ListViewItem,
        LoadingIndicator: LoadingIndicator,
        MenuInfoItem: MenuInfoItem,
        MenuItem: MenuItem,
        MenuLinkItem: MenuLinkItem,
        MessageBox: MessageBox,
        Overlay: Overlay,
        Section: Section,
        SelectionHelper: SelectionHelper,
        Semaphore: Semaphore,
        SettingItem: SettingItem,
        TabBtn: TabBtn,
        TextCompositionWatcher: TextCompositionWatcher,
        TextView: TextView,
        Timer: Timer,
        Toast: Toast,
        ToastsContainer: ToastsContainer,
        View: View,
        ViewToggle: ViewToggle,
        buildDOM: buildDOM,
        createStringBuilder: createStringBuilder,
        dragManager: dragManager,
        getWebfxCss: getWebfxCss,
        i18n: i18n,
        injectWebfxCss: injectWebfxCss,
        jsx: jsx,
        jsxBuild: jsxBuild,
        jsxBuildCore: jsxBuildCore,
        jsxFactory: jsxFactory,
        utils: utils,
        version: version
    });

    class Prensentaion extends ContainerView {
        constructor() {
            super();
            this.usingRouter = false;
            this.steps = new StepManager();
            this.steps.steps = this.items;
        }
        get currentScene() { return this.steps.currentItem; }
        createDom() {
            return jsx("div", { class: "presentation" });
        }
        addChild(scene) {
            this.addView(scene);
            scene.updateDom();
        }
        init() {
            this.items.forEach(x => x.init());
            this.setCurrentScene(this.items[0]);
        }
        setCurrentScene(scene, pushState = true) {
            this.steps.setCurrent(scene.position);
            if (this.usingRouter && pushState) {
                window.history.pushState({}, scene.title, '#' + scene.position);
            }
        }
        nextStep(step = 1) {
            var scene = this.currentScene;
            while (step && scene) {
                if (step > 0) {
                    if (scene.currentStep + step >= scene.steps.count) {
                        step -= scene.steps.count - scene.currentStep;
                        scene = this.items[scene.position + 1];
                    }
                    else {
                        scene.steps.setCurrent(scene.currentStep + step);
                        step = 0;
                    }
                }
                else {
                    if (scene.currentStep + step < 0) {
                        step += scene.currentStep + 1;
                        scene = this.items[scene.position - 1];
                    }
                    else {
                        scene.steps.setCurrent(scene.currentStep + step);
                        step = 0;
                    }
                }
            }
            if (scene && scene !== this.currentScene) {
                this.setCurrentScene(scene);
            }
        }
        nextScene(step = 1) {
            var scene = this.items[this.currentScene.position + step];
            if (scene)
                this.setCurrentScene(scene);
        }
        useRouter() {
            this.usingRouter = true;
            var navByHash = () => {
                this.setCurrentScene(this.items[+window.location.hash.substr(1)], false);
            };
            window.addEventListener("popstate", (ev) => {
                navByHash();
            });
            navByHash();
        }
    }
    class Scene extends View {
        constructor(arg) {
            super();
            this._state = "before";
            this.onStateChanged = new Callbacks();
            this.title = "";
            this.content = new View(jsx("div", { class: "content" }));
            this.scrollbox = new View(jsx("div", { class: "scrollbox anim-slide-half" }, this.content));
            this.steps = new StepManager();
            this.hiddenTimer = new Timer(() => {
                this.toggleClass('hidden', true);
            });
            if (arg === null || arg === void 0 ? void 0 : arg.title) {
                this.title = arg.title;
                this.addChild(jsxBuild(jsx(HeadTitle, null, arg.title)));
            }
            if (arg === null || arg === void 0 ? void 0 : arg.centerContent) {
                this.toggleClass('centercontent', true);
            }
        }
        get currentStep() { return this.steps.current; }
        get state() { return this._state; }
        set state(val) {
            if (val === this._state)
                return;
            this._state = val;
            if (val === 'show') {
                this.toggleClass('hidden', false);
                this.hiddenTimer.tryCancel();
                this.dom.offsetTop; // force reflow
                this.toggleClass('show', true);
                this.scrollbox.dom.focus();
            }
            else {
                this.toggleClass('show', false);
                this.hiddenTimer.timeout(500);
            }
            this.toggleClass('before', val === 'before');
            this.toggleClass('after', val === 'after');
            if (val === 'before') {
                this.steps.setCurrent(0);
            }
            if (val === 'after') {
                this.steps.setCurrent(this.steps.steps.length - 1);
            }
            this.onStateChanged.invoke(val);
        }
        createDom() {
            return jsx("div", { class: "scene hidden before" },
                jsx("div", { class: "pagenum anim-slide" }, () => '#' + this.position),
                this.scrollbox);
        }
        addChild(child) {
            if (child instanceof Frame) {
                this.dom.insertBefore(child.dom, this.scrollbox.dom);
                return;
            }
            this.content.addChild(child);
            var dom = child.getDOM();
        }
        init() {
            this.dom.querySelectorAll('[data-scene=y]').forEach((x) => {
                x['addedToScene'](this);
            });
        }
    }
    class StepManager {
        constructor() {
            this.steps = [new Step()];
            this.current = 0;
        }
        get count() { return this.steps.length; }
        get currentItem() { return this.steps[this.current]; }
        setCurrent(cur) {
            if (this.steps[cur])
                this.steps[cur].state = "show";
            var old = this.current;
            this.current = cur;
            for (let i = old; i < cur; i++) {
                if (this.steps[i])
                    this.steps[i].state = "after";
            }
            for (let i = old; i > cur; i--) {
                if (this.steps[i])
                    this.steps[i].state = "before";
            }
        }
        addStep(pos, handler) {
            if (pos == null)
                pos = this.steps.length;
            while (pos >= this.steps.length) {
                this.steps.push(null);
            }
            if (!this.steps[pos])
                this.steps[pos] = new Step();
            this.steps[pos].onStateChanged.add(handler);
        }
    }
    class Step {
        constructor() {
            this._state = "before";
            this.onStateChanged = new Callbacks();
        }
        get state() { return this._state; }
        set state(val) {
            this._state = val;
            this.onStateChanged.invoke(val);
        }
    }
    class Frame extends View {
        createDom() {
            return jsx("div", { class: "frame" });
        }
    }
    class HeadTitle extends Frame {
        createDom() {
            return jsx("div", { class: "headtitle anim-slide" });
        }
    }
    class Code extends View {
        constructor(arg) {
            super();
            this.dom.classList.add('lang-' + ((arg === null || arg === void 0 ? void 0 : arg.lang) || 'c'));
        }
        createDom() {
            return jsx("pre", { class: "code-outer" },
                jsx("code", { init: (x) => this.code = x, class: "code" }));
        }
        addChild(code) {
            if (code instanceof Text) {
                var text = code.textContent;
                var sub = 0;
                while (text[sub] == '\r' || text[sub] == '\n')
                    sub++;
                code.textContent = text.substr(sub).trimEnd();
            }
            this.ensureDom();
            this.code.addChild(code);
        }
    }
    class ScenePart extends View {
        postCreateDom() {
            super.postCreateDom();
            this.dom.dataset['scene'] = "y";
            this.dom['addedToScene'] = (x) => this.addedToScene(x);
        }
        addedToScene(scene) {
            this.scene = scene;
        }
    }
    const onDocumentLoad = new Callbacks();
    let documentLoaded = false;
    window.addEventListener('load', () => {
        if (documentLoaded)
            return;
        documentLoaded = true;
        onDocumentLoad.invoke();
    });
    class ExpandV extends ScenePart {
        constructor(arg) {
            var _a;
            super();
            this.inner = new View(jsx("div", null));
            this.state = "before";
            this.onStep = (state) => {
                this.toggle(state);
            };
            this.scrollTimer = new Timer(() => this.dom.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
            this.step = (_a = arg === null || arg === void 0 ? void 0 : arg.step) !== null && _a !== void 0 ? _a : null;
        }
        createDom() {
            return jsx("div", { style: "height: 0; opacity: 0;", class: "expand-v-outer" }, this.inner);
        }
        addChild(x) {
            this.inner.addChild(x);
        }
        addedToScene(s) {
            super.addedToScene(s);
            console.log('added');
            s.steps.addStep(this.step, this.onStep);
            s.onStateChanged.add(val => {
                if (val == 'show' && this.state != "before")
                    this.toggle(this.state);
            });
        }
        toggle(state) {
            this.scrollTimer.tryCancel();
            if (state != "before") {
                if (this.scene.state == 'show') {
                    const height = this.inner.dom.offsetHeight;
                    if (state == 'show') {
                        if (this.dom.offsetTop + height >= this.scene.scrollbox.dom.scrollTop + this.scene.scrollbox.dom.offsetHeight) {
                            this.dom.style.transition = 'opacity .5s';
                            this.dom.style.height = height + 'px';
                            this.dom.offsetHeight;
                            this.dom.style.height = height + 'px';
                            this.dom.style.transition = '';
                            this.dom.offsetHeight;
                            this.scrollTimer.callback();
                        }
                        else {
                            this.dom.style.height = height + 'px';
                            this.scrollTimer.timeout(550);
                        }
                    }
                    else {
                        this.dom.style.height = height + 'px';
                    }
                }
                this.dom.style.opacity = '1';
            }
            else {
                this.dom.style.height = '0';
                this.dom.style.opacity = '0';
            }
            this.state = state;
        }
    }

    const content = jsx(Prensentaion, null,
        jsx(Scene, { title: "Intro", centerContent: true },
            jsx("h1", null,
                jsx("ruby", null,
                    "\u6307\u9488",
                    jsx("rt", null, "Pointer"))),
            jsx(ExpandV, null,
                jsx(Code, null, `
int *p;
`)),
            jsx(ExpandV, null,
                jsx("p", null, "\u58F0\u660E\u4E86\u4E00\u4E2A\u53D8\u91CF p"),
                jsx("p", null,
                    "\u5B83\u7684\u7C7B\u578B ",
                    jsx("code", null, "int *"),
                    " \u610F\u4E3A \u201C\u6307\u5411\u67D0\u4E2A int \u7684\u6307\u9488\u201D"),
                jsx("p", null, "\u6307\u9488\u53D8\u91CF\u672C\u8EAB\u5B58\u50A8\u4E00\u4E2A\u5185\u5B58\u5730\u5740"))),
        jsx(Scene, { title: "Basic" },
            jsx("p", null, "\u58F0\u660E & \u521D\u59CB\u5316"),
            jsx(Code, null, `
int a = 123;

int *p = &a;
//   |   ^^ （取地址符）取变量 a 的内存地址，赋值给 p
//   |
//   声明变量 p，类型为“指向 int 的指针”

// p 目前是一个指向 a 的指针

`),
            jsx(ExpandV, null,
                jsx("p", null, "\u8BFB\u53D6\u6307\u9488\u6307\u5411\u7684\u503C\uFF08\"*\" \u8FD0\u7B97\u7B26\uFF09"),
                jsx(Code, null, `
int b = *p;
// 读取 p 所指内存地址存储的值，赋值给 b

printf("%d\\n", b);
// 输出：123
`)),
            jsx(ExpandV, null,
                jsx("p", null, "\u5199\u5165\u6307\u9488\u6307\u5411\u7684\u503C\uFF08\u8FD8\u662F \"*\" \u8FD0\u7B97\u7B26\uFF09"),
                jsx(Code, null, `
*p = 666;
// 将数值 666 写入到 p 存储的内存地址位置

printf("%d\\n", a);  // 666
printf("%d\\n", b);  // 123
printf("%d\\n", *p); // 666
`)),
            jsx(ExpandV, null,
                jsx("p", null, "*p \u4EE3\u8868\u201C\u6307\u9488 p \u6307\u5411\u7684\u503C\u201D"),
                jsx(Code, null, `
(*p)++;
printf("%d\\n", a);  // 667
printf("%d\\n", b);  // 123
printf("%d\\n", *p); // 667
`)),
            jsx(ExpandV, null,
                jsx("p", null, "p \u4EE3\u8868\u201C\u6307\u9488 p \u672C\u8EAB\u7684\u503C\u201D"),
                jsx(Code, null, `
p = &b;
// 可以重新给 p 赋值（更改 p 存储的内存地址）
// 现在 p 指向变量 b 所在的内存地址

printf("%d\\n", *p); // 123
`))),
        jsx(Scene, { title: "void func(int *p);" },
            jsx("p", null, "\u5C06\u6307\u9488\u4F5C\u4E3A\u51FD\u6570\u7684\u53C2\u6570"),
            jsx(Code, null, `
#include <stdio.h>

void func (int *p) {
    printf(" p = %p\\n", p);
    // printf 中使用 %p 可以输出指针本身的值（内存地址）

    printf("*p = %d\\n", *p);
    // 输出 p 指向的值（某个 int）

    *p = 666;
    // 更改 p 指向的值
}

int main () {
    int a = 123;
    func(&a);

    printf(" a = %d\\n", a);
    return 0;
}

`),
            jsx("p", null, "\u8F93\u51FA\uFF1A"),
            jsx(Code, { lang: "plain" }, `
 p = 0019FF34
*p = 123
 a = 666
`)),
        jsx(Scene, { title: "Useful" },
            jsx("h2", null, "\u6709\u7528\u7684\u6307\u9488"),
            jsx("p", null, "\u5047\u8BBE\u6B63\u5728\u5199\u5192\u6CE1\u6392\u5E8F"),
            jsx(Code, null, `
#include <stdio.h>

// 交换两个指针指向的值
void swap(int *a, int *b) {
    int t = *a;
    *a = *b;
    *b = t;
}

int main () {
    int arr[114514];
    // ...假装完成了数据输入...
    for (冒泡排序外层循环) {
        for (内层循环) {
            if (需要交换 arr[j] 与 arr[j + 1]) {
                // 我们可以只写一行：
                swap(&arr[j], &arr[j + 1]);
                
                // 而不是三行：
                int t = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = t;
            }
        }
    }
    // ...假装输出结果...
    return 0;
}
`)),
        jsx(Scene, { title: "arr[], *p" },
            jsx("h2", null, "\u6307\u9488\u4E0E\u6570\u7EC4"),
            jsx(Code, null, `
int arr[3] = { 1, 6, 9 };

int *p = arr; // 没有取址符（&）
// 等效：
int *p = &arr[0];
// 将 arr 的地址赋值到指针 p
// 这个地址指向 arr 的开头，也是首个元素的地址

printf("%d\\n", *p); // 1

p = p + 1;
// 等效
p++;
// 将 p 存储的地址后移一个元素

printf("%d\\n", *p); // 6
`),
            jsx(ExpandV, null,
                jsx("p", null, "\u9020\u4E2A\u8F93\u51FA\u6570\u7EC4\u5185\u5BB9\u7684\u51FD\u6570"),
                jsx(Code, null, `
#include <stdio.h>

void printArr(int *arr, int count) {
    for (int i = 0; i < count; i++) {
        printf("%d ", arr[i]);
        // arr[i] 与 *(arr + i) 等效
    }
    printf("\\n");
}

int main () {
    int numbers[] = { 0, 10, 20, 30, 40, 50 };

    printArr(numbers, 6);
    // 输出整个数组: 0 10 20 30 40 50

    printArr(numbers + 2, 3);
    // 输出从 numbers[2] 开始的 3 个元素: 20 30 40

    printArr(numbers + 2, 114514);
    // 输出: 20 30 40 50 4198764 1919810 6553646 ...
    // （大量混乱的数字，然后程序崩溃）
    // （函数读取了这个数组之外的内存区域）

    return 0;
}
`))),
        jsx(Scene, { title: "String" },
            jsx("h2", null, "\u5B57\u7B26\u6570\u7EC4 \u4E0E \u5B57\u7B26\u4E32"),
            jsx(Code, null, `
char arr[5] = { 'h', 'e', 'l', 'l', 'o' };
// 声明并初始化一个字符数组

// 可以用一个循环输出它
for (int i = 0; i < 5; i++) {
    putchar(arr[i]);
}
putchar('\\n');
// 输出 hello （后接换行符）
`),
            jsx(ExpandV, null,
                jsx(Code, null, `
// 把它封装成一个函数：
void printChars(char *chars, int n)
    for (int i = 0; i < n; i++) {
        putchar(chars[i]);
    }
    putchar('\\n');
}

// 我们需要这样调用它：
printChars(arr, 5);
printChars((char[]){'a', 'b', 'c'}, 3);
// 输出：
// hello
// abc
`)),
            jsx(ExpandV, null,
                jsx("p", null, "\uFF08\u96F6\u7EC8\u6B62\uFF09\u5B57\u7B26\u4E32"),
                jsx(Code, null, `
char *str = "hello";
// 等效
char arr[6] = { 'h', 'e', 'l', 'l', 'o', 0 };
char *str = arr;
`),
                jsx("p", null, "\uFF08\u5728\u5B57\u7B26\u4E32\u672B\u5C3E\u653E\u7F6E\u4E00\u4E2A\u6570\u503C 0\uFF0C\u8868\u793A\u5B57\u7B26\u4E32\u5185\u5BB9\u7684\u7ED3\u675F\uFF09"),
                jsx("p", null,
                    "\uFF08\u4E5F\u53EF\u4EE5\u5199\u6210\u5B57\u7B26\u5E38\u91CF ",
                    jsx("code", null, "'\\0'"),
                    "\uFF09")),
            jsx(ExpandV, null,
                jsx("p", null, "\u96F6\u7EC8\u6B62\u5B57\u7B26\u4E32\u7684\u597D\u5904\u662F\uFF1A\u4F5C\u4E3A\u53C2\u6570\u4F20\u9012\u5B83\u65F6\u4E0D\u9700\u8981\u53E6\u5916\u4F20\u9012\u957F\u5EA6"),
                jsx(Code, null, `
printf("%s\\n", str);
// 输出 hello
`),
                jsx("p", null, "\uFF08printf %s \u4F1A\u4ECE\u6307\u9488\u6307\u5411\u4F4D\u7F6E\u5F00\u59CB\u8F93\u51FA\u5B57\u7B26"),
                jsx("p", null, "\u76F4\u5230\u5B83\u8F93\u51FA\u5230 '\\0' \u7684\u524D\u4E00\u4E2A\u5B57\u7B26\uFF09")),
            jsx(ExpandV, null,
                jsx("p", null, "\u9020\u4E2A\u8F93\u51FA\u5B57\u7B26\u4E32\u7684\u51FD\u6570"),
                jsx(Code, null, `
#include <stdio.h>
void printStr(char *str) {
    while (*str != 0) {
        putchar(*str);
        str++;
    }
    putchar('\\0');
}
int main () {
    printStr("hello");
    // 输出 hello
    return 0;
}
`))),
        jsx(Scene, { title: "Function Pointer", centerContent: true },
            jsx("h2", null, "\u51FD\u6570\u6307\u9488"),
            jsx(Code, null, `
int (*pFunc)(int, int);
`),
            jsx(ExpandV, null,
                jsx("h2", null, "\u60F3\u5B66\u7684\u5355\u72EC\u627E\u6211"))),
        jsx(Scene, { title: "\u5751" },
            jsx("h2", null, "\u5751"),
            jsx(Code, null, `
int * a, b, c;
// 这一行声明一个 int* 变量和两个 int 变量
// 等效：
int *a;
int b;
int c;

// 如果需要声明三个 int* 变量：
int *a, *b, *c;
`)));

    var css$1 = "* {box-sizing: border-box;}html {height: 100%;}body {margin: 0;font-family: \"Noto Sans\", \"黑体\", sans-serif;font-size: 30px;line-height: 1;height: 100%;}@media only screen and (max-width: 800px) {body {font-size: 16px;}.ctrl {font-size: 30px;}}pre {text-align: left;margin: .3em 0;}h1, h2 {margin: .3em;}p {margin: .3em;}p.left {text-align: left;text-align: justify;}.code-outer {display: flex;justify-content: center;overflow-x: auto;}.code {width: 30em;line-height: 1.3;}.code:not(.hljs) {background: #333;color: white;}code {font-family: Consolas, \"黑体\", monospace;}code:not(.code) {background: #ddd;display: inline-block;line-height: 1;padding: .15em;border-radius: .15em;vertical-align: middle;}.hljs-comment {font-style: normal;color: hsl(112, 100%, 44%)}::selection {background: rgb(0, 160, 160, .5);}.presentation {/* border: solid #ccc 2px; */position: relative;overflow: hidden;height: 100%;/* width: 1366px;height: 768px; */}.presentation .scene {position: absolute;display: flex;flex-flow: column;width: 100%;height: 100%;max-height: 100%;}.presentation .scene .scrollbox {overflow-y: auto;flex: 1;width: 100%;transition: all .5s;/* border: inset 1px gray; */}.presentation .scene .content {text-align: center;padding: 1em;min-height: 100%;overflow: hidden;line-height: 1.3;}.presentation .expand-v-outer {margin-top: 1em;transition: all .5s;position: relative;}.presentation .expand-v-outer > * {position: absolute;width: 100%;}.presentation .expand-v-outer.hidden {transition: all .5s;}.presentation .scene.centercontent .content {display: flex;flex-flow: column;justify-content: center;}.presentation .scene.hidden {display: none;}.presentation .scene.before .anim-slide-full{transform: translate(100%, 0);opacity: 0;}.presentation .scene.show .anim-slide-full{transform: translate(0, 0);}.presentation .scene.after .anim-slide-full{transform: translate(-100%, 0);opacity: 0;}.presentation .scene.before .anim-slide-half{transform: translate(50%, 0);opacity: 0;}.presentation .scene.show .anim-slide-half{transform: translate(0, 0);}.presentation .scene.after .anim-slide-half{transform: translate(-50%, 0);opacity: 0;}.presentation .scene .headtitle {padding: .3em 2.3em;justify-self: start;color: #333;}.presentation .scene .anim-slide ,.presentation .scene .headtitle {transition: all .5s;}.presentation .scene.before .anim-slide {transform: translate(1em, 0);opacity: 0;}.presentation .scene.show .anim-slide {transform: translate(0, 0);}.presentation .scene.after .anim-slide {transform: translate(-1em, 0);opacity: 0;}.presentation .scene .pagenum {position: absolute;top: .3em;left: .5em;opacity: .3;/* font-size: 14px; */}.ctrl {position: fixed;right: .3em;bottom: .3em;}.ctrl .ctrlbtn {margin: 0 .3em;display: inline-block;width: 2em;background: #ccc;opacity: .3;text-align: center;cursor: pointer;-webkit-user-select: none;user-select: none;}";

    injectWebfxCss();
    utils.injectCss(css$1);
    window['webfx'] = webfx;
    document.body.addEventListener("keydown", (ev) => {
        var handled = true;
        if (ev.key == "ArrowRight" && ev.ctrlKey) {
            p.nextScene();
        }
        else if (ev.key == "ArrowLeft" && ev.ctrlKey) {
            p.nextScene(-1);
        }
        else if (ev.key == "ArrowRight" || ev.key == " ") {
            p.nextStep(1);
        }
        else if (ev.key == "ArrowLeft") {
            p.nextStep(-1);
        }
        else if (ev.key == "f") {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            else {
                document.documentElement.requestFullscreen();
            }
        }
        else {
            handled = false;
        }
        if (handled)
            ev.preventDefault();
    });
    var p = window['p'] = jsxBuild(content);
    var loaded = false;
    var load = () => {
        if (loaded)
            return;
        loaded = true;
        p.init();
        p.useRouter();
        document.body.appendView(p);
        document.body.appendChild(buildDOM({
            tag: 'div.ctrl',
            child: [
                { tag: 'div.ctrlbtn', text: '<', onclick: () => p.nextStep(-1) },
                { tag: 'div.ctrlbtn', text: '>', onclick: () => p.nextStep() },
            ]
        }));
        // var s = new Swipe(document.body);
        // s.run();
        // s.onSwipe.add(x => {
        //     if (x.action == 'left') {
        //         p.nextStep(1);
        //         x.ev.preventDefault();
        //     } else if (x.action == 'right') {
        //         p.nextStep(-1);
        //         x.ev.preventDefault();
        //     }
        // });
        window['hljs'].initHighlighting();
    };
    window.addEventListener('load', load);
    if (document.readyState == 'complete') {
        load();
    }

})));
