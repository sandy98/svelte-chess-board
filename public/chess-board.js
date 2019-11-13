
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var ChessBoard = (function (Chess) {
    'use strict';

    Chess = Chess && Chess.hasOwnProperty('default') ? Chess['default'] : Chess;

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(changed, child_ctx);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, props) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : prop_values;
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement === 'function') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set() {
                // overridden by instance, if it has props
            }
        };
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }

    const chessSets = {
        alt1: {
          size: 95,  
          b: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAMSSURBVHja7FjtkaowFIWd919KsAQ6ECtY7IAS3A7oAK0ArUA7UCuQDtAKwArycjLczCXLIhBY/bF3JoPEEA736xxwhRDOO9uH8+42kgdDOXJsV428mrPHNgLAiAEzR/hqgJ4cBfYKgkAcDgeRpqnwPI978qUAA+wzn88FDACLolAgmRcDG4CjFIkEqI6r1crZbreO7/tvU8VlY9w97+ma36xiHeIwDFWI4zim8BZVnr4sB1PKNRhyD8aKBOM6FKQtQA1uvV4LMqpimYfWIG0AKnAAQl5DBcMQ7iRJ9BzzZm+QQwEm5Jnr9apyDrkHMKfTSc1Tq8ERawyQkwIMCBy8BAAIJQDAoihSDZs8if+wBuBZuOMpAebEGgQI5zhScaCC4TUCRGtx7FvZfQFqzuXhxEA46RxHg0nUHF/f1Yt9meRTS5cwdPb7vf4DzHG5XHSTvt/vtQvBLtKDvIF/TtGoayHjvY6aNP1m4aytMeZH9aDPvXW73ZyyrDOYeW5almXKi0bBjcbFHudZAOxN2uUwSv43luqQRTCJ4u8KsGxRK85yuaydn8/n7zkiU4MXlrTb2EWilDOaLzXiFqlfG7xP9lHaffugFgd5npvs8OMAKKw3emM8BcDAbDVQMc8AEiczj0/GJDWhQIrFkFWNoaUe2fdNbwhAr1IkNTVjCFRBuYr/8CBsPv0NuaVBAljDW5zmXy4a+kotW8EatFSornQj/L4NQGEzTJ6lIhphX0112eA394pfOf0RrRnc29cyziQZhQCbdt14Nps5MsTO8XhU51KsquNms3F2u52iP/x+PB6d9gMDMRZSAF240XXdddVC1KagJaiPLgYdCIC4jjwHKgT9QTcuFotucqm6J6PNL4ltQznoU9xNyf5sUDuha1As1H7aeqQ5wDbshV8VlXJe5UEqFBVeeKOJ8H96cuQfnpx7EHvgm03XSOC+2IPd1zUBnkhESgr7pljahCjloLQj+6Cp8pM+LHXRi8hXSkeIJLMPJpZtgbPEyXKvpKlRRwM3KxrUiWcJMiKA7t9Xfkv7L8AA3CK74jqmCikAAAAASUVORK5CYII=", 
          B: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJqSURBVHja7JjtkYIwEIbxxgLoQDuQDqQErgPswBLoADsIHTBWAB0AFaAVYAdcliHMJgTMB4g/bmcycwcSHvfr3bhr29b5Zvtxvt0W8mBAVw3b9avur9mzLQAYIjBxBVsDunQ1M4D11oA+g/E8r63ruiWEiJD+VwBGUdQyWxLQtopf0ri77tvPfLKKO0/5vt95Twhx0+fpZiEmIuDxeBRDXJhC2gISDHK9XmUFYgVpA8jBhWHYeQ+8iKvaFtIUMMYvjuO4g4MWw67RIpHlI4NcFdDHL8StBUIsenQCMloTsBaLghkOaZqm3L0gCIwqWxeQ09wsywaApmk4L8H/2HD4dbyoC5jiAsAGHsMAMhOKplAF1FGSYTKh4eVuVFXlTN0bHg64wcZbemDlNjydTtp9SfKMvyQgl9RULfTnMtdM8fZLjNOHw2EILc21TUZ+DxeB2EZUDBq6UMnHpau4kTViVROquF6jzXD6C71N1cQ2tFYf5GROVJIpg6YN2vwJJRkNCqC/7wxPOLonPRNAt1eB4YUwDEwZDBMCHPnEuMVBQvhk+QhabTNq2Q6s/rtQCxNMqyNvGHCPDj7GVpbl+Lj3Gh3mCoOtd0zqShtAmfSZShv+3lhJyMzPF7MLcrAoilGIIS8lJzydRXCIK64jE6I8EID2greSJHEul0v3N5U1h6qNQyGdPM+V9nk8Ht3zeIrDHrTSWtlxc679KKqNhz3I5eD9flfOIfjs7XYbXQdvPJ9P53w+K+8zl4NgmUW+sJXio4HFymQjf2lZdQldv/3KF6lgwYOh4bdtJNOJaxmRkLHt/n/lt7Q/AQYAFfZSex/XNLsAAAAASUVORK5CYII=", 
          k: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAN6SURBVHja7FjtkaJAEB2v9r9kIEYgGchGoEYgF4EagVwEnhGgEehGoEaARqBGgEbAzZua4do+PoYVq/xxXdWri0PPo/v1x9BK01S8s/wQ7y7woNFviiM1gimiiybwKEwNAOTgjE7fBaACNBwO0zAMU8dxDMDdWwHc7XYpxPf9RgE2kSR7/Lndbvz617skCbiWTqdT5UHCQfddQgwgqeu6KswaXNxUFrcosFarlbe5rz8vWvc5dsE33/M8cTwe8f9PqSu2xtN2PEINLL5xgDYhdnQtyysfidRQrzESsN/5b+cCW6kuU06dEDs6RGmFnok3hAZGizTsbCzsGFuObYhhdKji67oiCALR7/dV6E6nk9hutzRj8eVThwpenUvtairE5gFkbVR2er2esnk4HMTlchGr1YpXg08eYl5mfAMOfIrjWHQ6HbFcLsX9fheDwUCcz2e1GWtz+Pwt9ZcGtzDgZHare/CQ1+tV2YKMx2N1HfuQvYOqMhPRwovOwMOBQiwNp1EUFfVe31zHmiRJaPF+UJQm6QR6bVPFwcSUDBgmbetBcR0g2QMYVyj+Si8rG9JDpfyDHbImqQKYeYnUtFyFUdbaYs1D9QBlnqOKfei6xlodkmY2mwkZRpUE2oNIErFYLFQy7ff7xltd5h243qZEwAMS0ANHy+jBFRws8yAHmBVUG/5QvoJzhpsgvw04cy8t8lUAs+6BBNhsNlYbGY9DqDerFPZZokVVAF2aqXg6DKK2G9ZR2M2hgmvT6iJuxCbUdRT2ch4+rNOLMy4iZCCyLemrFHZgj1EhrjsPeqT5q0y15aMN75itpO40Q0E+dA5k6jPgcD/ssGh4z0zUAe/BzwDE/ay7hM9O1Nm0rJqsnG7W67XqIphCdAcpP1HpboK16DDdbtf8dNGjmSibqD8sms3aAMRmk8lEzXJQjE9l0m63xXw+F2Z808cBI9umTnXTV9RBXc6ePjQFRYYkl/6erOSUDM3GbDlxU2+VDA0rfcAqDHEZQFfXwwwQpmBZXBWfAMCM/vjEccAIpnADGGsRXlACQMFhBnhEw217qnvoKGb4RN/8bldB9qI4w05Rka5bZhJTAyFNtbuCYdYtAvhR8d5PhQchRIloSmAPlCGhNi8G/pEigD6dnEejUeMvTsFJxvdaZcZ/UWkp0vCVr99eKq3/b/mflD8CDADAOIyuhZwLaQAAAABJRU5ErkJggg==", 
          K: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAKhSURBVHja7FjhzZswEIWq/+MR3A08Atkg3YBuwAhswAh0A9oJSCYgG0AmIBu4PmqjwzliGxyJSn3SfZESc7zPd/fu7FRKmRwZX5KjA3bQ2EYwZTW4QlbF4DNxikDQJmesOArBiRBjTAohMMH2UATLspTyr5OoBGMUyRX+DMOQPJ9P/P3voxQJ5JrknMumafAO8qOEmBtSWZYZcl2sKk4xsTRNqZdn+nPQdiX8tnqdwQ9lP601QvsRKDXuyp42QZ8QM61llHyMykq9xiC3frd/61d8SS1TLCTETIdIOqxHu5FoYlikwU/j4cf4Yr4EfZ2a3TIkS6s4ugA/syy5CGb4IRDetm0nfRvHUdZ1jQsBFwTTVmpyi/SAZ6DCDYwvqHzLV+4iWOPO0Pe9pACi/Kb3Lv5JI+AUgCi8B61vXARNHsk8z+U7VFVlkxR2aIuikC7AGpwyLoLzYhySNVwuFzvUJU4PH0AK4fd6EzS59w5EiGbrui4KwdVefLvd3IMgY4lK9tfeVxSJ2kGvzuF8j7WDfWiI7DyCHYWd9YU1ojlzsAoNMy4ayEnf0FLhBRVxEeT4AdCpkN0IhbV7k8j7dJLFCO+Sm60Avxa5MqQXL5o7qH5MgD+iGwXNgwKLdohsuAB+iH7OtgysInY+wvNE/xV7Jurct6/6VjqVd3sm6sW0DMKsdmH+AQ5J9/ud1FcQaliPcT6fk+t1HshhOv9GEQw9NOX26LTW3tYM5IR4rop1aCoCB09fq2MQzD9EbpVkSA5yrYcLqFDN+XU6nd4OBXCYfzwe0yfk6kq+flf2a0sOvnSUvTIDEzrRQbqtIR5xYcQEcWTgawS/Ou79ZslA8rAbkBrEBcEQcjeTfbg4Xk5zn7zdigH+z95Rp/9v+XfijwADAOtbXobnSuXhAAAAAElFTkSuQmCC", 
          n: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAANISURBVHja7JjtkaJAEIaHq/0vGUgGEoIXwbkRyGaAEUgGaARcBmoEaARoBGoEaATcvLM01fYNLghueVXXVV27CMw89Dc4RVGoV5Yf6tUFFpTaQlKtuVb/WTxdAAFVlNobpGTp4mIO5GpdlX9fJgZH4tgrXe6+Qgz6pVuLLMuKPM8L3/fJ3VkXd/cRgxOCAxSEIF3XLVhcHrUm5fXfBhgTAOAAlaapAQMkdDweS1CCDZ4NGNGGgAAcgAgGwMfjsSDBuSAIJOiX7u8CiAQoPM8zAKvVymap6gGSJDHXARrHoiQFzwA0cRfHsdnUBiYVD4MHgURRJM8HfQKGtDDgANkEkDQMQwMJq4pz4z4APbIeYgoCy7QB5PcCViSP2wXQLQO7sp7FCq0tKWIy6gKY0EKIoTrrIVkAjsyG4v86K6MsIcOFFR8CDHlW1gR6tSnA4EaopbvcJA5kMpnw3ydtAau4g3WoINvgyLIchgp3XbYjs6E2NzcFTLh1sJGseTimmBKBf2MpS7GuEob9lrYFvOm1PKixOKBJRMnxeTvEdbawoHXFgNFqHjSpr8HU6XRS2+1W6cWUdpvSCaAul4t6f39XjuOo2WxG93xo3Tfpt/v952XaC7bZstG4dZMcsBr1Xkt2ZizIfR4CdS7+3PavctPexeQmav4sDtOyVXm2bgOlslPXr7sCJncKbmwZXlMJd896lEAMMGsLeNNB7rwcRTI7kfFUE+sekkKnSxYTZFjenJb/e+xcZTUUXZoF73URXjtFjYzrAB3b9ILs/ELiElhpGKU3Mz8i46F1gnPn81lNp1O1Xq9lBfhNgFzeHny3CSsz61KBMoTSczgc7r8GjkbmgQC6XC75qXVfb3VB2dyLnrUXFydyCkbxhsIqJMPhUJHrSXa7XeViWLsmDODiD8nTFBDZOqeN5/O50olh3AvXUmegLnG9XqvjwWBgHoI6E12z2WzUYrEw9zP5qXm2bV3sUuFGtqKEIAMxIDwyWaP/on/T7CiK9eqRkb/qEDSM9hF3fMhl3SaXLE2y+Be5By6Fu3T76+WzC9ajNRGbtu86TWIwpxt1gX3KN0oei5rHaQv4rd+IJeDLfwJ+qyve3KD/P6L/y4B/BBgADGc0k/blP/MAAAAASUVORK5CYII=", 
          N: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJ6SURBVHja7JiLbYMwEIah6gDuBmwQRkgnKCMwAhuEDegGZAOygZsJSCcgG5ANXJ9rKvdydjB2Iir1pFMSJYHP99/DJhVCJGu2p2TtBhHE7mFc+ig9vxdPCCBACe3RIDFLiMQmEJPe6dfV5OAGfc605GwNOZhrWZXEjDFhyN2HyB0jBwsTrigK0fc9hgQfpLf69w8DbEwIgAI4sK7rMCCGLe8NWNvgJgPIuq7Fdru1gd6UPwSQTzfK81yM4yhcBt8DLCH96IpmCOBP3kGk5towDGpBRDTLmICVKe0SK8uSgtzGAMzM6MGNlhoBOeC+6QvIdGL/XBQkCzFC7joEsDUvBknvKoqmaZS7FgGVT0RxEWBlXghW7roprta2bX2kLnwBMzzKbFGByGVZRvY9W7XDtWwyzwVs59zIUZ3KAdxmaFHcF9BZtSBpVVVUwud4HM5cWO8LSOYS59w1xkpqXtsMCg79fxngFEEAdczXgthlOyUOBRzNPxNR4zpiGTVt5lRyKGDr2Do1xOaV49/dmjihOXg1QSyHoxr/BlqSq6FPhlThSxo107Jx7ZUhKbNFbe4otKmCWZ4de8eL9Hft2HbmTkS2m0SOOPX+fD4rp0wWjfL9fo+/+rRBpNT2Kk3TmzvzyKfLFx2Qq92U77GzxMM9ku1iHDtdlR3DW4pnrsQ1XiXkkqzEZLPZqBw081FVEfveh14ul+R0Oqn38Ho8HpPD4WALwqvk+fCNIDMbN0wHnzOJbQcETZw4UHVLtvy/ziO3TnO+oAhy9Gkzk72Z8k1yxTJIE0NytqTNjPd4auUo2tQX8KHPiDHg6h8BP9t6oxnQ/4fofxnwS4ABAGjNtH1kWDguAAAAAElFTkSuQmCC", 
          p: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAESSURBVHja7JhREYMwDIbJFExCJdTBcEAdDCk4wMpQgAQkIIE56GBHd4yD0S4JZbfk7n+hof2uTUIoWGuTI9spObgJoABGtyGLP8nD0l71MNVE9fgctfZzfSRgPgObK48JmG7AOaWxABtPwAYDCFvHCACr8weEOqwB/nWZuRP7kQPeiP3I66DyTBIVsw6WG3Altg5ik6RCjrNn8RU5zhqDhWcMFjFi0HjCOZm9YzAL9L/sHYMq0F9Lwzqxc68uMAa78T32JNEBbdZS26U5AfUXO7e0k5oDcDieFgnn1LrjpgQsieDevtFUgIoY7tXlUBVqw1RADFUdzJgAveb1+WmyjDUY5G6G20BuWAVQAH8c8CHAAJ5nk7RIFGLbAAAAAElFTkSuQmCC", 
          P: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGZSURBVHja7JiNjYMgFIDlcgO4gdwGHcEN2g3OERjhNvA2cATbCdQJHEE3aDegPiMNvFjAA0sv4SXkAQb44vvhBcI5T95ZPpI3lwgYAYMLRLGuWUg+tQa2klqzzDudPZ/vCFggMNyKkIC5AU60PBRgL4Mwxnhd17NGgH0oQAVOlhXIsIBN0yiAMPYF6JJmbqIzjqPyAY1vofLgWXS6rlM+oPE5VB6kshmHYZjNCxqZl4bMg6UAKYpiBgQtwZWuedD1qrtgv0P+dwl9F3+LTpqmisbfQ/jgjzDlBMX7vp9NDBrGNmbe0wdPa3BCViBPrwZ8BEdVVXxNYN70F/cEfJRXOkHl1+ujmFKqLxTz3DlGiCnXEULwFITpsGhtIElr4br7wteeTUG89Q8eFnOlG9ely7rDnmkGNr/qyiwsK2XXVYb0GSTCrNwUvYZo5tg9fAGWurxnkmfJ2xegUrVshZMhcZXjC5DZ+pxJkE8yG8BPizg6ik6WZUnbtn/OabAe7fvrIw/u9j43nU3i28zeQuILawSMgP8c8C7AAEUmjrvqNJIEAAAAAElFTkSuQmCC", 
          q: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAANcSURBVHja7FjtkdowEJUz+Q9XAU4FcSrA6cB04A6ACkIHHiowVEA6ACowVGA6MFSg6Gm8nkUnyR9wN0zmNLNzPrxavd19u5IVSCnFK49v4sXHF8CHBzjYg4eRkhLTasFz4tFfKKmY/r620R1XD4ChsRiX2AHOpgsb448AmDsWpMiYo/ToL7oC7MPB0PMu7qk//ogiuXjenSy/XZ9dJPAqY2koDELHnpSlFtOZh4OhUXgFe5e5OJh1MJZaCmXn8b+w2Es6FF5mA+iKzspYdNWxKkOLraTFViNDioTGTx3uLBNRFBE1bFX5R/MijsVqteLpHMzBqiO/yjAM4aHc7/euKAKIHI/HsixLreugg7NX2lKcduhZACGTJJE08Ey8YXroi1JFTlZVpfXgVN0bu/TW1NWoY0expLySsXBRFHK32+kIMb2QdBA9gIMuhko16fjA5dRT23aSwgFSkxrAIJTqxWLBF9A7SJ7nGjyAwhkAZduiDVzZZ6vTQAAAQLAI6413C1IamY5UxaOBp2kquUMMiNbB3Dr1JkVaAUacawDEAXDu8VTSexQP5tD/RAnuAHETz/XvUd/DgvaUDBFIig4zrFNMhQCuGZxrHDXBMdDlkNOMLhbV77QxGIVBpI21jUbAN+Idaz/vUk52DO5mQwBGxEMM3jJ4uswosZZi7gzNXHKS6UVDz4MlcQrRofQwwt8JfkfEbe8AjGgCWyzK5SMHVt0OyGMYJ/Hs3V7BXF7htvT2AZjwSmWcGSzcWVd6+x75K954HwVo6YneM8L3DueJv9hF1uu1UN4LFUWhvBeTyUQokrdOPp1O4na7icvlIq7Xq1DFJGazGbftHQFFLwgCX5r1KUQRWx+fDoeDfnE8Hr3GR6MRHcn0PP0doEC+vb2Rym8lB1cEu34XR4+mlReIUWBxW4rbIhjVR6e7EzOigvRSdFzppvTiL6KO6FnGL9tHV4OrBWBJ3yQAMJ/PNQ/BQQxKNRY+n8/vJk+n07v0Auh2uxWbzYaDxdfijyEpTs3NHVWMVsP34a6CnQadAHYgho10SJvJ+T6Lzv9Ig+Y8xI5itKzdkDbTkArpRUpU/3rapZXBWedNQyeAy+Wy4d2zBrjYcnXSWiSffTcc2Irk5S8wg69L9P8d4D8BBgBvjaq/CX23UAAAAABJRU5ErkJggg==", 
          Q: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAALySURBVHja7FiBjeowDKVfN0BH6N8gG9AROkJHYIRukBEqJuhtAExQNigb0A36+wLuGZ8TUgon9HWWjCqS2i+Jn+00GYZh9c7yZ/Xm8gtwsSAGZ8ShGbXDa1fFcxGYvxn1zObvrjbicc0AmAlnXHMPOG0ubKSvAFjjvTRNh7quh6Zp3DPbGSlup40xw263G6y1HOTmFQABYsjzfCCpqoo7/eYDioWQ4N3r/1UswDkk6fFzOp1Wfd873e/3NHb0zd9ut5cJx6PTJSRBXFi2I60I6NwTU9BSMW0DMZgJ4rVszPqO2EYYKxWiNIH1t4q9IoJ4VgPoBkGArutccHvipYpkZaY4LjRb8AWfnEhegCSbzcYHsFEcVz7W35nnAIJsJCGAbquLonAvsBRSaukjy7LQLhoagx12Go2WKzEHPuGb7GkAS09Q85yV0v8wWJblTdzIlETzmOMuYpfdpvjyYO4hSymZjPyGuBHzMj4HuxzIlxq4mqrSvUTdekBOBGnbVnNe81oNwkGwGFEWNXDdnEpSeba+lWQ6n888XiflFQeLEUA023YOQMOPSRpD0HMRddYp6i8XOY5FCdtmbi3ueHPAjYMcUrgzkEIKY7KziQX4jje2Fn+6gtr3l4iu668MnGXf65q16vN0JOayQSO41QjO1XTpa27DamQ80U7K4+PdChK8JpRbiVx8R7UmNrbdmgIaKYVA0rMUOAdpfGMETqSnbkk/WPOE+ywRpLJLABYy6T5DQux9pKM+a93xo6LkxCA3PiJ62k8qdeiOxxSyos5aMFG/Bo7sBXNJqMO+y94Z185CJulAZ+1VHCtYLqpO/oxLk3kEUKQuBmgCd+FnaZAkCYFLksSXB2/KBuJpPCoXW+v1evqPKgUXuvUdDgf3zG6BXBDIfzWA92KwlMWd2qdHBUlcdOveW2HMEd/0bFQFniEi1ag3w5g0k/FUIS7qiwU22UU+fSTNdC8mh9TZJPnpb8OJRpK3/4CZ/H5E/98B/hNgAEg5APunwmnIAAAAAElFTkSuQmCC", 
          r: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAMJSURBVHja7Fj/saIwEA4373/p4LgKxArkOrAD6UCt4LQCtQK0gtMK1ArQCtAK0Aq4fBmWWXOgAeK7dzPuzCqaZPNlfwcnyzLxlemb+OL0Btia4INVXEEBY6IBRJXwnM3xStY9xWEKMJS80zbfsfFpBUA+J9bG4lyuFYBZBYe5RuKK8SQfDx/I8NoCDEiY53lZFEXZbrfLgiC42wj/cYrjWM2n8cFgoObM5/PMdV2+NrAGcDqdZmmaqs2xGf0fhqECBRAADk6SRIGhOfiNdVgPOaYAP+oG1fF4FLPZTEiAQgIT5/NZDIdDsdlsFBPhWQIW2+1WSE0q7vV6QoK2HsV3GoQm8AxtcNJNDvNCW0SkcazXNNg6SFwSBhAg7lt1GL5XchgrUZxwX0KgNAE4Ho8VQBYkv58BNPXBteRfeFgul8qPrter8iu5mfB9X32XEXwUDN+Fzy4WC7U2p+2zjZ1H3YzjONzMMeUs6UOi3++rjS+XSwGijAg85gPkZDKhob3kn1yDbUudLzltYtoSTumwtkysMkzOKm/BvDAZNKNUnJu6UM9+X6QlaBlph2kZcs4mm5qamAi1NQAQmWbUhgACAPArgNHB4gBkZuTBfA4+eroGbXQzd+mmjlmp0ujp5RmOOv2gyx2fRaJxBeIuwOXZalgL6TAXmdOUcKBOp1MqzxbA4sTdbre2Bg+Hg65B76UaPJ1Otbt3RP4rAX5v44OIdg1g1zZAr40PlmjRKEg+6gIkP0IPKNNNkagfEZVEApgnbP8lACkiqQmFJm+328OFCCrMxTrmGkYaNE3UkaUaXHbrcx/hMCl16NHHf12OpXn1+kuljdIKNzGCpKLjWUieVOF4BtDLm9UiekejkbprUP9HTQGvGDA5zEpzqBYD4Hq9FqvVSgf7Q+I4NzFxpN/ccLfAc922X4JUtzx05LirQAZ/A9G05U/oLgGhTVt9/V4COZDHWv+4aT/ocRPhG9fNtgRZJC93Eb9pP5jx5tQ2cV+UOJzGAD/pLZvzX74fdN7vqN8A/zH9EWAAwHuV+iztsj4AAAAASUVORK5CYII=", 
          R: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJXSURBVHja7FjtkYIwEIUb/0sH5Co4OpCrQEqgBK1ArIASmKsAr4JoBdABWAFaQS6bIU5cPgO5O3/wZjKALPGxm919wWaMWa+MN+vFsRCcDViDXaMDvjIkApiqZcSKDWl5bpDHWIIhHxT9OVXuRx0EVZsM3cvqeY0QZB0jrD2Sddwv6vthzxykj6DdV2Zs25YhpWOWi+d5luM44vx8Po9dZZ9g3sljhAd99Y2TJGFFUTQ8EYYhUwF22Aaei+MY/+7PDfETQUqpIBAEQePPVVRVxbg3Gy8Az+sQXOlm/e12E8fD4SBCCliv1xYh5MkOQs29ZV2vV3G93W7FsSxLPOV5bplx+kKpi91uhz1oJIsLOSGEDcI3FdzTKrl0iODYEH9BVGWI9/u9xZPAyvNcXMPxfr+3Pui6rgg/LIfj8YhD/G2qkziqFw0NarKTiDLHR2WIXCULtKkQA/J6tPZSyFqZ1TLsA3OVvyEWHv2Yk2FpmjbqHwbUPSjOYI/6sGU6xE89OYoirewF+7byMkRQRw86ODt1sNlseuczIVg99QJ3jgnwTBN05hD0/UZukVf3oHGC7lxyyIsfpgmSuQSlmNVJktVcgmOUM9jLfnw6nbSSRKcOMlXRGGp5xupg0iZaDYAOhnqEB2PDKqZ17zx1V0dqmdVYU5CRcMQdQu7spFYUyoCfXy4Xdf1hvHMe5RQPJurbQsOXm6apgN0eUtXCi1PFwkOkwqRzpD7e8SGS2VQ9SNQiO6Dx9BoxXwqK/O8sOUNr8M++bnIe9vJ98DdgL9+oF4L/jB8BBgBW3C1aKpC9LwAAAABJRU5ErkJggg==", 
        },
        default: {
          size: 100,
          b: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAC0klEQVR42u2YTagSURSAn+YPlBWvxCRMLZ6JpCCuyorIihCjFkqvWkQSrjIQRdxEENKjhVG81UNBxU3YSohcBRUhuGgjamTRoujnESbRD0WvOp07XGEYHEfFmWbhgQ9R9N6PM/fce65zc7OYxcixC7mN3EEuyE3OhLxFgMUVOQle4sgRXiMauQieHyDYQVRyEVyHFFlyH5ADcnrEm5AVluAb5LBc5A4izwc8YsJNmt3/FnHkN49cnyfITqnFlEhOQIzNe2S/lIJ3x5Dr85UuB9HjFp+E0WgEh8MBWq2WT/ITYhVT7viwLBWLRSCxsLAwLJMPxNzrng6aVK/Xg8vlgmq1ygiGQiGw2WygVCr5JE+KIbiXLyupVAq40ev1QKfT8QneE0MwySfo9XohnU5Ds9lk5HK5HMTjcdBoNHyC75AN0xZcEqrUfD7PCFosFqGK/oLopy0YERKsVCqMoNvtFhJ8IUanQ3q+b8MmjkQiUCgUwGQyCQlmxKrkpQk2aC49ZLtYguuRFntCg8EAPp8PwuEwJBIJpqKj0SgEg0FwOp2gUqm4gmGxT5I9yGcycX/NDYtutwuBQKAvtyLVWexXKBQ/Y7EYZLNZZmP2eDxgtVrBbDaD3W5nsppMJqFcLjOf4W+qtMmQJDaSLI659q5K3aRCJpOBTqcDrVZrIO12GxqNBtNA4PfvSym4rFaroVQqQa1WG0q9Xge/308Ev4tZvewwIh9xDa7h6w86Md9j/UP7wF/0/TWpMkgysRXZgTweIrhGr6RbkG3I/LRFHMhp5AyySAkhJ5Bz9Kr5lyPEPW1eIZeRU7TNWmRxFjk2ybFHtoNlOuE4ldpG0hOcLs+QfeMI3pjwGLuIqJGXE/yWXAcso8gZhJoCHtKcpdGZYIzrowgeGmNAUsWP6F2FG/P04r46xngPRxEkFXcU8Y3A7hHG20zX1xGBsUixeGZ/s85CbvEPlohjwQUcDyQAAAAASUVORK5CYII=", 
          B: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAEUklEQVR42u2YWUicVxTH41L3WsdUU6piDSK4gRSElFpKtVKVWhfEVB9CtUQfal4iioIIZWjsQ4syiAwWpIpS9cEFaRGt1JInF9xw6VgXXOJSMEpNVVr15Pwv9xscZ4ZMg99kHjzw45s7c7/v/ufce84997tx49quzWa7zdQxPzFfOJq4YGYzMDCQYmJiyMnJibhd5UgCv3J1daWFhQWC5efnQ+Aa4+YoAu+5uLjQ8PAwHR4eUmpqKgQaGFdHEejC/Ojm5kYBAQEQt80kONIU+zJ6hvz8/CBwnfnIUcR9wPwREhJC/f39tLe3RwUFBRAJvpfefWX2kDlNT0+n7e1tumgtLS3k4+MDkY+ZMHsLc2Z+gJeqqqrImk1NTVFERAREbjHv21NgJ8Q1NjbSi2x3d5fi4+Mh8lAuB9WtFuKamprMxKyvr9Ps7CwdHR2ZfL+/v09xcXEQuce8o6a4TyCusrLSordycnJEcMzNzVkUL1PQr2rmuvHY2Fg6OzszGRwBMjo6SomJiUJgc3MzzczM0OnpqUm/1tZWJbo/U0PgHTy8ra3NzDvV1dXKwEY8PDzo4ODApN/5+TlFRUXh9z41BJZh0K2tLTOBQ0NDVFpaqkSs2Iu1Wi0dHx+b9S0pKUGfJ4z3VQt85OvrKxKxNcvLyxMCDQaD1T4VFRXo8zfz5lULvI/Bx8bGrA4uiwQaGRmx2ictLQ19FtWodFDzPSsqKrI6eF1dHeXm5tLKyorF35eXl8nT0xMCv1Mrkh+h7kPEvoxlZGRA3FPmbbUEejGzYWFhYoeAYU1iSnt6ekSEg46ODhocHKSlpSWjuJqaGiXCC9TeSaKZA5T2SUlJZunlMsHBwZSVlaW09fbai1OZE41GQ2VlZdTZ2Sm8iJIfEYwkPTAwQPX19ZSSkqKI+0UWGXax1+HFhoYGm9ZeaGgoBFbbtUjFyW18fNwmgcnJyRD4sz0F6ry8vERF09vbKwKkq6tLXNHG5+7ubtHu6+ujzMxMCPxHzei9aG8xf7EH/+PrsRzYWpCcyTrwX9n+2l4ehCduMiHM74jU6elpZa2RTqej2tpafMafuMf4M7cYzVULiWRymc+Zu5Ic5lMmH0dN5ry9vZ1OTk6Ipx2CnpWXl4u1FxkZCZHLzAMmQ5ZZdy+QxyS/zLaHdKCDB7BzuLu7G8HZF1d/f3+Kjo4mvV4vxBQXF0PMHKNFUbG2tiaSeHZ2NgUFBZG3t7fxXgVUR3Lq55n3/o/Ab7FnYqpWV1dpY2NDVMQKaOMNgmLIhXKgL5nXmD/Dw8NpcnLS2GdnZ8fkGWBzc1NkgoSEBOU4EGqLuEBME7I/Nnck3/n5eRPw3cTEBCEPwotSnPbS0jDgdUhhYaFI2rjH0rMWFxdF5Msi4htbBH6IATEFzs7OFqNTvr0iGcXD8qxy2TTy4L5z6R4zMPVyrN9sEYiI+5hJtIEIG573hlxfSS94FoLl3evXrNfmaPYcziuFechUn/0AAAAASUVORK5CYII=", 
          k: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAFC0lEQVR42u1YWUhtVRi+zjnhPJZppWiKZYqCiIIVqShiPiqiIPgQ6oMT4ohDzhM4pC8Ol1SUQHG65MNFxCm8KggJqTlGimOamTj9rW+xtxztnsF7D3QIf/g4Z501ffuf93n27Eme5P8leQz9DJaqRkyDQYthmoEY3Bk0VYngc4bfGM4Fgr8zrDF8oCoEuxl2GC4EgvsC4Q9VheA7DPoMLwWCnzHoMaipmi+OCATt/ovLjQSTWclYMyUQ9JQyry+cYaNMYoEMPzBsCUEA//qRIfwB+UGBHAlrv5SYd2JoYvhVOOOQ4SeGZAadNyWGtPEdLnRzc6OCggLq6emhiooK8vb2Fokget+HabW0tKi/v5/W1tbI09MTc38xfMIQw3BmYWFBycnJ1NnZSY2NjRQSEiKe8YrB7bHktEV/KisrI1EuLy/vvjc1NZGOjg4uONDX16eRkREaHR2l7Oxs2tvbIy8vL8z9gTOioqLo+PiY77u5ubk7Y2JigpycnLDuiMHrMQQbNTQ0qK+vjx80MDBAPj4+ZGpqSh4eHlyTkLGxMU7S1dWVj11cXLhWtre3qaGhgX9PS0vjc1tbWxQZGUmWlpbk6OhIubm5/PejoyNyd3fH2g0GU0XIwSyUl5fHDxAveghRs11dXXzc1tZGvb29FBERQbu7u6Snp0fBwcF8zcLCAif28IygoCA+v7y8LFqjWBGC3xobG9P5+TktLi6+lpwIkIOEhoaSoaEh7e/v833x8fGkpqbGx4eHh2Rrayv1DLgEBG7Axr8I7iU7lwUGBvJNKSkpMgmamJjQyckJrays8HFrayv3MUnTxsXFyTzDzs6Obm9vqaOjA+O/Fak+L2EmiaeSifz8fL42ICCA/P39qbm5mf9+cHBAq6urpK6uLnO/kZERXV1d0dDQEMY3DB/LI/g9AgJSWFgol6CNjQ1dX1/T4OAgNyvMGRYWxvcnJibK3Y/AkvD1Q0VatW/gsNAATCdPAwCiHVowMzPjY5BFShLHspCTk8MJCnlxUpEgeQ/ZPjMzk29MSEiQe0l4eDhfizQCLV5cXPCkLW+flZUVnZ6eclfQ1NQkobIoJM1IvqgKuMzZ2VnmRciP0Fh9fT3Pk5CYmBi5BIeHh/lapCOhXTNSlCD84MDX15cfAFODhKzL5ufnaXp6+s5k8h4KJRNSV1cn/hb72HL3NTYip0GmpqZ4xEm7ECZFOUO5Q9DY29tLXZuVlcXPxFrBx3ve5iXoLplCQ9bW1uTg4EDR0dHcpOPj41zDoiBRQ1CP5+bmqLu7mzcJyAxwG1HDMzMzZGBgAHKzQhv2xlIHkmLtPDs7I0nBGBUHkdve3k4tLS285EHjOzs799aiqojWEFzmZwZbZfSE5UiiSUlJvHyhWYiNjeVNgq6urlRTIjLFvFhZWckbBjyIoLk5ZTeufbKcHrW4pKSE+6LY1cjAnwzvKrvlf4FyBn96qDVUk6WlpXvmRE6UXIP2zc/Pj1JTUzG+ZvhI2W9tG6Wlpfzy9PT0e5dra2vz1ml2dpYnXiR5c3Pze2uQHxHdmAdZIUsoTfACfoUO5aFmHgKRKm0O0V9VVSX2hlnKJBiMfJWRkUFFRUVUXV1NtbW1/wICAVp+3VxNTQ0VFxdTeXm5mMSfK5NgKoJgcnKSNjY2aH19/Y2xubkpNgavlPrfC5oAaBGfbwOcIVSP88fUXnnyKcNXDJ8rCV8I79u6T/9YPomqyz+Q/sFvovNp2gAAAABJRU5ErkJggg==", 
          K: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAEQklEQVR42u1YbSjlaRQfb2MZuvLBtMwqRDaZ8RKJEuslUst8kCL5JDVliiU14tMO+SBSM1ZeylqNKezW1GykS8oMZry3IYbbtFFmjLdd1NDZ83t6/nLNZf5/86+9TU79ui/Pc8753eec/znnudeuXcmVfF1SyfiD4WFtxOwYDoyXDGIEM+ytieCvjL8Z+5LgGmOF4WMtBJ8w1hmHkuA7SdjXWgh+w7jBMEqCoQxnho215eJzSfC7/8O5QYbs5gV7XkiCYees35A2vtWTWDyjm/FWPgTIrz7Gj2fIP5PkSO5NPLXuz3jMeCNtbDLGGPcZjpclhrLRCIdBQUFUWVlJ7e3tVFVVRZGRkQoRPL3eCK2DgwN1dHTQ1NQUhYSEYO1fxm1GLuMfDw8PKiwspLa2Nqqvr6fU1FTFxmtGkFZy15V8qq6upqOjIzorjY2N5OjoCAfvnZ2dqbe392Rtc3OTQkNDsbYNGzk5ObS+vv6JjaGhIfL398e+D4xwLQQf2dnZmTm1JIODg4JkYGDgJ2v4YSBXWlp6oY2NjQ0KDg7GXhPDXQ05hEWEVI10dnYKInV1dSffmUwmcnJyopSUFFU25ufnlWj8rIbgQzc3N9ra2iK1kpSURC4uLrSzsyM+5+bmCtIgqlays7OhsyjT6+JaFh8fT1pkdnZWEGpubqaDgwPxvqioSJON1tZW6B2o6T7GjIwM0ip4smNjY6mpqUkQXFlZ0aTf09MDvWPG958j+FtERIRmgiBmY2NDXl5eFBUVpVkfOSzr42dHtXtI2NXVVU0OFhcXCbUQp1dTU6OZYHJyMnRH1Dwkt1DtS0pKNDk4Pj4mX19fQdBoNGrSnZmZIZQ12VlUyS8oEwsLC5ocJSYmCoLLy8ua9BISEkiOawa1BJEH75FLlrrIeZKXl0f29va0vb2tWqe2tlZpeXla291dKBYUFKh2VlxcLOqhWunr61NC+/RLLkEWuwrC2N3dLdYyMzMpOjqa0JOxPywsTAwDGA5QG8fGxujw8NBMf3R0lFxdXbH/lRzDLi31cFpeXi4KckVFBQUEBChhESfg5+cnCKanp1NWVhah0KO/GgyGk30gg6FhYGCA+vv7Cd2Kv/+L4anHTFgji6hwhtbW0NBAExMTtLu7e24IcWoo2F1dXZSfn0/u7u50amac0Htw/d3Hx4f29vYskkHvRg7GxcXR+Pj4hXnKtvYYXnqP/H8iZJgDz57a0tISeXp6nj4damlpMduDajAyMkIxMTFYP2L46X1rMynOy8rKzJxjQMDsiLkQXQgPztramtme4eFhsx8gq4Ruggv4R29vbzF17O/vWwwf6h9O05LgBBH6tLQ00bPZ3gM9CabY2trS9PQ06SHh4eHKfUY3+QllAiUCl6LJyclLY25uTkza8rKk338vCAtOEa9fAtgA5PXToBfBO4xkxg86IUHet52u/rG8EmuX/wAA3De94co77gAAAABJRU5ErkJggg==", 
          n: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAADJ0lEQVR42u2YXUiTURiA3Z+usbYYy2V/ktBsm1MINi8aGBEhkml3IrsdiHQ3RIggyBoIXnUTK1YQCF3MpGgSBGI0BkU2qDGSIsOEmSv6WTX6sbf3fJwTHx/T3PlOYxc78KDnZZzv2Xfec96X1dXVRm1wD201y11DTlarXBABJFGNcp1IgQr+RA5UU76NIt+oHONqNcgdRB4oxOTcpp+p+NAjF5DfG8hBU1MTmEymNfz/PKKplJwNSW4kxnA4HBAOh6G7u5vM7yN7KiE3I5cYGBiAVCoFra2tJSVtNhskEgkYGxsj85eI83/JHUdesAdrNBoIhULARjqdhvr6+pKSFosF8vk8jI+PM0m7SLFtyGXlQ3U6nbR1vb290NfXB/39/dDQ0LDudgcCAemL0O2+I0ruBLK4mXzbDMlkErLZLJurqjZkC6ICpL7LTzpLCZqvKV45I5IlC5rNZnC73aDX63kFI8gHNvf7/ZLg0NAQmf9CPDyCFuQLWTASiUgLulwuHrlFKsDKHzQ3N0vrxWIx9plTvG9wiSzQ1tYGPT090onlEDxN6/HfmNVqhUKhAHNzcyw2yVslnqvMvbe0cpyVxw0GA+RyOchkMiz2kDcPX9MEv4J8KlMuj3iRvchH5dW0vLwMCwsLLPYKMZUrZ0AuIR10uzPriBSRHM2xH/Stn0OsiLvU9WQ0GmF1dRXm5+dZ7B2ynbdd71zn7T1BBpF9iBnZQcuXA3HRk1ss9aXsdjsUi0WYnZ1lsc/ITt5t3k8ryJrsIZM0R+Unfhp5jLz51/a3tLRIpzgej7MYefu71FaTDtrCP0J0svhh5Fk5+en1eiXBaDTKYu+RRlFlbyv9uwW5yXO6fT6fJEjuVxpborsgtFG9y3v9sIaB9Ig09lSxK6rHRTX3Y1dXlyQYDAZZ7J5IuUNqmwcmSFsuwg2RgtNqBdvb25WC10XJNSqrAg/kol5ZWYHh4WEWuyVK8IiopnVkZASmpqbYPC3qd5yQKEGtVgsTExPgdDrJ/CuyW4TgqChB1gh7PB42HxQheEakoIIZEYKkdTpGc1EkR5FAJX91qI3aKGf8ATh4ueed9+0FAAAAAElFTkSuQmCC", 
          N: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAADp0lEQVR42u2YX0hTYRTAdX9kTdQcbWr/ILEIU4ReQtZTDEHIsLeIEFR6EJdvIkKCQlMEFdlLrkFhGIQPZXNKkCDSmBb4b2YEmzWHkmCTba501HY653K/mKXi7m5jDzvwe7l3++7vnu9833e2tLRUpEJwSJJZ7glyM1nl7iCAjCWj3BVkOy8vjwR/IheTqd5akB/FxcWwtLQE+fn5JPk4GeQuI29pWuvq6mBzcxMoWltbgZ9qC/+ZhIcMMSCRkpISmJiYgOgIhULQ29sLBQUFJBlGHiDpiZJTITbKEGXqsNjY2IDa2lqWzSnkTCLkxhUKBVitVk5iYGAAqPbsdvuBokajkUm6kAv/S+464pTL5TA8PMw9uL29nT0YioqKIBgMHijZ3d0dLXlCTLHjyCMaXKvVwtzc3J86m5mZgcXFRVhYWIDp6WnY3d09dMorKyuZpFUsuRvIF6VSCZ2dnRAOhyGeWFlZgczMTCYZ12lDU2CigSoqKrgsCYlAIACRSGTPtebmZiZoFyqnQD7m5ORwW4Xb7RacMapRv9+/59ra2hrL4i/kkhDBbCTY398PTqcT0tPTufoSMp20R+7s7Pxzr6qqimVRLzSDHsoeLQKLxSKo9urr60Gn0+17r6uriwk+E3pKfCosLITc3Fzo6emJWW5oaIgTmJyc3Pf+6OgoE3wntA7dSAgxI35awazY19fXYWRkhFvVjY2N0NTUBGNjY2Cz2UCv10N5eTn38La2tgNfgBoKXvAzooxVTo48RMr46f6gUqm4RoCmJjs7mw2+g3xFvGyzLi0thZqaGhgfHz80w6urq0AbPn7nG6IW2q5Tf+eXyWRcHTY0NDCxOeQ2cg7JQu7R9erq6iOXgMfjgYyMDBorgJwUOs3n6QSRSCRhtVodXdSyqM8co6OL7m9tbR1Z0OVygVQqpfG2kVPxniZlfAv/HpFGXb/KFzmYzeaYFpHD4WAvTOWhEevYy4rK2gt6gEajgb6+vphXOa1uXtDD77uiNqqvaXBaxV6vV9AJQ90QL+j4a1biDiMNTP1dPGEymZjgGzHltDQonRDxBm3+vOBzMQVf0m8Mn88Xt6DBYGCCT8WSo5Xm6+joADEiqrt+JZbgNRpwfn5eFMHBwcHoTV+UX3t3qXHYr3USEsvLy1wbh+N+R06LIdhCp8XU1BSXxdnZWcHQbxoahxpiPou3xBC8T4PRW/NvLhj6Ph6fHGL+0XQWqeBrUUx0/JGZsH8dUpGKWOI32DG/8ZSL6t8AAAAASUVORK5CYII=", 
          p: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABYElEQVR42mNgGAWjYBSMgiEBRIA4D4iXA/EyIM4CYv7B4jhzIH4AxP/R8HUg1h5ox4kD8UssjoPhu0AsMJAObMDjOBjOH0gH7iLCgasG0oF7iXDguoF0YB8RDqwbSAeqAvEbPI57CsQyA52TS/E4MGWgHecNxA/xOPA2EDsMlONANcc/ItLgTyBOoqfDWIB4KhEOQ8ed9HCcKBBvgloICr3fQPwLR0j+g8r9RpJfTuuaRRiILYFYC4rVgTgQhwNBDnMFYg2oWm2oXro3IkLxRKvLYGjNzMPjwO6Bdhw7ED/B48BrQMw4kA70IyL32o62ZnAAXyLLv38DEYpyQPyChEL6HrT1TRegCMRXyahJTgOxJK0dFwDEz8hwHAzfB2K3gWhWkYrT6FlbkIupWsucpoEDd1LLcaxA/JYGDrxHrVqGDYg/08CBoCqSiRoOZIQWtKA040Ql7AJteo2CUTDoAQD3o0UpmCZENQAAAABJRU5ErkJggg==", 
          P: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAACvUlEQVR42u2XT2iScRjHp6TpPNSWIW0RxpDCgQwRQ1DWcoYQZh0SEbzo7OBgsUN4i64RdutoeGosRoduJV29DEX8k4hYtpUzqIOEDJW9T88j7ztoIg189WfgFz4gr+/7+uH3vs/veZyammSSSSb5L6JGNpAt5DUSRs6Ni9wNpCqXy8FisYDZbAapVAp4rIgsspbTID9MJhMUCgUQkkqlQK/Xk2QFOc9S8OnMzAwcHBzAyZTLZVCpVCT5iKXgB5fLBf2yvLxMgm9YCn70eDx9BZ1OJwm+ZSn4QqvVAsdxPXKHh4eg0WhI8AlLQR3yMxgMQq1W64oS+/v74PV6Se47cpl1JT9GwO12Q7vdhmazCSsrKyRHrLGWu4N8Jbl6vX78ePf29sBut5NgGbnJSm4DN2QuEon0LZL19XWSbCGBUYqdQV5StwiFQlCpVKBUKkEul4NsNtuFPtMx2gt9Pp/wuJ+NQu4i8o5+UCKRcLOzsx2FQtGWyWQctTqlUtmFPtMx+o7OwfM5XnJr2J3lAmJB9DzXkPsksL293V05Ih6PkwyJOZDr/LmL/LUjHyIe4CpBo9E4fvdoy5menibJ1XGYZl4ZDIa/iqPT6cDCwgIJPmctdxb5Fg6HeyqYL45PiISl4F16+ROJRI/gzs6OUL02ptOMTqfrPtKToY4yNzfHdJpx0QrFYrG+G3U0GgV+ixn5Kl5B6jabDY6OjvoKtlotWFpaIsnP/PQ9klxFCvPz81CtVuFfKRaLQNsQXrOLXBq23D2kRnKZTAZOm2QyCWq1miS/ILeHOlY5HI5TrdzJUG+2Wq1CZT8UvVvQjTc3N2HQBAIBQVLULrNLQ6hYMRqNJPheLDkZ8ou6RT6fh3Q6PRD0/9nv9wuVLUqXkSO/af4jcMwaCOE+1CIRqRiCEn6jpXfmlkis8qPXJJOMff4AhKhv/Cht2GwAAAAASUVORK5CYII=", 
          q: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAADfklEQVR42u2YX0hTURzH3dwG1WZjDSywCaIEPcjKaIRp0XL0kCIJhogkPoh76UkW4jCZoQ4jIinKIu0fJuvBUDEb9WDLiILUrSAK0wmF9WIR4XLz1znj3nF2Ovfa3L2jh/3gA17O957f957zO39mRkY60pEO2WJLAlptKo1pEH2IJcRLxAER7R6ED/ENcTvBj9pwuBBA8BmhZ+g2Iz5Q2gupMPiGSoqxMHS7GbqPqTB4hUr6CWEQqLt3lPZOKgzi6fQSSc+IaJsIHa7FbalaKOeJxHihKAV0TwjdjVSu5BfU1J1gaI5SmrcIhRTJ93F15kaYGO243n5QyV8zdE8pzW/EToYuG3EOcQ1xcD1zexG/iE7nENspTSljdWKOE5pD/6Dh6zlAfUSpmMHLjE5PUZrTAsmfE5pHAhon1VclQ3MvkU14jfFFtwSSY/Yjdom0P6T6MiPClOaSmEEj4hUhjiDOUhq/iIExxAORdlwyaqKvZm5a+Xa/QJ3GxSaEFeEhXnzMvYjP0p8iBtYjxNV0Njea5IfZELpEVvNW7kJAnrl9SZgj98M54nkZsWOjW46dkWBNApMkjmT2RFwv7yU2RBLkbj1JRZOMBpulOFlw4X6Vwdwyt2tIEldlMHhXyssBffCDwWAAq9UKDocDBgcHwefzgd/vh0AgAFNTUzA0NAQtLS1QVlYGRqORZbBSSoP48rmUlZUFdXV1MD4+DqFQCPiIRCKwuLgIs7OzMDMzA8FgEMLhcKx9dXUVvF4vNDQ0RD8M9fVdyunlY6KioiKWcGRkBOx2OxQVFYFOpwOlUhkbHfy3VqsFs9kMjY2NMDw8DCsrK9F3a2tr6XNbsriem5sL2KRer2fWlcVigeLiYmYbHv3y8nLIy8vDz/flMHgRG6yurgaNRhOXPCcnBwYGBmJT2t/fDyaTKU6TmZkJVVVVUFBQgJ9vyjKCeHRw9Pb2xiXPz8+HycnJmMHp6WkoLCyM03R0dETbbDabbCM4UVJSAm1tbaBSqZjTiKcQj7DQ1oJXPGdQ8hrEt5gvNTU14HK5oLOzE3p6euJwu93gdDqhtbUVuru7/2rv6uqC9vZ2qK+vl2UVH8M15PF4olvIwsICk/n5+ShC7fjd0dFRfgZOSmUO/xIbUygUoFaro1tIMvB9oD6fifxcTShwJ4e50+SIRPB9qdL/JEzH/x5/AACs1FXqy4cMAAAAAElFTkSuQmCC", 
          Q: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAEvUlEQVR42u1YW0isVRQ+at6TNAdPoYl3JRVTxBuaYRGBPshBTbylL1Io4uVgDwZJqKBGeMHIDMU0VErBB7UxEjWPIoqpRwMxDPKGN7TI+2W1v82/ZWb8NdSZoQc/+PCf2d+/9tp7r73WGh89esADHqAzWN5C+6I+HTNh/Jpxg3GcMfQGrT/jCOMW47e3XNSd8ZmzszM1NzdTUlISsc9rjNYyOgvGxdjYWGppaSEvLy9ov9CHg7/m5+cTsLS0hEnBYBnd6xibmpri2pKSEuh+14eDXzo6OlJtbS3FxcVh0j8YX74m7n6Ljo7mWnd3d2hb9OEgjvMnaefAj2/QfqiiQyza6uuifO7j40MREREkXRTDa3Q/BwcHU0BAAHTf6PMmj6Wnp9Pk5KTYnScymncwNjg4SHl5edDMMxpoY/JAxBljOaOjzDji7e+Kigoe/GFhYZh8UkY34OvryzUNDQ3QnDC+JqN7zFjCWM8Y/l/OBTAehIaGkre3N4wuMb6ioXkTO9Pf388n7+3tFbsYo6KJxHdtbW1cMzY2JqcR8Tzn4eFB4eHhZGhoeCLZvxZ1QUFB3Ojh4SEpFAoY/UBDk2NpaUkrKyskEBgYCN0zFc2Pnp6edHp6ysd3d3fJ1tYWmk80bMXC1tbWFtdFRUVB892NSdjNzY2Wl5dpfHycrKysLmRW1IwLooquri6xQ0GMnnhuampS04SEhGC8W8PWG6ampmcDAwO0vr5OCAn2Xc1NDioYJ8zMzMjIyAjic8ZPNTTPU1JS1CY/Pz8nPz8/6HsYf8AiT05O1DRZWVkiZIxVbD1FbLKjJQsLC4w/vyZO1WDO+Dbj9yo5rF96EbX0n6qqKtJER0eH0FJ9ff2V8cbGRowdSzH9WNpN8Q4W9i6j1W1u80toCBwcHAhBLNVcNAk0NDR0xYGzszNycnLisXZwcHBlfHp6mgwMDEQ+XHJxceF69rzH+OpdU85HLA6pp6eHMjMz+WqNjY0vEPRyqKmpodLSUtkxXDobGxtuIzk5mWcB6XPhfXIi4mUhJiaGT4KjQ229Dri1mrGnivj4eKqsrOTPiYmJcO5Pqeu5F3g9nZiY4IaPj4/p4uKC7oKjoyP+d35+Xhz3U21UFgTuZkZGBmkL2dnZIvYU2qq9XyFp7+3t3du5/f19sre3h4Ot2mwOeOFHWVMFkiuCHf1ebm4upaWlcebk5FB1dTX19fXR6uqq2jvDw8MitcRq00E0nxuFhYW0sLBAxcXF5O/vTyp5jN9IpA5XV1dR1i6JClFUVERzc3Ois/5Lm8croGRl6XJSFPeysjK+I9vb22q3F887Ozs0MjJC5eXlFBkZefmeZOOZLnrABuwSOpSNjQ3Z+EJNVSqVsmNoCDo7O8nOzg4OtuvCwSokbfR2Il0ILC4uUkJCwuUu4RmhoArsamtrK1lbW0PTqJMdFA6kpqaqTT47Oyvaek60WqOjo3LNgqBOdlBpYmJCBQUFtLa2JnuMdXV1vFKgu9HE5uYmvyjm5uY6iUF0Meu4FPcFFqGLW/we+sP29nZ+nOhM7sKZmRnq7u5GwwEn39eWc/gl1oPaCcNoLu9DYYPZ/OWGn6u3Aoy8JVWTKC1R2Hrh4Z+ED/i/418jpjudlF+5UQAAAABJRU5ErkJggg==", 
          r: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABzklEQVR42u2XPUvDUBSGDTRpiyCioDi46CAIgihCN1FJF6uOUhD1B4hLnV1EFxERB7VDB3Up1C/E2K5CBxdtQ6GIiBXcbC2Ig4h6PIEbKOGCtfce6JAXnukdzgPJPblpaHDjxo2busg2coYcMc6RGdZpyA5y6ujHWd+C7CMnjn5MpuADAg42WaciRU4fYX0b8sPp52UKXnEGbCA+pBUpcPol1ncjZU4/IVPwkjPAGnqPPCKfnL7I+ifki9OPyBRMcAaIMiRT8JBAsFem4KpkuXekQ6agH1mxT6OiKOD1ekHTtKrweDyVcreyH29lgtbLHw6HoVQqVU06nQZVVYHtQz/10r4JhUKQSqXAMIw/SSaTEIvFwOfzWYJT1HIqWxu1vnsL1ILWUn4REFymFuxiJ7BWwS1qwX7kW0DwgFpwWHD/GdSCk4KC19SCc4KCd4hCKRgRFHxGGikF1wQFy7K/wc7sCQp+ID2UgolAIACmaUI2m4VMJlMVuVwOotGoLdlHJTeLvOq6Dvl8/t/E43Fb8AJplynWhOxKvg9a/zB6Pd+mbQZkCJqEgtMybtIFQsFFUcFO5I1QcF1UcJBQzuJYVLCZnbZRAoLs+ubGTV3nF+nlg7kw+H6AAAAAAElFTkSuQmCC", 
          R: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAADJUlEQVR42u2YXUhaYRjHs9I0aSwNpQ8pXLBYDcbWCCKyOVYXQ6Wr3Ywp1OXYjV5IH7sxB2FjLKltlzWhm/bFUK/bRbAIFyOIMWQGg4JqxZIUU589z+E1Rjd16n2hCx/4ccC/55yf57zveZ9jSUmxilWsYl2ICiKfkHeMz8hDlqmQV8jHY/l9luuQWeTDsfwuT8G4yWQCm80GfX19oNVqAT97wTIlst3c3Ax2ux2sViuoVCrK3Sw3IPnW1lZwOBzQ3d0NpaWllLt4Cn4ZGBiAQrW0tNAJniNqRI8kxsbGpCydToPBYKDcw/IryO7MzIyUJxIJKC8vp9zGUzBKv54qn89DfX09nWAX+Yn8QjJDQ0NSvrOzA2q1mvJtlq8j2enpaSlfXl6mjLjDU3Cebh1VLpeDqakpGBkZOWJ4eBgWFhak/ODgACYmJo6y0dFRaRuLxaScvscEb/MUDLW3twOPikajBcFrPAX9SqVSuhJ0i89aS0tL0NbWRnJJpJanoAbx0Wy0WCywuroKqVQK9vf3TySZTMLe3h5MTk4WxuY33rf3/+plgx+qqqpAo9GcCD2SaMtu6yz7sUIr1tnZCT6f79R4PB6oqKggQYdoOXoor4+Pj8sef0ajkQQfixakh/JWMBiUJXd4eAiNjY0k+FS0oJlmYCgUkn0FaanDfV+KFryB5MLhsGzBrq4uEnwrWtBCs3FxcVG2IDUSuG9EtKC9rKwM1tbWZAu6XC4S/Cpa0FlZWQmbm5uyBd1uNwn+QBQiBd01NTXSCiG3/H4/Cf5GtCIFn5nNZshms7IFqd1iLVqtSME3HR0dZ2oUIpEICaaRqyIF5/V6vTTgnU7nqRkcHISenp7CenxdlNwj5I9Op4OmpiZoaGiQBe3DBMOIkafYJeQ1Hby/vx82NjbO3A/Ozc1BdXU1SSaQe9y6aerjAoEAl46anqE0jtnVvMlD8DuNI54Vj8eBOnQ89gMenfTRKyWvymQyQJMNj/3kvIIm5K/X65Xa/JWVFS7Qq2ddXR0JBs4reIvGCv0TQGswbXmhUChI8P15BS+z2WYVQC9r34pVrAtd/wCkmK79XfCowgAAAABJRU5ErkJggg==", 
        },
        eyes: {
        size: 80,
          b: "data:image/png;base64,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", 
          B: "data:image/png;base64,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", 
          k: "data:image/png;base64,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", 
          K: "data:image/png;base64,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", 
          n: "data:image/png;base64,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", 
          N: "data:image/png;base64,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", 
          p: "data:image/png;base64,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", 
          P: "data:image/png;base64,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", 
          q: "data:image/png;base64,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", 
          Q: "data:image/png;base64,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", 
          r: "data:image/png;base64,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", 
          R: "data:image/png;base64,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", 
        },
        fantasy: {
          size: 80,
          b: "data:image/png;base64,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", 
          B: "data:image/png;base64,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", 
          k: "data:image/png;base64,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", 
          K: "data:image/png;base64,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", 
          n: "data:image/png;base64,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", 
          N: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAAtCAYAAAAz8ULgAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAzwAAAM8BRrlxRAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAArUSURBVFiFtVh5cBRVHv7e9GTO7tczk4MAEmMgC6IsrCArIuCiAVk5wxVMQESiLIoU4EEREWFXi8DKVrhxMQgIcgkiwq6gooWKu8shEYq1PAJyJpWEzD2T6enf/pGZZM6Q6PKqXs2r7t+89/X3+37fe92MiPBLGmNMSE1NPUxEP9bW1j71iyZpZdO0NjA9PX2CTqcrZoyZQpe6pqam3tOtW7cCWZZfu0X4GhsRtapnZGR82rdvXx/n/AKATgDyCwsLHadOnaLc3FyHTqcb39q52tpbHZienr5n3759VF5ernDOL+h0ur8uXbpU7d27N23cuJGsVqsdQHcAuZzzv9lstp+MRqPTYNB70lNTvwIw9JaDtFgs68vLy4mIqKSkxMcYC+7du5cqKiooOzubdu7cqXLOL5vN5qmc82tGo7EhPz/fsX7NStqx+U3Kyc5ycC4dAtDhloHUarULly1bplZWVpLT6aTS0tKG6upq2rFjB5lMJvr6+HFaWVbms1gsjlSb7X0AIwBM5JwfHNC/n/Pns8dpwZynAwaD3gnggVsCEsD0OXPmeI8dO0YnT56kcFNVlYJKgIJKgJSAn9xOO216a6N6V/fu9bIs/wCgnyzLf+ei6DYa9C6bVT4jm815twSk1WrdX1ZWFqCIpqoqBYMKBZUGUhr8FPB7KeDzUIPXRX6Pkz46dIA6tG/vsMjyBgDZAGQAM6xW6+a0tLRP9Hp9KYCe/xeQAIZ17drVoShKBMAgBRWFgoFIgO4QQAf53XbyuW5QXdUVeu6ZP3lkzi8DGGIymWpTUlKC81+YQ6VLSlSDQe8AoP1VIAGInPPq06dPNwMMBkPpbSClwRcB0El+j4N8rnryOW+Q11FLXnsNeeqrad+ubSrnvA5AXwDDZM7dNZUV1C23s8NmkStssngYAEuE4aZmbrVay4qLi3mvXr0a/6SqIGrsoOYxqSpIbbwfdT3U8x4azPa+u8VqkeWPAQQ0gub6hvKtmP/cNKlk1uM9nG7fIAqxEttYkuuNNxlLtVgsF65duybq9frQ4tQIUI0Yh34bU6M2jxPEVJw9h0dGjnM6na5psiwN0Qrau4NBJSPQ0LDW5fGtSISjRSY1Gs3Y/Px8ptfrItgK9SZgMT2C0UT3776zG95ctUIURXOZ3e58MUWn36fTGx0il8cZjcYSxpitTSBtNttTk4uKzKQSVEXB+g0bUFhUhFGjx+Czzz9vZigEHHFSoOZxOIZUDBsymM0snprKubTv+vXrp91ud5fiJ6f1KyoYt0iSxM9anW7GWDur1fpDddV1sba2FqPHjEFmu3YoLp4Om1VG55zO4JKYPNUUYjQOcOOvqqoYOGSU/dz57yYDqMrMbPfJod2bxUHDxtY4Xe6MSH0mZdJgMMx4bNIkDWOAzWrBq4sWYlLBRMyfvwD1N+pDABMUUZhRtWVGGRFKl5TIkiSuBHCiru6Gzn6jBgD5AQg3ZZIxJoqiePnstxVyxw7tm57ebnfg6NFPMfzRP4IxxLBFEYCbr507/19oBQG5OdnRYEPjUQXT7Mf/fWIW59KMEXmD7j3xzbd06WrVWqfLM6dFJg0Gw+wJ48drGwE2s8UlM0aOeBQMSMBWBMCIAvvw0Ec48slnMQXUHPP6whdkk9G4vL7eMeq9A0eWX71efUkraO5qkUnGmEkUxSsVZ05bOnXs8Kstx+12g4FgMOhBKsWnnwhPzJznOHz02Ms2W+qdgUBArqur2w1gf1iXcUyKorhkwoRx2ts6dmiD5TSzGtvVoIoUrTbpfSIVi16azXUpuld9Ph9lpKdNuK9vn81Wi/x5wnQzxu4zm0xPLV+6VIy3k4hxnOVQdEwE8OJZc93lW9+NnyfCT7M6ZuKRhwem2O32s1euXK1fvWwxNxkNPRljt0eBZIyZuCTteWfrZkkUzS0w1noTDwYVHPvyX1pdijZKh/GsEsY8mifZLPL4YDC47YND/wx2uaMTdCkpo6JAyrK8pqjoMdvAAf1vYifxBZKM9YqKc3B7PHqb1ZI0Jjz//X16wef39/V4ve9t2/W+e/4zU7jVIr0mmU1zGRGBMfaHrKys/d9+c0LS63RRFhL5tGHLiRR/rOWE9VtvtyNvVIGz8sLP4ncnjjKLzGNi4gtw7NTnbnx98swEs8mYxxieVpSgXq/TfqlhjJk559u3b307BDBRKqnpiTdteQdbt+9Majnhih458XHnxZ8vn+/Vo7vDIksJUh0jG1XFiKEPWiTRPNbl9rzkcnszff4GXu9wP6zRarXTxuWP5n1635NU/JHXJ44bjYLxo9Hgb4CqKFFScDgdKN/6rto/b5Sz8sKlPSajocuqZYvl6O0xeQEOHvB7xhhGAQAR+YgoAABamfPpkwsfM61euw7Tpkxu9LOYXaEpLSpBYBqUrdmgrFi13q8EFGY2m5SO7TMDsixpTp05KwgaYa/d4TjMJXH5yy/MknJzbo/RYvjMGe+1HdqlQRLNJsZYDhH9FK4Xrdfn7cwYcPDgPzBpfD70+pQE+23juLLyIgoen+68XlV92Ol0zSOii4wxa01tXTaAVABfaDSahyXRvG3VssXSIw8NZE1yidV2AgJAKu7v01PYfeBIPwBNIDUA0OPuu3Bw/x5YLDKIVPj9fsx5fj75ff6mdO7YvVcdNHSE/YefKqfdqLePI6KLobTcIKLTAL6SubQh67YO2w/seIsPHTyAxdtNhA5VNYFOVWR36mDSCkJ2pH9rjEbj+8/Onut1Op0gVYWj3o7pM571VVVXq7oUAbV1tSiYMt31Ysnic3aH87eBgLIndpdijPWQRPP3Y0cOm3Ds0C6pW25OzIEj1tKSaLQx5RpJNHWLmh+AgXNpSUpKytMZaWnBS1eu6n1eL9vy1jqj3+ejeQsWuXw+f6nH41lKRMFYgIIgDDebTdvXvfEXKe/B/vHpbHHPj4/5z+lzmLlg6Vc1dfX9m0CGDxiMsUwAEoAaq8WywuP1ThTN5i9q6+pmE9H5WHAAYDIZn+eS9Mrut9dIXbvcEeensV4bBTIKfPP4yrVqjJg691K93ZkVBzImfQyAQERKInAAwCVpbU52p8Id5au4LaTlxFUba/QtxahQAgp6DinyeH1+c3gtbSIAoSNSUoBGo2Fe1y45hQd3lXOtIEQZdDJnaC2jGg1DilZLjDETEXmANnxEDTdBEIZbLfIruzat4VpBaMMrRGv2/EawQVXVAAi0yGSyxhjrIXP+zntb1nGZizE+13Iab/aaQRExwWCQhXebNoOUufTBptWlcs7ttyWo3OQG3RoTD8cogQAYY1FSa3W6GWPD7vxNF+v9fe9pMVWJ9/zkh+JYubg8bmi1gjdy7VYzabXIf573zJNy/KLJ7aQ1lhMrF5fLA0EQPG1mkjH2Oy6JXR64r3eExqLFH1ACGF44Ez6/P2lMXBFFMRo6H1y6Bq1GU9lmJi0yL5k78wke73PN48NHv0BWx0zoQi9dbTXxcMyRYyc8dXbn9jYzqRUEOT3VypLbCWHzzg8wZfzwNlpOPKMff3lKIaKDbQbp9fnO/lh5qWnS2NOLy+2GhYu4t1f3pDFEMQATvLh9X3kJAUWpIaKrkeu3+H2yKYixgZkZaR9uWvm6lHtHFgg3s5zwZ+SbeWVzTFVNHWa9utpx8UrVzIaAsq3NIAHAbDJO1ut0C30NDZlRNyhu8AsaQSsITlWlN1web9yH1P8BxU5uiKjbLCAAAAAASUVORK5CYII=", 
          p: "data:image/png;base64,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", 
          P: "data:image/png;base64,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", 
          q: "data:image/png;base64,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", 
          Q: "data:image/png;base64,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", 
          r: "data:image/png;base64,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", 
          R: "data:image/png;base64,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", 
        },
        modern: {
          size: 80,
          b: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAtCAYAAADC+hltAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA6wAAAOsBK2zXwgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAf2SURBVFiFxVh7bBTHGf/NzO7t3d6Th1/IBO/hR7DBYCWtGtHSAIFUoZVShUatCoK0eZFW0FQ8klalCS0iKo8WtYSGVwKpQkKiiIhITQhPg6Bt1AKyHQwJO4mNz/h8h+/se+zd7e32D7DBr7vDZ9pPGml35rff95vZ334z3xLTNJGPca5Kuq4vicZiqwgAWZY3CoKwV1G8iXz8CnmxAqBp2rKGxqb123fukQlleO7pn/xxavUUGcCf8nJsmmZe7fz5c61fnznLLK+uNSun1Zmz5n3HvHDhQmu+fmk+k+JcJSCE6bre15fSdYCAca6SfHznRUxRvKbAhK3Lnvqp5nQ64HQ48OSSxZrAhK2K4s1LvGQUxD8BwGVd160AIAiCBqBSUby+/xuxy5cvPRAOd7/30eEjjrP/+tRFKcXMB77RPW/u7IjL6VxYWVl59n9KjHOVRKLRtW1tbT9f+/L68YHgdTBBAGUMTBBQXFSEX616PlBSXPQX2WZbN5LXOiKNhcPhHS0trauf/dmK8R1+/6DxzkAQa9b+bryv/drqnkhkx0hi3DGxpqampclkcvHKVS/It3+NAy2dTmP95q1yKqUvvth8celdJca5OsM0je0rfrlSCoXDWfE9PRFs2PJnyTTM7ZyrM+4KMc7VcZFI5JPf/PZl65Uras4BWq624dXde62xePwTztVxo04sGo1uf2v/2676+lNDjs+onYrptVOHHPv3hQZ8fKzeFde07aNKjHPVq+vpR3bved0yHKaqshJVFRXD+jj00RGLYRiPcK56R42Y39+5cdfu3XIymcwFPqSlUikc+vioHAp3bxwVYpyrEy0WccGBA+/mtfcBwPFTZ4kgCAs4Vydmw2Y99oRCoXX79r1picfjYMItuM1mw7NPPwXJKoEQioryyQAhKCkuAiEUKT2Nd94/iJSe7nsmkUzi8PF6y/zZs9YBeGLExDhXXZIkPfbW/v2DVkvTNJy/cB5Wmw2UMjiddoAQNDR9Bkop9LSBRDIJSlm/547WnyEL5s95jHN1haJ4u0dEDEBdc3NzOhKJgtL+b900TdSfPgMmCGBMQHFxMQilOHn6DBgTbvQLg93HNQ0tV33pCm9ZHYCTwwXOqDGfzzfrP+fOe7KQv2P7XP3SE7zeNSsTJiOxVCo189KlS6PLCkBrmw+6np6ZCZORmNPprLo7xNohy9aqTJhhiXGuCg6Ho4jzL0ed2DV/J6xWaxHn6rAazyR+ZhhGzrmrMxAEobntcKZpwjRMAoABGPKIMqwnRfEmorFYsKysLKdgx06cxPGT9TlhiwsLoCUSwUy1Z8YpMkrP1NRU5xTsTky5pxSUkjOZMBmJeTyeE/ffd19odGkBleXekMNuP5EJk00UHz788HxWWFgwaqQ8bhe+VlfLAHw4YmKK4m0RRXHD5k0bI5I07IknZxNFAcueWBQRmLBBUbwtmbBZqyTOVRIKhV8LBDp/tGnTFkdPJArK2I2KiN2sjG7e9/VTBsoEMIGB0ht9bpcbix7/fsTjdu132OVnslVOOZdvzc0XG9uvXasJBoMghPQ1EAKC264Hjt1sHrcL48aObaiqrKrNJV5Of3s4Vx/1+XwTFz7+QxBC+zbu3o2697q3rhxqzCJa8MpLL07iXP2eongPZYuZy0HREYlEdq5e84LLMIxc5jGkpQ0Dr+550xWPa7s4V+Vs+KwrFovF/nDq1Gm3JFlRO23aIB310xilg/RHaX8NNly8NGZ6zZRXACzPixghqK6oKBeXLXumn35u6YgOrTk6AAcCQinGetwiiJm1xsxKzGaT14mi5eDy5b9wGqZ5Sz93qDHGBFgsFvz+1yt7JIu0IVvcrBpTFO+xMWM8b+947a/hceNyrlcHmcNux/PPPdntcjo+UBTv37Phc04XjY0NawzDfLGxsdHy/sEPbP/456cAIRlXzCJJuL9uBuY++K3EvRWTk4SQLdVTql/KJd4d/YbiXBWSyeQPYvH4SsliUTRNS1/v6tI7O4NCh99vAyGkpLg4XlAwPj3G42FWq8SSyeRXkkXaLEmWdxTFm3NhmtePO87V6QCW6Lq+VNd1GQBEUYwzxvYBeENRvOdG6rsfMc5VC4ASAAUACuPxeIlhGMUAxgNwGIbpTKWSY9OG4bHLsiKKovPzL67oh48csx89UQ/KGOY/NAcPzf52dLJSJui6HolrmkopC4micJ0Q0kNAIibQSQnxSZLFB6ADgB+AX1G86X7EOFfd4XB4ryiKcwOBgB4IBKnf77cGAgHL9a4uhEIhxONxxDUNWjyBRDKJaCyGjg4/yM2cNVBjgihiwoQSuJwuyHYZdpsM2S7DZrPCIdvhdNjhdjmTY9wuze1yGi6nEwA2W63SBkXxpomqXpkYiUROvP7G3gk7d+6yDpfdKaWDPv/elFBYUIiKiskglOGr1laEuyNDpgsmCIPq015zOR348cJHe2rurWiWbbbvkqampivbtm2bdODd91h5+WSUlpaitLTU8CpK1OV2pWCCmKZ5M0OCUEJNSqlJKDXdbjcpm3SPxTTNcNowzgEAY6yOEOK+2taejMaiZt9OjhvPEkpMAmKCwIxGY2J7R6e9Mxik/kAQvvYOLJg/R5/34Dc5UdUr07pCob8JjBUnEokvGGOfud3uJkopB9CNG7mutw0sToIAGhXFG7+9k3PVBmAqgIGJzwRg3NZchmkq0WisxjCMalEUyg3DuOaw2xf9F1YFkjDzCRsFAAAAAElFTkSuQmCC", 
          B: "data:image/png;base64,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", 
          k: "data:image/png;base64,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", 
          K: "data:image/png;base64,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", 
          n: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAtCAYAAAA3BJLdAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA/QAAAP0B4nuDkwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAkUSURBVFiF1Zh7dBTVHce/89h3NtkNARKyKcz6oIqiUEV5nSMHEWjlIISKYq3VU0AlCsTIEcU2okJLaT1SDOXt65RK5RUPhCgYChQUlfJIJNls5iYkgRASJdnHPHZnpn9sdsmS7IbdRHv6PTu7c3/3d+989nfv/O7MpTRNQyxVVp5bAopapgSDVWazeTHHOY92rieE5wRB2AmKymFo+rWhQ3/615id9YU0TYt5VFae8954003azNxc7ezZM96aGvdTnevLy8v3FC5/PTjtoZlaeflZyeVyPRWvv94ecStdripxwMCBmtmSog277Xbt5MlvfFVVlfmapoHnaxw1NW71jpF3admDndr4CRO1yspzHp6vGfRDwdLxoi5JUuMNzhs6hpzg4dmPmP1+YTkh/IMA7iuvqJAuNTcDAGrrzmP/pweCqqrm/1CzIC4sKOr4sGHDIsWLF5vwbN5zFlEUt8my/HTppweMnd23f7zLpqrqMxUVFdvOnDlzyO12byaEX0QIn90XsExhYWHMSp/Pa1VVdeK+fSWGEDuFyy2taGltYTVN679j126dz+cHTdOgaBo+nx8My9DHT3w1vOzwkSFVrurbVFUb0T8jY0nz5eb7vF7P13a7vSVZWCpeNiCEHywIQtXdo+6NwNIMC4ZhwLAsaIYJnTPh89BvWloaBFGM2IxGAx6cOkWanTs9oGPZtRRFLeM4p5IobA9zVn7s1KnTwUQ7fakgH9ve24TfvVSA8WPuQTCoYM/e/YYF+UtTakjdPEmWDxPC90+035iRJYR3iKLomjFzlqm+vj7kfJ2RZVgWdpsNw28fhodzZ0CSJPzp7XUQRBGMToc5s2bID0wY36zX60dxnPPi9cLGjGx7e/um9z/4UB8GTVTtHg+OffkVCl7+Pdw1BK8vW4J0uw2apuEfO/foSw4e6hcMBo8Qwg/oFSwhfK7P5xu3fv0GBgByc2fis0/3Y/68uQlDa5qG9/7+EcqOHMPyV5Yga2CIbecnJaayo1+kK4qyjxBelxQsIbxVFMUNS5e+YpEkCT+fOgVPPvkbfHbgIFJSUhKGDat4Xym27yzGsoJFSLVaAQDbdhbba2rPOxVFWZ0ULIDp5RUVuq+/+QYAMH/+PLxWuBzDh9+Ow0eOJA0LAIePfYF//fs45v76UQChqK/d9J5dEMXfEsJPSwb2ikGvVwHAarXCarVi0gP3IyAHcPLkf3oFCwA7PtkHuy0NE8aNBgB4fX4UbfnQHAgG3yWEjzt0XWAFQZh0+vQZEwB4PB6UlJRAliQsyMuDoiScGrtIURQUbX4fs6b/Av3S7QCAyuoaVLrcCoAF8dpGpS5C+DRRFBunT59habxwoatzAqmLYZiILXTe8dtR92juQ2BYBtt37wUAOAZl4tWC51t0LJvNcU65O9ioyAqC8MKBAweZ7kD7WoeOHsO4e+6CTscCABouNKGuvpEGMCdWmwgsIbwNFJX/TtE6YyznvlRzSytIXQNGjbwjYtu1tzRdkuRXY7WJwAqCsLS0tJRJdhFIRmVHj2PC2NGR8jmXG9+3tWUQwk/uzp8GAEL4DIqi8tauLfpRohrW6YpzsNlSMdgxKGIr/fxwqiTLT3fnTwOAIAjL9hQX001NTb26eEqKBcNuveW6/VVVxeFjJzDu3rsjtlPl34JlmEndrWo0Ibydpum569dv7FVUjQYD/vDmcinHkdhzdkVVNW7khkTKbe0etLV7/ABGdIFVFOWZsrJDanPH60kyGjniTmzeUOS5ZejN+pbW1oTa1jdeRNbA/mAYJmKr5mspAHdf60v7/f7HP9q+PalFf8zoe7F103rvqpVvXHJkZy+SJMnX0JhY2pNlGc0trXAMyozYzlXXpAeDwTHX+rJGo3FIRcW3CV1g0v0TkZf3rLdfevp3ZrO5EMCHkiTluWt4uqnpEhiWTai/2vMNGJLjQF19IwCA1J6ng4oy/lo/OhgMyna7Hc/l5YHjuLidGgwG/HHlm/KyV5Y25Dgcj5jN5iEc59wKwKZq2htvrXnHnBBlh8j5BgzOcUTKjU2XwDLsQEL41ChYj8fjevxXj2HK1Mn48+pVoCiq2w4ZhsHWLZt9Y8eO2Wu1Wm/mOOdejnNqhPCMz+f7ZNfuYiOprUuGFbXnGzA452r6UlUVF5ub/QBGRsHabPZSs8UiGA1G6PV6xHrNef65PM3hyP7aarXmcpxTCNtFUVzjqnbftnHz1viv9XF0ubUV6TZblK35cisFYHAUrF6vK5oyebJYtG4dZj/S/bKclZWFOXMelex2+y85zhn5N2539RMej/eJl18ttKhx3pJ7ks8vwGI2RY3qd1eusACyomA5znnBbDaNefHFgrZp0x5UsgcNwoAB0S+eixct9FIU9TbHOS+HbYTwI2U5ULQwv8Di9XqTBgVCD+GiJMNsuprqW7+7YrgWlgUAjnNWEsLfs3jRwncLXsi/lWEYw5dfnpB37d5tzczM1CZMuM9jNBpXdAJNkySp+PUVK021dXVgmMTu/u7k8XqRkpICnz80w76/0sYqqprTBbYDuArA6A4Y07hxY58YMeLOhwC0mUym1zjO2R72DQQCH5TsL7Ue/LyM6pzMeyOvzw+rxYJLCA2ez+eDoihRQ9xtSDpuoL91HFEihF/Q1HRp9KrVf0nt2jJ5ebw+pFotkbIcCEBTNWtnn4TuYEL4LFkOrFi4+IWMQCDQR5gh+QUBZpMpUpblADRNi8rbCU02v9//1j8/3qGrra1NeJXqSaqqgqavxk4OBAAKUbDXHVlC+DSdTjdt46Ytpp69E5eiqGCYaFgKVNS1EpkGY9xud5vH4+krviipqgKavnqzKooCiooe+URgf+JyVSe/JdODVFWLimxI0Ut/IrAmvyDoe00VQ6qqgKLi48S9SwjhMzsVrUajkcrI6AeaDu8b0GDo0J5AeA8hVBfaM6Dp8F4CDZoO7xtc9aMZJrLEsjoWFpMJaamhbNWRGejODD3tfGuSJEnhciAYNCDKnwp/utg6lSLf0fboVgzDABSgBJWIL8uwKqAFAECn0xl6zD8/u2uUIXKBPtyRCdtiPZJ2iAZgAIAta1Yltij8r/V/BdvjnP0RWXrUfwH8iI/ddJgSPQAAAABJRU5ErkJggg==", 
          N: "data:image/png;base64,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", 
          p: "data:image/png;base64,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", 
          P: "data:image/png;base64,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", 
          q: "data:image/png;base64,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", 
          Q: "data:image/png;base64,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", 
          r: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAAtCAYAAAAz8ULgAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAABEAAAARABBMRn7QAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAUzSURBVFiF7VldbBRVFP7uPbPTlm6LC22JVJTZUjCIVQyQRmu0hhAhabENRBB9EEkQo9GIoDFBNPGFQIUKPmBMHwRbUKMg1iiaQCImYCSxhmhRu1MgBAOF/tBddtrduT7MzO7M7Oy0xi2hSb9kds7c87Pf3HvP3LlnmBACqhpZBaAN3qhVlPBxL4WqRp4A8GUWPzsaFCV8KEuMRwEcy+K3WlHCByTr6uzZPwfXP78haLf49OCBaFlZqe+/nzt3PvrKptcLOScQSeDEQSSl5He3vhm9Y/p03xh9/QPRd7Y3F9rbXt2wbnBG+e0AgBTJRGJY7+npcTgLoQvf6AASyaS4dq0XnMgkRyDJIklIJkeOoQsh+geuO9qSyaRuyXykALcCxgVJyU+p6zrFYrEPOzp+HXRqGMAAORCYLHSd/GIIXSdN05rOnDnzFpjN3yJAPDhSDF+SW7ZsLSgsLKxMheYc3DwYETjniEZjfiHw0cetBZOLi8OGj+Vv+FqIxzXfGL4kT5465bi2JweXzCQhCSRlD/N751lPH06+nedNsry8vKD1k/2+xowZPwzMODPYZGbOAku27ABm6cGcMXxQMjVU4CYpAKa3trXhxo3sw8dsQ8U5gVP6mrnaiJPRRpQxRSxdNuTlyVjduFw3eAHMXHHy4vH4watXry1Z+9y6gosXL3o6+w13tuekJY92uEumTsHml9bfKA4Gj8py4ElFCWscABQlrOXn5zeUlZXu/fyzg9q8eff4DsVYQblzBt7e/LJ2W3HRXlkONChKWAPMnrSjq+vvFxOJRNPG1zbJx44dd+jGsifvv3cuNjz79BBx2lhRUbHH8b/uu6momLVHluWV7zXt0NaseWrEJS0XWPzIQ+KFtc9oAUla6SYIePSkBVWNLBoaGvqhf2CgKDpoe5YzMy9t51TWepxhfwKk7GFmO1CQn4dJkyZdD0jSYkUJ/+zFJStJAOjs/KPt0KHDq746csQwNrOWk5W1xkGSka2Gzjjs2U0kGRlO9ieCMdwPLnoANdULD8yunL06Gw/fh7kQQly6dAkdHb8BGJs5OacyDOHXUxgnLxgTJHOFCZK5wgTJXGGCZK4wQTJX8F27OefBuro6VFXdByC9V0ntYayDM3Nvw4321LUpp3y4MwaAaaUl4IwF/Xj4vardlUgk/mppaQmcv3DBMLb2MSxze2rf7jrayLBP73EYOCfjhgCUlUzB0sWPDRPxSkUJn/tPPRmPx7d9d/So/v7uD9I9O0Zv5qFQSF84v2obgFVeXDznpKpGqoiosbl5d162m8glvjjybR5nvFFVI1Veek+SsVhs1759+/nly5fHlp2J3v5+fH/8R65p2i4vfcZwd3ertZJENWp3Ny1b+rhD51Vmydh3c556+3bu0117cNe++58rV4gTr+nuVmtnzlQcRdUMksPDwyt6e/sC9fV1GXeUrk64qxIeGe+uXjja09ltx+BgLFBcRCvgqvxmkBRC6F+3t2PnzuaMIGNdHFhRvwxLah/WM/43w/IWxATJXIFFIl1v2BuEEMt/OX26+sSJnzKNGXdkJ2PMlAmMs/TKwrmxKtlXotS16cMy+2fe3Dm4e1b4JIDDbpKivf2bobimmUQYppVNk70qa8Y6bK6/Fkmb7NZZMk+1O23cKJkSQm9f35C1UMuBAKoXzJclANi+o0l2fx7xws0o/QGQLWFycRGqF8wfH3NSAoBQKDQqY2MlsXrFqgtJIMmsCXl8EeOSBOISyJQNOxpVzbwoaHwkY5FI100p7/0f/AtqgngTt18VQwAAAABJRU5ErkJggg==", 
          R: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAAtCAYAAAAz8ULgAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAABEAAAARABBMRn7QAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAUzSURBVFiF7VlrbBRVFP529tGdbsujLXTdtexaRBENBiH+ERNJpBgpkVYeJf7QUCWg+EMeAko0kV+ojSQ2IIQgEUwRqGgwvokSEn5IeBkfURQWmi27xRYWu5bZMuf4Yx57Z3d2imFLbNIvTefOueee+e7j3HvPWRczIxoONgFogz1mxOKJ7+0qouHgXAAHCrQT0RCLJz4pYOMRAN8VaLcoFk/s8Rhv90y6t/eDD9vKRI36x+rSyWTC8et3jL8zve39XQGVCESASgRiAhFDJcKKZc3pC7FzjjYqKqvSb23ZGRBlG9a91Bv78wwAwCTp9XpozNixlsaSJLGjdQAet5srq8Zo5HRiYtnt9gxowyVJPKqi0iJzuz1k8hjIwP8BQ4Kkx6lSckvuQCCw7f5JE3s1SXbmGIAsl46UJMntaEOS3H6/3HLfxLtey0qzdvyyXDaQDUeSb7a8I6d7eycY70SsOwVATGBmlJWPdDKBF1a8LKdSqVpmBhGBGCAisLBS5dJSRxuOJB+a/rDlXVWtTkFEUEn7eCFMnjLV1LG2HdCf8kl2dHTIc+sfd1TWes/Zp/YAmzKA9QLrDUQd/c8sO6Er0SnnkmQw6JnFzSh1GHpjupkAlQlMDGKGZSr1PVKTafXEDCYyy0Z9IVzr68OOzZvI6KtLP3FKZFn+qLKqqq5tb7tcM26cbWOn6S60TxbSKTTdXYlOvL5qeV/q8uWvFeXawlg8oUgAEIsnlL6+voauZHLr7FkzldOnTjnPxSDhj99+xaqlTys93X9tVZRrDbF4QgH0kRRRWxNa7vV6W1rf2+abWTfLUjeYI3ns6BG0bFifUdXrK892dLaKdXmb+dmOzlZFUeY/v+RZZeeO7TfugjeBzw/s47ffeFXp78/MzyUI2IykgWg4+GCJz/ftiFGjysvLy0251Xu1f1kPzhYMq6InGx5vlgH8k04jffXq3/3X+x+NxRM/2HEpSBIA7q6NtC1oWtTUOG8+AJhTx8za0/BYc5PXvFclzfNVttPJ7gAAcPibL3Doy8/2nDl3YVEhHo6bucvl4lAojCkPTAUwOGvy59Mn4HK5HJfVkLhgDJMsFoZJFgvDJIuFYZLFwjDJYsHx7GZGWXv7Ppw4cVx/Z0ucY8Q2bMYyOXLjRqTXmzcozsZEF+MdYEaZzedNOF3VIh6P58yy5S96I5EoAJi3HDbjFC2uMWIcNmIcZrAQ9opxTTbm0b6bvBjHx227+lX1+oRYPHH+P42k3y9vnD1nDq1cvcaUDdbN/FJXko4ePrQRQJMdF9s1GQ0HJ6uq2rh67bqSQp0oJp5avLSEiBqj4eBku3pbkoFAYFPzc0ukYPC2wWWno6JqDOobF0p+Wd5kV5833ZFQ9Qy/3z+9dvx498FPrXlPMe7Orj1hnQmxNou3cYZ5Q2e2j7vDNRG3qtL0SKh6xvnOpCWpmkfS6/PNG11R4W3fvzevR7mebYYvdt6rqQrZDWuWw85dy0eO8KYu0zzkZH7zSLoAamh8EmteWZ9nZLCTA7u3b8bB/XvyEktDYjMfJlkseKLh4FpRIEnStJPHj2NL67t5yoZXsuDN2iljJxe83DgaSZTnk/n9l59ApE7L5eSKhKr5iYbGjN/v14kQkomk7/aamjwjLBDTPFQoG4SRo2M5z0V5PslLyYsYXVmZkSRtgjOZDI4c+srnioSq+djJH5H784gdbkXqT8SVnm40L6gfImsSALp7um9IWTVyQeIo6fmeQr+IEWXzP8YI0g2OZCp1BYC+Jm+ik7cE/wKfjx1PbiTAVgAAAABJRU5ErkJggg==", 
        },
        spatial: {
          size: 80,
          b: "data:image/png;base64,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", 
          B: "data:image/png;base64,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", 
          k: "data:image/png;base64,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", 
          K: "data:image/png;base64,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", 
          n: "data:image/png;base64,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", 
          N: "data:image/png;base64,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", 
          p: "data:image/png;base64,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", 
          P: "data:image/png;base64,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", 
          q: "data:image/png;base64,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", 
          Q: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAtCAYAAADV2ImkAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA2gAAANoBIhcEeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAu0SURBVFiF1Zl7kFT1lce/v/vue/s2M4IM8+yZ6emBGQaUMqjE8BijMrwGZTASlBhiwq6k4rqWVjQkqFkWzSZbmsQqa7eS2mwlrsRKsotBJT5BUBDFxWBEqYF5MGRmGJgXTd/u+/id/DHdTXdPz3RvZfLH/qq6+nbf7+/8Pr9zzzn39G0QEab6BUBQFOWnAMSpts0SC0zpYIwFAXQCCBJR91TaFqbSWNoIJ96rp9pwQcCapv2eMTbn/2C3PvFeXegExlhQFMVhxhibTFcQsCRJCyVJuq3QxQOmOa9k5pUQRbG20DmSJG0QRVGmPDFaELAsy24gEPhyoYsrqjKveekSBEyzsdA5hqHfo6lqJJ+uIGDGWHx4eLiJMTa9EL1t26FlS26AIAh1BdqvGxkZDYuiOJJPWxCwIAjxqqoqF8DKAhaXLCs2/YZF18G27YpC7CuStLEuVOMJojCYl6UQg4IgxFtaWuTi4uINBcirZ145w6oomwUrFitijIn5Jmi6b3Pz4kUicW9gSoAZY7Hm5mZYlrWMMSbnkdfXhWq4IDAUTQvEAZTnsd0gieKVtcFK2I7bPyXARGQZhoGGhgYHwJI88nDjnNk+4oTyslIXQM1kYkVRNra1rpCHh4bIsmK9eYEZY+F8tQ9ANBaL4Y477jD9fn/bZMKAac6vD4dUEEdtTVBCnlqsyPLmdatuVgbOX7A55+fzAouieAzAl/LorFgshtWrVwmMsXWTCSVZagpVV4GIEK6t0SerxYyxq3w+ddr8xjqcG7jgAJgw6RhjDaqqHBZM0xwyTfNHkyUH5zwasyzMqa+H7vMZjLGGibS2bdfWVgdBxFFZUSaYfmNCraqqd61fs1zlrouBwUFvMuCAaTypyHKZIElSL+e8VBCETROJ4/H44PDwELjn4Na1rZIkSa25dIwx1bbtQOmsmSDiqKoogyAI4VxaAJBEcdPalmUy91wMnB/kAHLGMGNszsVIdI0kiicFIuq6+ytfEXVd/8FEFSASiZzu6uywuedizeoVmmmaGydgCJXMnGkxEECEitJZsG0nZy1mjC00/breEAqCew7O9p7TAZzMpQ2YxhMzZxTjkmUdEyKRSHt5eTmuXbjQJ4ri1ycA6Tl1+nSMPBeLP389uOeFGGO5ylU4XFtNY70rR2npTFgxqzhXuBmGvnXzhrU69xz09w9AFIUoEY27NTPG6kG4ZUHT7KjjuCeEeDze2dXVGfuXJ3eamqbtYIxpuYC7us9w7jkQGbDu1jWCJEm5vBxumBP2EXEQ55BFEQHTjAHI8DJjzOe53vq2lctE7rk41dkFRZFP5fJUwDSeuPfu9Wr32T4bwEkBwNmOjg57/vx5WLZ0iSLL8tZcwH29vRL3XHDPwcYv3eYzDH1Ltsj0++eHQzUq0VhIEHGUlZa4AIJZ0tsXXTOPF5k6uOeivaMbjuP8MYd3w0RouWvdcrH7bL+aBO45c6aHiDh27njcL8vydsaYkTW3f2T0ouo6cXDPxeeungdFlmdl98iSJM0P11YDnINo7FUfqpGygYtM/wOb2pYHkg44eaordika+yiHd3feu2md6rkebNtmRNQvAOjp7etViHPMDtdh5YrlsqqqD6RPJCKuqerFvt4+cM8B91xsXL9W0TTt7nSdZVmhcG11ChZEaKwP6T5Na0rzWr0gCnWLFswFdx1w18UnpzotAJ9leTdERCs3tbWIp7p64NPUMwAgENGA53qxnjM9ICI8vn2bLoriQ4yxaekGFEXu6+k5C+6OeaWttUWRRHFz2gIzZFkSiqaZSA+JUE0V03XtmqTO8Pnu3bDmRpWRh6SHu3r6pWzggN/Y+fd33aZqqoKjxz/ljuu9CSR6CVVT3zn47jsg4qgJVqLttlZJ133fzvAyqKvnz2fHPOy6qA8FMb14ms4Yuy4haawJVsXHYBMhwTlqqyvhul59YlMSgW9ev2KJxD0H5LmwLAujkagKIPVjlTFWS6DVm9pWiEQcf9h3eDRqxXangC9cGNzz1r63LRCBOOG7Dz/kA3BfesMejUY/7ejs5kmvcNfFhnWrdL9f/1oSeF7jbOUy7JiXayrLELWsEsaYAGB1Y11QKJkeSHm3vaMbuk/rICKe5t0dW+68VdFUGfF4HB9/1qEC2J8CBnDgzX37HUokS1lpCe756iYxYJrPJI3E487hdw4fGR1baGyxW1uaRe56Gxhjsu7zXTW3IWyknk0kwCVJRNG0gA2gepppPLyx9UYztWnPxeFjn3LHtl9O824TgdZuWrdcAhGOHPsEPk35IxFZ6cAnLpy/wAYHB4FE/G1/5CHtiiuKVzHG1iY0hz786GOJEgtxz0VZyXTMnztbFATha6qqXJNMuMtVYgw+VF3pAbhDU5Wm5mubEnnggriH/e9/PGrFnb3JkDEN/TeP3n+PT9dUEOd4690PY6OR6AvJDQkAQETk033vv3v4vVSGK7KE537+rGkY+i8YYyVEdCYej7u9ff0Ygx4D/863vmpoqrIzallNc+fUJTybfFIzBv+5q+Yauk998OEttxsCOIi7ABFcz8Mn7Wc0AAcBwKepjy5oqq9ovfkGluR4/eAHNuf8lQxgABgaGt6z/8DBWDJZQIS5jbNx/ze3GIGA+TwAKIr6wdFjx8e8k7isjeFq1AUr9HBtNSueZoJ4AjTxIiLctHSRpPt8Rc3XNiItVHH8ZBd8qtJORFHG2HxZkv7xB49sNZIMvf3nMRqJOkR0Yhww53z3rhd+69m2kypJRBz3b90iByvLF6qK8nejFyOvHfnwuJ30bhK6urJUa1uzXEuHTSYeEcfVjfXgnAtDo5mtwnsfnXSj8fiLjDHZNPTfff/Br+tXFPlTZfHXe960GfBC+pwUMBGdJqIj/7N7TwqWiCAKDP/x7NN+WZF/xDnvPvTBR9FkLU5CHz3+KZZ/cXEaLGV4mjFg6aJrcPDoiQzg/Uc+jti2+5rh0x6/bkFj6Ypl1zMQAZzjUjSKX/73q+4lK7YzJzAADA2P7Pjh0z8dTe4wmTzVVeV4/JEHdNPv39be1eOLxaJjieM6+NNn7fAbBoLlpYkrc/nqXI5nji8uvg4H0oCjsThOnenTAFiSJN2346EtOhKhQMTxXy++4QqM7SaingmBiejN3r5zg0feP5rhZRDh7i+vF1puWhpSVdX7/asHwD0HjmPjn595Dnfd3poRRskcSMFzjqXXL8CxEx34rOMsAODl/UdJlsRDhu576clH7jWKA0Zqvbjt4Ge7XopfvGQ9iqwhPvbYYxlfbNu27dK5gfPNba2r1Iy7FnGsvLlZdmxbeOrfn2O95y6wn7/wCgJFRfj+w/8AIBkClAGPBLwsS6gsL8H2p34B09Dw41/usV2PKv71e98K3Ljo6oyY/83L+/ih//3k9VjcfiYbeNzzYcaYpvt8/W/v/V2guqo8w1AS/nRnN956+xBKS67ETUsXQWBIwVJap4a0ucnPbxx8H7t2v4pg+SzcvnIZQsGyjBLoOA5uvPPByPmhkcVEdCwvMABomnZfqCa48/UXnzckUchoF8dXgmTY8CzYbPg8m0mce/Tp/7Re2XfktYuXomvHgWXHcHLEYrGf9Jz989vbd/wwnn3XAmWWLWSFTXZITAw/Pjl3v/YOf+mt985FotadubgmBAaA0YuRDbt+++Lg3tf3Z1yybHjKgs9OvMngkQZ/or0T//TMryJRK3Zzrt92k4ZE6iRjCwKm/8Abu39lVJTOTF3+8fB8XNhkbobn3EzyeORiBK3f+G5kYHBkAxG9NCFQPmAA8GnaViJ6SlFkb/xZAih1NMnIcTbtK8d1RVEUn7gUtR6b1AwKAAYAxpgJIO9j079icCIaLUQ4KfCMGTN2jYwMr09z5F85JrFCgCCwb9qO+2+TWZDyrDDnD3v3iku+cMNYD8yTDY97ufnhaceJHpfn0yTPp9n72a9fwbPPvzzhY63k+Fv9T/c3G//vgCcNCSJqv+WW5fMYY1P0B+/EVogTE0XhdD4LfwEzYQPq4Vl+lQAAAABJRU5ErkJggg==", 
          r: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAAtCAYAAAAz8ULgAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA5QAAAOUBj+WbPAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAARoSURBVFiFxZhNbNxEGIbfb+zEdhKyDaA0iK5KiJQWiFDSE6RSL6hHVCTEqRJHDghVXHpL4lrsjXslLlyjSsAJCY7VigOEa8WfEII0QFGabLdbku2uPcNh1+uxPf5bO2UkK/vF45ln3ne+mdGQEAL/V3EcZ45z/gdj7KmkOp7H/9afJJSi1DzP02/d+gqMMRAxEBGIGBhj0DQdV65cek53HOc9AC/maHDXtu2bJ0HKuQAgQCSGkIOYsYHLOoBPms0mOOcgIgAEIgz/0uh/Fy++LhzH+dS27W61iAPl5P7k2IdEs9mE67ojmaOyEzGsr7/G/Y/84jjOAoDzOUh2bNs+SsSUxIiCjiCTKwaxqnS7vc97vd6q6/ZdWZlBe4PfpmkYpml8DGAzHZKF+g36H0KqK7FY5Xjh07dvfzN19+6fw/qDbwI3GFZXX8aFCytWEqAskNp2gPmjl8FUcXpRq588uLTv5flIAWQSWDhOUiHdAV+NVMSYzSw0SD2rUlpHRPTg8uVLx67LvagyAMAYoOv6hBDiYTpk1OZwLuiBGiKxYpKShmG8BeCFTKmAH9Ih1fMxMXGSbAegua77z+amnKRp0yAcb21tqaoxAFZysrIA0jTN4WI+GI2cnX62CiGwvf3FrL/ox7OZIt9T6D0QAPjtT02ZWF9/NdG9kZL9fv/3a9c+OJMgiM45BwB0Oo/Qbj8cNaIaSNF4AA+lzSHIRqOxmGTZxsbG/vb2Z8+2Wu3ITlTNEyz8cZtj2Z1e0vfWsjFjDAsLTw+nSRhQ06Q5mYpYIVh0Wev1+rh/v42VlUUYxmQLwG64b6Df934tAFmNvXLsecDOzo9YWnoe587Vv2w0PnpXxZCxHahPJtXF6QeYnJCq3SDbxqJx1tkgB2S25Wk7VTRb1XFpyGptVSuazpB9RIGq0fKxamcpqWRe28aLs0oBJfPNv3EVTkMppOR4NqpiFopLJY6f2dXbrAIfEzKsZLWJU2l2F7Ft3LiidbKIbeM8JZUsk7151Syt5EnaLKtfClJl80k8pSHHtTF/nF4KZvfJgGbNySd6Mo8+pjmB+flZnDplgTF6yXGcD6Wuv7Zt+6fCkFWrWa8/g1rNwtFRD/v7j9YAeoWIYFm6ZlkTbwB4MwfkydpMBBwc/Iu9vTaISCNiFmMM8/MzOHu2pvkUY6yTeZ+8px/1NY9cRko6jlMH8Lb8kjGylpbqePy4H2owUAOhhqO/Ve88j+PevU4EKA6uhOScXz88bL/farU9qeFJw5iEYRjSiP1G/DrytAjioHM5Bk6fnkWn00O360baCQ9GCQmAdnf/0u7c+UXz72zCF0/Jl/5F4rm56QzF42rGEifPFpYdJ18jahoTa2tnjgHiRGTs7bUn4vVTIA1jEjMz09J8iyo62CLl2H8vDyh69SffphHRsa5r7wD4TQixwRhd1bTo7VvYchny++XlxYPl5UWEB5K9bUW8iHwfKw8AfGvb9uGNG8539Xrtar1ei1XyPPGz//s/s1PvmLrJam8AAAAASUVORK5CYII=", 
          R: "data:image/png;base64,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", 
          },
        veronika: {
          size: 80,
          b: "data:image/png;base64,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", 
          B: "data:image/png;base64,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", 
          k: "data:image/png;base64,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", 
          K: "data:image/png;base64,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", 
          n: "data:image/png;base64,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", 
          N: "data:image/png;base64,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", 
          p: "data:image/png;base64,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", 
          P: "data:image/png;base64,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", 
          q: "data:image/png;base64,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", 
          Q: "data:image/png;base64,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", 
          r: "data:image/png;base64,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", 
          R: "data:image/png;base64,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", 
          }
        };

    var trashbin = "data:image/jpeg;base64,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";

    /* src/ChessBoard.svelte generated by Svelte v3.14.1 */

    const { console: console_1 } = globals;
    const file = "src/ChessBoard.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.fig = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.s = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.bg = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.i = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.i = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.fig = list[i];
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.fig = list[i];
    	return child_ctx;
    }

    function get_each_context_7(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.san = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_8(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.fig = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_10(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.sq = list[i];
    	child_ctx.x = i;
    	return child_ctx;
    }

    function get_each_context_9(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.row = list[i];
    	child_ctx.y = i;
    	return child_ctx;
    }

    // (20:6) {#if ((position[currentRows[y][x]] !== '0') && __status)}
    function create_if_block_1(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_width_value;
    	let img_height_value;
    	let img_draggable_value;
    	let dispose;

    	function dragstart_handler(...args) {
    		return ctx.dragstart_handler(ctx, ...args);
    	}

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = chessSets[ctx.__set][ctx.position[ctx.currentRows[ctx.y][ctx.x]]])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = ctx.position[ctx.currentRows[ctx.y][ctx.x]]);
    			attr_dev(img, "width", img_width_value = `${chessSets[ctx.__set].size}%`);
    			attr_dev(img, "height", img_height_value = `${chessSets[ctx.__set].size}%`);

    			set_style(img, "cursor", ctx.canMoveFrom(ctx.currentRows[ctx.y][ctx.x]) && ctx.__current + 2
    			? "pointer"
    			: "not-allowed");

    			attr_dev(img, "draggable", img_draggable_value = ctx.canMoveFrom(ctx.currentRows[ctx.y][ctx.x]) && ctx.__current + 2);
    			add_location(img, file, 20, 4, 840);
    			dispose = listen_dev(img, "dragstart", dragstart_handler, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;

    			if ((changed.__set || changed.position || changed.currentRows) && img.src !== (img_src_value = chessSets[ctx.__set][ctx.position[ctx.currentRows[ctx.y][ctx.x]]])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((changed.position || changed.currentRows) && img_alt_value !== (img_alt_value = ctx.position[ctx.currentRows[ctx.y][ctx.x]])) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (changed.__set && img_width_value !== (img_width_value = `${chessSets[ctx.__set].size}%`)) {
    				attr_dev(img, "width", img_width_value);
    			}

    			if (changed.__set && img_height_value !== (img_height_value = `${chessSets[ctx.__set].size}%`)) {
    				attr_dev(img, "height", img_height_value);
    			}

    			if (changed.currentRows || changed.__current) {
    				set_style(img, "cursor", ctx.canMoveFrom(ctx.currentRows[ctx.y][ctx.x]) && ctx.__current + 2
    				? "pointer"
    				: "not-allowed");
    			}

    			if ((changed.currentRows || changed.__current) && img_draggable_value !== (img_draggable_value = ctx.canMoveFrom(ctx.currentRows[ctx.y][ctx.x]) && ctx.__current + 2)) {
    				attr_dev(img, "draggable", img_draggable_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(20:6) {#if ((position[currentRows[y][x]] !== '0') && __status)}",
    		ctx
    	});

    	return block;
    }

    // (10:5) {#each row as sq, x (currentRows[y][x])}
    function create_each_block_10(key_1, ctx) {
    	let div;
    	let div_data_index_value;
    	let div_title_value;
    	let dispose;
    	let if_block = ctx.position[ctx.currentRows[ctx.y][ctx.x]] !== "0" && ctx.__status && create_if_block_1(ctx);

    	function click_handler(...args) {
    		return ctx.click_handler(ctx, ...args);
    	}

    	function drop_handler(...args) {
    		return ctx.drop_handler(ctx, ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "square");
    			attr_dev(div, "data-index", div_data_index_value = ctx.currentRows[ctx.y][ctx.x]);

    			attr_dev(div, "title", div_title_value = ctx.__status !== "SETUP"
    			? ""
    			: ctx.utils.sq2san(ctx.currentRows[ctx.y][ctx.x]));

    			set_style(div, "background", ctx.currentRows[ctx.y][ctx.x] === ctx.__sqFrom
    			? "lightgreen"
    			: ctx.utils.isDarkSquare(ctx.currentRows[ctx.y][ctx.x])
    				? ctx.__darkBg
    				: ctx.__lightBg);

    			add_location(div, file, 10, 4, 333);

    			dispose = [
    				listen_dev(div, "dragover", prevent_default(ctx.dragover_handler_1), false, false, true),
    				listen_dev(div, "click", click_handler, false, false, false),
    				listen_dev(div, "drop", stop_propagation(drop_handler), false, true, false)
    			];

    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;

    			if (ctx.position[ctx.currentRows[ctx.y][ctx.x]] !== "0" && ctx.__status) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (changed.currentRows && div_data_index_value !== (div_data_index_value = ctx.currentRows[ctx.y][ctx.x])) {
    				attr_dev(div, "data-index", div_data_index_value);
    			}

    			if ((changed.__status || changed.currentRows) && div_title_value !== (div_title_value = ctx.__status !== "SETUP"
    			? ""
    			: ctx.utils.sq2san(ctx.currentRows[ctx.y][ctx.x]))) {
    				attr_dev(div, "title", div_title_value);
    			}

    			if (changed.currentRows || changed.__sqFrom || changed.__darkBg || changed.__lightBg) {
    				set_style(div, "background", ctx.currentRows[ctx.y][ctx.x] === ctx.__sqFrom
    				? "lightgreen"
    				: ctx.utils.isDarkSquare(ctx.currentRows[ctx.y][ctx.x])
    					? ctx.__darkBg
    					: ctx.__lightBg);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_10.name,
    		type: "each",
    		source: "(10:5) {#each row as sq, x (currentRows[y][x])}",
    		ctx
    	});

    	return block;
    }

    // (8:4) {#each currentRows as row, y (y)}
    function create_each_block_9(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value_10 = ctx.row;
    	const get_key = ctx => ctx.currentRows[ctx.y][ctx.x];

    	for (let i = 0; i < each_value_10.length; i += 1) {
    		let child_ctx = get_each_context_10(ctx, each_value_10, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_10(key, child_ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "row");
    			add_location(div, file, 8, 3, 265);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(changed, ctx) {
    			const each_value_10 = ctx.row;
    			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value_10, each_1_lookup, div, destroy_block, create_each_block_10, null, get_each_context_10);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_9.name,
    		type: "each",
    		source: "(8:4) {#each currentRows as row, y (y)}",
    		ctx
    	});

    	return block;
    }

    // (40:3) {#each promotionSet as fig, i}
    function create_each_block_8(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_width_value;
    	let img_height_value;
    	let t;
    	let dispose;

    	function click_handler_1(...args) {
    		return ctx.click_handler_1(ctx, ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t = space();
    			if (img.src !== (img_src_value = chessSets[ctx.__set][ctx.fig])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = ctx.fig);
    			attr_dev(img, "width", img_width_value = "" + (chessSets[ctx.__set].size + "%"));
    			attr_dev(img, "height", img_height_value = "" + (chessSets[ctx.__set].size + "%"));
    			add_location(img, file, 41, 4, 1527);
    			add_location(div, file, 40, 8, 1481);
    			dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t);
    		},
    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;

    			if ((changed.__set || changed.promotionSet) && img.src !== (img_src_value = chessSets[ctx.__set][ctx.fig])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (changed.promotionSet && img_alt_value !== (img_alt_value = ctx.fig)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (changed.__set && img_width_value !== (img_width_value = "" + (chessSets[ctx.__set].size + "%"))) {
    				attr_dev(img, "width", img_width_value);
    			}

    			if (changed.__set && img_height_value !== (img_height_value = "" + (chessSets[ctx.__set].size + "%"))) {
    				attr_dev(img, "height", img_height_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_8.name,
    		type: "each",
    		source: "(40:3) {#each promotionSet as fig, i}",
    		ctx
    	});

    	return block;
    }

    // (92:2) {#each history as san, i}
    function create_each_block_7(ctx) {
    	let span;
    	let t_value = ctx.san + "";
    	let t;
    	let dispose;

    	function click_handler_3(...args) {
    		return ctx.click_handler_3(ctx, ...args);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "san");
    			set_style(span, "background", ctx.__current === ctx.i + 1 ? ctx.__darkBg : "inherit");

    			set_style(span, "color", ctx.__current === ctx.i + 1
    			? ctx.__lightBg
    			: ctx.__darkBg);

    			add_location(span, file, 92, 5, 2849);
    			dispose = listen_dev(span, "click", click_handler_3, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if (changed.history && t_value !== (t_value = ctx.san + "")) set_data_dev(t, t_value);

    			if (changed.__current || changed.__darkBg) {
    				set_style(span, "background", ctx.__current === ctx.i + 1 ? ctx.__darkBg : "inherit");
    			}

    			if (changed.__current || changed.__lightBg || changed.__darkBg) {
    				set_style(span, "color", ctx.__current === ctx.i + 1
    				? ctx.__lightBg
    				: ctx.__darkBg);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7.name,
    		type: "each",
    		source: "(92:2) {#each history as san, i}",
    		ctx
    	});

    	return block;
    }

    // (115:3) {#if __status === 'SETUP'}
    function create_if_block(ctx) {
    	let div0;
    	let t1;
    	let div1;
    	let span0;
    	let t3;
    	let span1;
    	let t4_value = `${ctx.utils.fen2obj(ctx.game.fens()[ctx.__current >= 0 ? ctx.__current : 0]).fenString} ${ctx.game.getTurn(ctx.__current)} ${ctx.game.getCastling(ctx.__current)} ${ctx.game.getEnPassant(ctx.__current)} ${ctx.game.getHalfMoveClock(ctx.__current)} ${ctx.game.getFullMoveNumber(ctx.__current)}` + "";
    	let t4;
    	let t5;
    	let div4;
    	let div2;
    	let label0;
    	let t7;
    	let div3;
    	let t8;
    	let div7;
    	let div5;
    	let label1;
    	let t10;
    	let div6;
    	let t11;
    	let div8;
    	let button0;
    	let t13;
    	let button1;
    	let t15;
    	let div11;
    	let div9;
    	let label2;
    	let t17;
    	let div10;
    	let img;
    	let img_src_value;
    	let t18;
    	let div16;
    	let div12;
    	let label3;
    	let t20;
    	let div15;
    	let div13;
    	let t21;
    	let div14;
    	let t22;
    	let div17;
    	let button2;
    	let t24;
    	let button3;
    	let dispose;
    	let each_value_6 = ["K", "Q", "k", "q"];
    	let each_blocks_3 = [];

    	for (let i = 0; i < 4; i += 1) {
    		each_blocks_3[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	let each_value_5 = [{ figure: "P", side: "w" }, { figure: "p", side: "b" }];
    	let each_blocks_2 = [];

    	for (let i = 0; i < 2; i += 1) {
    		each_blocks_2[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	let each_value_4 = ctx.utils.range(0, 5);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_1[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let each_value_3 = ctx.utils.range(6, 11);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Setup Position";
    			t1 = space();
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "FEN";
    			t3 = space();
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			div4 = element("div");
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "Castling Permissions";
    			t7 = space();
    			div3 = element("div");

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t8 = space();
    			div7 = element("div");
    			div5 = element("div");
    			label1 = element("label");
    			label1.textContent = "Side to move";
    			t10 = space();
    			div6 = element("div");

    			for (let i = 0; i < 2; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t11 = space();
    			div8 = element("div");
    			button0 = element("button");
    			button0.textContent = "Empty board";
    			t13 = space();
    			button1 = element("button");
    			button1.textContent = "Default position";
    			t15 = space();
    			div11 = element("div");
    			div9 = element("div");
    			label2 = element("label");
    			label2.textContent = "Discard figure";
    			t17 = space();
    			div10 = element("div");
    			img = element("img");
    			t18 = space();
    			div16 = element("div");
    			div12 = element("div");
    			label3 = element("label");
    			label3.textContent = "Add figure";
    			t20 = space();
    			div15 = element("div");
    			div13 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t21 = space();
    			div14 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t22 = space();
    			div17 = element("div");
    			button2 = element("button");
    			button2.textContent = "Cancel";
    			t24 = space();
    			button3 = element("button");
    			button3.textContent = "Done";
    			set_style(div0, "font-weight", "bold");
    			set_style(div0, "padding-left", "5px");
    			set_style(div0, "border-bottom", "1px solid silver");
    			add_location(div0, file, 115, 3, 3313);
    			set_style(span0, "margin-right", "2px");
    			add_location(span0, file, 117, 5, 3446);
    			set_style(span1, "border", "solid 1px");
    			set_style(span1, "padding", "2px");
    			set_style(span1, "background", "white");
    			set_style(span1, "color", ctx.__darkBg);
    			set_style(span1, "font-size", "8.5px");
    			set_style(span1, "font-weight", "bold");
    			add_location(span1, file, 118, 2, 3492);
    			attr_dev(div1, "class", "line");
    			add_location(div1, file, 116, 3, 3422);
    			attr_dev(label0, "class", "pad5");
    			add_location(label0, file, 125, 10, 3919);
    			add_location(div2, file, 125, 5, 3914);
    			add_location(div3, file, 126, 2, 3976);
    			attr_dev(div4, "class", "line");
    			add_location(div4, file, 124, 3, 3890);
    			attr_dev(label1, "class", "pad5");
    			add_location(label1, file, 140, 10, 4319);
    			add_location(div5, file, 140, 5, 4314);
    			add_location(div6, file, 141, 2, 4368);
    			attr_dev(div7, "class", "line");
    			add_location(div7, file, 139, 3, 4290);
    			add_location(button0, file, 155, 5, 4749);
    			add_location(button1, file, 163, 5, 4891);
    			attr_dev(div8, "class", "line");
    			add_location(div8, file, 154, 3, 4725);
    			attr_dev(label2, "class", "pad5");
    			add_location(label2, file, 173, 10, 5080);
    			add_location(div9, file, 173, 5, 5075);
    			if (img.src !== (img_src_value = trashbin)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Trashbin");
    			attr_dev(img, "width", "30px");
    			attr_dev(img, "height", "30px");
    			set_style(img, "background", ctx.__darkBg);
    			add_location(img, file, 197, 4, 5678);
    			set_style(div10, "width", "32px");
    			set_style(div10, "height", "32px");
    			set_style(div10, "border", "solid 2px silver");
    			set_style(div10, "cursor", "pointer");
    			add_location(div10, file, 174, 2, 5131);
    			attr_dev(div11, "class", "line");
    			add_location(div11, file, 172, 3, 5051);
    			attr_dev(label3, "class", "pad5");
    			add_location(label3, file, 207, 10, 5850);
    			add_location(div12, file, 207, 5, 5845);
    			set_style(div13, "width", "100%");
    			set_style(div13, "height", "50%");
    			set_style(div13, "background", "red");
    			add_location(div13, file, 211, 4, 6087);
    			set_style(div14, "width", "100%");
    			set_style(div14, "height", "50%");
    			set_style(div14, "background", "steelblue");
    			add_location(div14, file, 227, 4, 6544);
    			set_style(div15, "display", "flex");
    			set_style(div15, "flex-direction", "column");
    			set_style(div15, "width", "180px");
    			set_style(div15, "min-width", "180px");
    			set_style(div15, "max-width", "180px");
    			set_style(div15, "height", "40px");
    			set_style(div15, "min-height", "60px");
    			set_style(div15, "max-height", "60px");
    			set_style(div15, "border", "solid 1px silver");
    			add_location(div15, file, 208, 2, 5897);
    			attr_dev(div16, "class", "line");
    			add_location(div16, file, 206, 3, 5821);
    			add_location(button2, file, 246, 5, 7049);
    			add_location(button3, file, 255, 5, 7185);
    			attr_dev(div17, "class", "line");
    			add_location(div17, file, 245, 3, 7025);

    			dispose = [
    				listen_dev(button0, "click", ctx.click_handler_7, false, false, false),
    				listen_dev(button1, "click", ctx.click_handler_8, false, false, false),
    				listen_dev(div10, "dragover", prevent_default(ctx.dragover_handler_3), false, false, true),
    				listen_dev(div10, "drop", stop_propagation(ctx.drop_handler_1), false, true, false),
    				listen_dev(div10, "click", stop_propagation(ctx.click_handler_9), false, true, false),
    				listen_dev(button2, "click", ctx.click_handler_12, false, false, false),
    				listen_dev(button3, "click", ctx.click_handler_13, false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span0);
    			append_dev(div1, t3);
    			append_dev(div1, span1);
    			append_dev(span1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, label0);
    			append_dev(div4, t7);
    			append_dev(div4, div3);

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks_3[i].m(div3, null);
    			}

    			insert_dev(target, t8, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div5);
    			append_dev(div5, label1);
    			append_dev(div7, t10);
    			append_dev(div7, div6);

    			for (let i = 0; i < 2; i += 1) {
    				each_blocks_2[i].m(div6, null);
    			}

    			insert_dev(target, t11, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, button0);
    			append_dev(div8, t13);
    			append_dev(div8, button1);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div9);
    			append_dev(div9, label2);
    			append_dev(div11, t17);
    			append_dev(div11, div10);
    			append_dev(div10, img);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, div16, anchor);
    			append_dev(div16, div12);
    			append_dev(div12, label3);
    			append_dev(div16, t20);
    			append_dev(div16, div15);
    			append_dev(div15, div13);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div13, null);
    			}

    			append_dev(div15, t21);
    			append_dev(div15, div14);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div14, null);
    			}

    			insert_dev(target, t22, anchor);
    			insert_dev(target, div17, anchor);
    			append_dev(div17, button2);
    			append_dev(div17, t24);
    			append_dev(div17, button3);
    		},
    		p: function update(changed, ctx) {
    			if ((changed.game || changed.__current) && t4_value !== (t4_value = `${ctx.utils.fen2obj(ctx.game.fens()[ctx.__current >= 0 ? ctx.__current : 0]).fenString} ${ctx.game.getTurn(ctx.__current)} ${ctx.game.getCastling(ctx.__current)} ${ctx.game.getEnPassant(ctx.__current)} ${ctx.game.getHalfMoveClock(ctx.__current)} ${ctx.game.getFullMoveNumber(ctx.__current)}` + "")) set_data_dev(t4, t4_value);

    			if (changed.__darkBg) {
    				set_style(span1, "color", ctx.__darkBg);
    			}

    			if (changed.sets || changed.__set || changed.game || changed.__darkBg || changed.__lightBg || changed.setCastling) {
    				each_value_6 = ["K", "Q", "k", "q"];
    				let i;

    				for (i = 0; i < 4; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(changed, child_ctx);
    					} else {
    						each_blocks_3[i] = create_each_block_6(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(div3, null);
    					}
    				}

    				for (; i < 4; i += 1) {
    					each_blocks_3[i].d(1);
    				}
    			}

    			if (changed.sets || changed.__set || changed.turn || changed.__darkBg || changed.__lightBg || changed.setTurn) {
    				each_value_5 = [{ figure: "P", side: "w" }, { figure: "p", side: "b" }];
    				let i;

    				for (i = 0; i < 2; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(changed, child_ctx);
    					} else {
    						each_blocks_2[i] = create_each_block_5(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div6, null);
    					}
    				}

    				for (; i < 2; i += 1) {
    					each_blocks_2[i].d(1);
    				}
    			}

    			if (changed.__darkBg) {
    				set_style(img, "background", ctx.__darkBg);
    			}

    			if (changed.sets || changed.__set || changed.setupImgs || changed.utils || changed.__lightBg || changed.handleInput || changed.handleDragStart) {
    				each_value_4 = ctx.utils.range(0, 5);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_4(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div13, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_4.length;
    			}

    			if (changed.sets || changed.__set || changed.setupImgs || changed.utils || changed.__darkBg || changed.handleInput || changed.handleDragStart) {
    				each_value_3 = ctx.utils.range(6, 11);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div14, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks_3, detaching);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks_2, detaching);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div11);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(div16);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(div17);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(115:3) {#if __status === 'SETUP'}",
    		ctx
    	});

    	return block;
    }

    // (128:3) {#each ['K', 'Q', 'k', 'q'] as fig}
    function create_each_block_6(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let dispose;

    	function click_handler_5(...args) {
    		return ctx.click_handler_5(ctx, ...args);
    	}

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = chessSets[ctx.__set][ctx.fig])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = ctx.fig);
    			set_style(img, "cursor", "pointer");

    			set_style(img, "background", ctx.game.castling.indexOf(ctx.fig) !== -1
    			? ctx.__darkBg
    			: ctx.__lightBg);

    			attr_dev(img, "width", "30px");
    			attr_dev(img, "height", "30px");
    			add_location(img, file, 128, 3, 4024);
    			dispose = listen_dev(img, "click", click_handler_5, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;

    			if (changed.__set && img.src !== (img_src_value = chessSets[ctx.__set][ctx.fig])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (changed.game || changed.__darkBg || changed.__lightBg) {
    				set_style(img, "background", ctx.game.castling.indexOf(ctx.fig) !== -1
    				? ctx.__darkBg
    				: ctx.__lightBg);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(128:3) {#each ['K', 'Q', 'k', 'q'] as fig}",
    		ctx
    	});

    	return block;
    }

    // (143:3) {#each [{figure: 'P', side: 'w'}, {figure: 'p', side: 'b'}] as fig}
    function create_each_block_5(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let dispose;

    	function click_handler_6(...args) {
    		return ctx.click_handler_6(ctx, ...args);
    	}

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = chessSets[ctx.__set][ctx.fig.figure])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = ctx.fig.side.toUpperCase());
    			set_style(img, "cursor", "pointer");
    			set_style(img, "background", ctx.turn === ctx.fig.side ? ctx.__darkBg : ctx.__lightBg);
    			attr_dev(img, "height", "30px");
    			attr_dev(img, "width", "30px");
    			add_location(img, file, 143, 3, 4448);
    			dispose = listen_dev(img, "click", click_handler_6, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;

    			if (changed.__set && img.src !== (img_src_value = chessSets[ctx.__set][ctx.fig.figure])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (changed.turn || changed.__darkBg || changed.__lightBg) {
    				set_style(img, "background", ctx.turn === ctx.fig.side ? ctx.__darkBg : ctx.__lightBg);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(143:3) {#each [{figure: 'P', side: 'w'}, {figure: 'p', side: 'b'}] as fig}",
    		ctx
    	});

    	return block;
    }

    // (215:6) {#each utils.range(0, 5) as i}
    function create_each_block_4(ctx) {
    	let img;
    	let img_draggable_value;
    	let img_src_value;
    	let img_alt_value;
    	let dispose;

    	function click_handler_10(...args) {
    		return ctx.click_handler_10(ctx, ...args);
    	}

    	function dragstart_handler_1(...args) {
    		return ctx.dragstart_handler_1(ctx, ...args);
    	}

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "draggable", img_draggable_value = true);
    			if (img.src !== (img_src_value = chessSets[ctx.__set][ctx.setupImgs[ctx.i].figure])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = ctx.setupImgs[ctx.i].figure);
    			set_style(img, "background", ctx.__lightBg);
    			set_style(img, "cursor", "pointer");
    			attr_dev(img, "width", "30px");
    			attr_dev(img, "height", "30px");
    			add_location(img, file, 215, 5, 6196);

    			dispose = [
    				listen_dev(img, "click", click_handler_10, false, false, false),
    				listen_dev(img, "dragstart", dragstart_handler_1, false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;

    			if (changed.__set && img.src !== (img_src_value = chessSets[ctx.__set][ctx.setupImgs[ctx.i].figure])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (changed.__lightBg) {
    				set_style(img, "background", ctx.__lightBg);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(215:6) {#each utils.range(0, 5) as i}",
    		ctx
    	});

    	return block;
    }

    // (231:6) {#each utils.range(6, 11) as i}
    function create_each_block_3(ctx) {
    	let img;
    	let img_draggable_value;
    	let img_src_value;
    	let img_alt_value;
    	let dispose;

    	function click_handler_11(...args) {
    		return ctx.click_handler_11(ctx, ...args);
    	}

    	function dragstart_handler_2(...args) {
    		return ctx.dragstart_handler_2(ctx, ...args);
    	}

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "draggable", img_draggable_value = true);
    			if (img.src !== (img_src_value = chessSets[ctx.__set][ctx.setupImgs[ctx.i].figure])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = ctx.setupImgs[ctx.i].figure);
    			set_style(img, "background", ctx.__darkBg);
    			set_style(img, "cursor", "pointer");
    			attr_dev(img, "width", "30px");
    			attr_dev(img, "height", "30px");
    			add_location(img, file, 231, 5, 6660);

    			dispose = [
    				listen_dev(img, "click", click_handler_11, false, false, false),
    				listen_dev(img, "dragstart", dragstart_handler_2, false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;

    			if (changed.__set && img.src !== (img_src_value = chessSets[ctx.__set][ctx.setupImgs[ctx.i].figure])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (changed.__darkBg) {
    				set_style(img, "background", ctx.__darkBg);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(231:6) {#each utils.range(6, 11) as i}",
    		ctx
    	});

    	return block;
    }

    // (283:4) {#each backgrounds as bg}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = ctx.bg.name + "";
    	let t;
    	let option_selected_value;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = ctx.__darkBg === ctx.bg.dark;
    			option.__value = option_value_value = ctx.bg.name;
    			option.value = option.__value;
    			add_location(option, file, 283, 6, 7901);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(changed, ctx) {
    			if (changed.__darkBg && option_selected_value !== (option_selected_value = ctx.__darkBg === ctx.bg.dark)) {
    				prop_dev(option, "selected", option_selected_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(283:4) {#each backgrounds as bg}",
    		ctx
    	});

    	return block;
    }

    // (291:4) {#each figureSets as s}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = ctx.utils.capitalize(ctx.s) + "";
    	let t;
    	let option_selected_value;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = ctx.__set === ctx.s;
    			option.__value = option_value_value = ctx.s;
    			option.value = option.__value;
    			add_location(option, file, 291, 6, 8194);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(changed, ctx) {
    			if (changed.figureSets && t_value !== (t_value = ctx.utils.capitalize(ctx.s) + "")) set_data_dev(t, t_value);

    			if ((changed.__set || changed.figureSets) && option_selected_value !== (option_selected_value = ctx.__set === ctx.s)) {
    				prop_dev(option, "selected", option_selected_value);
    			}

    			if (changed.figureSets && option_value_value !== (option_value_value = ctx.s)) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(291:4) {#each figureSets as s}",
    		ctx
    	});

    	return block;
    }

    // (328:4) {#each [{name: 'Queen', value: 'Q'}, {name: 'Knight', value: 'N'}, {name: 'Rook', value: 'R'}, {name: 'Bishop', value: 'B'}] as fig}
    function create_each_block(ctx) {
    	let option;
    	let t_value = ctx.fig.name + "";
    	let t;
    	let option_selected_value;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = ctx.autoPromotion === ctx.fig.value;
    			option.__value = option_value_value = ctx.fig.value;
    			option.value = option.__value;
    			add_location(option, file, 328, 6, 9492);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(changed, ctx) {
    			if (changed.autoPromotion && option_selected_value !== (option_selected_value = ctx.autoPromotion === ctx.fig.value)) {
    				prop_dev(option, "selected", option_selected_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(328:4) {#each [{name: 'Queen', value: 'Q'}, {name: 'Knight', value: 'N'}, {name: 'Rook', value: 'R'}, {name: 'Bishop', value: 'B'}] as fig}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div24;
    	let div1;
    	let each_blocks_5 = [];
    	let each0_lookup = new Map();
    	let t0;
    	let div0;
    	let t1;
    	let div23;
    	let div5;
    	let div3;
    	let div2;
    	let span0;
    	let t2_value = `${ctx.white} - ${ctx.black}` + "";
    	let t2;
    	let t3;
    	let span1;
    	let t4;
    	let t5;
    	let div4;
    	let span2;
    	let t6;
    	let t7;
    	let t8;
    	let span3;
    	let t9;
    	let t10;
    	let div6;
    	let t11;
    	let div22;
    	let h30;
    	let t13;
    	let div9;
    	let div7;
    	let label0;
    	let t15;
    	let div8;
    	let select0;
    	let t16;
    	let div12;
    	let div10;
    	let label1;
    	let t18;
    	let div11;
    	let select1;
    	let t19;
    	let div15;
    	let div13;
    	let label2;
    	let t21;
    	let div14;
    	let input;
    	let t22;
    	let h31;
    	let t24;
    	let div18;
    	let div16;
    	let label3;
    	let t26;
    	let div17;
    	let img0;
    	let img0_src_value;
    	let t27;
    	let img1;
    	let img1_src_value;
    	let t28;
    	let div21;
    	let div19;
    	let label4;
    	let t30;
    	let div20;
    	let select2;
    	let option;
    	let t31;
    	let option_value_value;
    	let option_selected_value;
    	let dispose;
    	let each_value_9 = ctx.currentRows;
    	const get_key = ctx => ctx.y;

    	for (let i = 0; i < each_value_9.length; i += 1) {
    		let child_ctx = get_each_context_9(ctx, each_value_9, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_5[i] = create_each_block_9(key, child_ctx));
    	}

    	let each_value_8 = ctx.promotionSet;
    	let each_blocks_4 = [];

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		each_blocks_4[i] = create_each_block_8(get_each_context_8(ctx, each_value_8, i));
    	}

    	let each_value_7 = ctx.history;
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		each_blocks_3[i] = create_each_block_7(get_each_context_7(ctx, each_value_7, i));
    	}

    	let if_block = ctx.__status === "SETUP" && create_if_block(ctx);
    	let each_value_2 = ctx.backgrounds;
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = ctx.figureSets;
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = [
    		{ name: "Queen", value: "Q" },
    		{ name: "Knight", value: "N" },
    		{ name: "Rook", value: "R" },
    		{ name: "Bishop", value: "B" }
    	];

    	let each_blocks = [];

    	for (let i = 0; i < 4; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div24 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].c();
    			}

    			t0 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].c();
    			}

    			t1 = space();
    			div23 = element("div");
    			div5 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			span1 = element("span");
    			t4 = text(ctx.result);
    			t5 = space();
    			div4 = element("div");
    			span2 = element("span");
    			t6 = text(" ");
    			t7 = space();

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t8 = space();
    			span3 = element("span");
    			t9 = text(ctx.result);
    			t10 = space();
    			div6 = element("div");
    			if (if_block) if_block.c();
    			t11 = space();
    			div22 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Appearance";
    			t13 = space();
    			div9 = element("div");
    			div7 = element("div");
    			label0 = element("label");
    			label0.textContent = "Backgrounds";
    			t15 = space();
    			div8 = element("div");
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t16 = space();
    			div12 = element("div");
    			div10 = element("div");
    			label1 = element("label");
    			label1.textContent = "Figure set";
    			t18 = space();
    			div11 = element("div");
    			select1 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t19 = space();
    			div15 = element("div");
    			div13 = element("div");
    			label2 = element("label");
    			label2.textContent = "Board flipped";
    			t21 = space();
    			div14 = element("div");
    			input = element("input");
    			t22 = space();
    			h31 = element("h3");
    			h31.textContent = "Options";
    			t24 = space();
    			div18 = element("div");
    			div16 = element("div");
    			label3 = element("label");
    			label3.textContent = "Human Plays with";
    			t26 = space();
    			div17 = element("div");
    			img0 = element("img");
    			t27 = space();
    			img1 = element("img");
    			t28 = space();
    			div21 = element("div");
    			div19 = element("div");
    			label4 = element("label");
    			label4.textContent = "Automatic Promotion";
    			t30 = space();
    			div20 = element("div");
    			select2 = element("select");
    			option = element("option");
    			t31 = text("None");

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop;
    			attr_dev(div0, "class", "promotion-panel");
    			set_style(div0, "display", ctx.__isPromoting ? "flex" : "none");
    			add_location(div0, file, 34, 1, 1320);
    			attr_dev(div1, "class", "board-child board");
    			add_location(div1, file, 6, 2, 144);
    			set_style(span0, "color", ctx.__lightBg);
    			set_style(span0, "background", ctx.__darkBg);
    			set_style(span0, "padding", "4px");
    			set_style(span0, "border-radius", "4px");
    			add_location(span0, file, 71, 3, 2277);
    			set_style(span1, "color", ctx.__lightBg);
    			set_style(span1, "background", ctx.__darkBg);
    			set_style(span1, "padding", "4px");
    			set_style(span1, "border-radius", "4px");
    			add_location(span1, file, 74, 3, 2413);
    			attr_dev(div2, "class", "header-row");
    			add_location(div2, file, 70, 5, 2249);
    			attr_dev(div3, "class", "headers");
    			set_style(div3, "color", ctx.__darkBg);
    			add_location(div3, file, 69, 3, 2195);
    			attr_dev(span2, "class", "san");
    			set_style(span2, "background", ctx.__current === 0 ? ctx.__darkBg : ctx.__lightBg);
    			set_style(span2, "border", ctx.__current === 0 ? "none" : "dashed 1px");
    			add_location(span2, file, 83, 5, 2623);
    			attr_dev(span3, "class", "san");
    			add_location(span3, file, 101, 5, 3070);
    			attr_dev(div4, "class", "history");
    			add_location(div4, file, 79, 3, 2556);
    			attr_dev(div5, "class", "board-panel-child");

    			set_style(div5, "display", ctx.__status === "PLAY" || ctx.__status === "VIEW" || ctx.__status === "ANALYZE"
    			? "flex"
    			: "none");

    			add_location(div5, file, 65, 4, 2044);
    			attr_dev(div6, "class", "board-panel-child");
    			set_style(div6, "display", ctx.__status === "SETUP" ? "flex" : "none");
    			add_location(div6, file, 110, 1, 3180);
    			attr_dev(h30, "class", "pad5");
    			set_style(h30, "text-align", "center");
    			set_style(h30, "border-bottom", "solid 1px silver");
    			add_location(h30, file, 276, 3, 7615);
    			attr_dev(label0, "class", "pad5");
    			add_location(label0, file, 280, 10, 7751);
    			add_location(div7, file, 280, 5, 7746);
    			add_location(select0, file, 281, 7, 7804);
    			add_location(div8, file, 281, 2, 7799);
    			attr_dev(div9, "class", "line");
    			add_location(div9, file, 279, 3, 7722);
    			attr_dev(label1, "class", "pad5");
    			add_location(label1, file, 288, 7, 8049);
    			add_location(div10, file, 288, 2, 8044);
    			add_location(select1, file, 289, 7, 8101);
    			add_location(div11, file, 289, 2, 8096);
    			attr_dev(div12, "class", "line");
    			add_location(div12, file, 287, 3, 8023);
    			attr_dev(label2, "for", "chkFlipped");
    			attr_dev(label2, "class", "pad5");
    			add_location(label2, file, 296, 10, 8342);
    			add_location(div13, file, 296, 5, 8337);
    			set_style(input, "cursor", "pointer");
    			attr_dev(input, "name", "chkFlipped");
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file, 298, 3, 8418);
    			add_location(div14, file, 297, 2, 8409);
    			attr_dev(div15, "class", "line");
    			add_location(div15, file, 295, 3, 8313);
    			attr_dev(h31, "class", "pad5");
    			set_style(h31, "text-align", "center");
    			set_style(h31, "border-bottom", "solid 1px silver");
    			add_location(h31, file, 301, 3, 8536);
    			attr_dev(label3, "class", "pad5");
    			add_location(label3, file, 305, 7, 8666);
    			add_location(div16, file, 305, 2, 8661);
    			if (img0.src !== (img0_src_value = chessSets[ctx.__set].K)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "white");
    			set_style(img0, "cursor", "pointer");
    			set_style(img0, "background", ctx.__human === "w" ? ctx.__darkBg : ctx.__lightBg);
    			attr_dev(img0, "title", "White");
    			add_location(img0, file, 307, 5, 8730);
    			if (img1.src !== (img1_src_value = chessSets[ctx.__set].k)) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "black");
    			set_style(img1, "cursor", "pointer");
    			set_style(img1, "background", ctx.__human === "b" ? ctx.__darkBg : ctx.__lightBg);
    			attr_dev(img1, "title", "Black");
    			add_location(img1, file, 314, 5, 8932);
    			add_location(div17, file, 306, 2, 8719);
    			attr_dev(div18, "class", "line");
    			add_location(div18, file, 304, 3, 8640);
    			attr_dev(label4, "class", "pad5");
    			add_location(label4, file, 324, 7, 9177);
    			add_location(div19, file, 324, 2, 9172);
    			option.__value = option_value_value = false;
    			option.value = option.__value;
    			option.selected = option_selected_value = !ctx.autoPromotion;
    			add_location(option, file, 326, 7, 9283);
    			if (ctx.autoPromotion === void 0) add_render_callback(() => ctx.select2_change_handler.call(select2));
    			add_location(select2, file, 325, 7, 9238);
    			add_location(div20, file, 325, 2, 9233);
    			attr_dev(div21, "class", "line");
    			add_location(div21, file, 323, 3, 9151);
    			attr_dev(div22, "class", "board-panel-child");
    			set_style(div22, "display", ctx.__status === "CONFIG" ? "flex" : "none");
    			add_location(div22, file, 272, 1, 7511);
    			attr_dev(div23, "class", "board-child board-panel");
    			set_style(div23, "color", ctx.__darkBg);
    			set_style(div23, "background", "beige");
    			add_location(div23, file, 51, 2, 1691);
    			attr_dev(div24, "class", "board-frame");
    			add_location(div24, file, 1, 0, 36);

    			dispose = [
    				listen_dev(div1, "dblclick", ctx.flip, false, false, false),
    				listen_dev(span2, "click", ctx.click_handler_2, false, false, false),
    				listen_dev(span3, "click", ctx.click_handler_4, false, false, false),
    				listen_dev(select0, "change", ctx.change_handler, false, false, false),
    				listen_dev(select1, "change", ctx.change_handler_1, false, false, false),
    				listen_dev(input, "change", ctx.input_change_handler),
    				listen_dev(img0, "click", ctx.click_handler_14, false, false, false),
    				listen_dev(img1, "click", ctx.click_handler_15, false, false, false),
    				listen_dev(select2, "change", ctx.select2_change_handler),
    				listen_dev(div23, "contextmenu", ctx.contextMenu, false, false, false),
    				listen_dev(div23, "dragover", prevent_default(ctx.dragover_handler_2), false, false, true),
    				listen_dev(div23, "drop", stop_propagation(ctx.drop_handler_2), false, true, false),
    				listen_dev(div24, "keypress", ctx.keypress_handler, false, false, false),
    				listen_dev(div24, "dragover", prevent_default(ctx.dragover_handler), false, false, true)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div24, anchor);
    			append_dev(div24, div1);

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].m(div1, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].m(div0, null);
    			}

    			ctx.div0_binding(div0);
    			ctx.div1_binding(div1);
    			append_dev(div24, t1);
    			append_dev(div24, div23);
    			append_dev(div23, div5);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			append_dev(div2, span0);
    			append_dev(span0, t2);
    			append_dev(div2, t3);
    			append_dev(div2, span1);
    			append_dev(span1, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, span2);
    			append_dev(span2, t6);
    			append_dev(div4, t7);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(div4, null);
    			}

    			append_dev(div4, t8);
    			append_dev(div4, span3);
    			append_dev(span3, t9);
    			ctx.div4_binding(div4);
    			append_dev(div23, t10);
    			append_dev(div23, div6);
    			if (if_block) if_block.m(div6, null);
    			append_dev(div23, t11);
    			append_dev(div23, div22);
    			append_dev(div22, h30);
    			append_dev(div22, t13);
    			append_dev(div22, div9);
    			append_dev(div9, div7);
    			append_dev(div7, label0);
    			append_dev(div9, t15);
    			append_dev(div9, div8);
    			append_dev(div8, select0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select0, null);
    			}

    			append_dev(div22, t16);
    			append_dev(div22, div12);
    			append_dev(div12, div10);
    			append_dev(div10, label1);
    			append_dev(div12, t18);
    			append_dev(div12, div11);
    			append_dev(div11, select1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select1, null);
    			}

    			append_dev(div22, t19);
    			append_dev(div22, div15);
    			append_dev(div15, div13);
    			append_dev(div13, label2);
    			append_dev(div15, t21);
    			append_dev(div15, div14);
    			append_dev(div14, input);
    			input.checked = ctx.__flipped;
    			append_dev(div22, t22);
    			append_dev(div22, h31);
    			append_dev(div22, t24);
    			append_dev(div22, div18);
    			append_dev(div18, div16);
    			append_dev(div16, label3);
    			append_dev(div18, t26);
    			append_dev(div18, div17);
    			append_dev(div17, img0);
    			append_dev(div17, t27);
    			append_dev(div17, img1);
    			append_dev(div22, t28);
    			append_dev(div22, div21);
    			append_dev(div21, div19);
    			append_dev(div19, label4);
    			append_dev(div21, t30);
    			append_dev(div21, div20);
    			append_dev(div20, select2);
    			append_dev(select2, option);
    			append_dev(option, t31);

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks[i].m(select2, null);
    			}

    			select_option(select2, ctx.autoPromotion);
    		},
    		p: function update(changed, ctx) {
    			const each_value_9 = ctx.currentRows;
    			each_blocks_5 = update_keyed_each(each_blocks_5, changed, get_key, 1, ctx, each_value_9, each0_lookup, div1, destroy_block, create_each_block_9, t0, get_each_context_9);

    			if (changed.promotePawn || changed.promotionSet || changed.sets || changed.__set) {
    				each_value_8 = ctx.promotionSet;
    				let i;

    				for (i = 0; i < each_value_8.length; i += 1) {
    					const child_ctx = get_each_context_8(ctx, each_value_8, i);

    					if (each_blocks_4[i]) {
    						each_blocks_4[i].p(changed, child_ctx);
    					} else {
    						each_blocks_4[i] = create_each_block_8(child_ctx);
    						each_blocks_4[i].c();
    						each_blocks_4[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_4.length; i += 1) {
    					each_blocks_4[i].d(1);
    				}

    				each_blocks_4.length = each_value_8.length;
    			}

    			if (changed.__isPromoting) {
    				set_style(div0, "display", ctx.__isPromoting ? "flex" : "none");
    			}

    			if ((changed.white || changed.black) && t2_value !== (t2_value = `${ctx.white} - ${ctx.black}` + "")) set_data_dev(t2, t2_value);

    			if (changed.__lightBg) {
    				set_style(span0, "color", ctx.__lightBg);
    			}

    			if (changed.__darkBg) {
    				set_style(span0, "background", ctx.__darkBg);
    			}

    			if (changed.result) set_data_dev(t4, ctx.result);

    			if (changed.__lightBg) {
    				set_style(span1, "color", ctx.__lightBg);
    			}

    			if (changed.__darkBg) {
    				set_style(span1, "background", ctx.__darkBg);
    			}

    			if (changed.__darkBg) {
    				set_style(div3, "color", ctx.__darkBg);
    			}

    			if (changed.__current || changed.__darkBg || changed.__lightBg) {
    				set_style(span2, "background", ctx.__current === 0 ? ctx.__darkBg : ctx.__lightBg);
    			}

    			if (changed.__current) {
    				set_style(span2, "border", ctx.__current === 0 ? "none" : "dashed 1px");
    			}

    			if (changed.__current || changed.__darkBg || changed.__lightBg || changed.goto || changed.history) {
    				each_value_7 = ctx.history;
    				let i;

    				for (i = 0; i < each_value_7.length; i += 1) {
    					const child_ctx = get_each_context_7(ctx, each_value_7, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(changed, child_ctx);
    					} else {
    						each_blocks_3[i] = create_each_block_7(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(div4, t8);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_7.length;
    			}

    			if (changed.result) set_data_dev(t9, ctx.result);

    			if (changed.__status) {
    				set_style(div5, "display", ctx.__status === "PLAY" || ctx.__status === "VIEW" || ctx.__status === "ANALYZE"
    				? "flex"
    				: "none");
    			}

    			if (ctx.__status === "SETUP") {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div6, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (changed.__status) {
    				set_style(div6, "display", ctx.__status === "SETUP" ? "flex" : "none");
    			}

    			if (changed.__darkBg || changed.backgrounds) {
    				each_value_2 = ctx.backgrounds;
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(changed, child_ctx);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (changed.__set || changed.figureSets || changed.utils) {
    				each_value_1 = ctx.figureSets;
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (changed.__flipped) {
    				input.checked = ctx.__flipped;
    			}

    			if (changed.__set && img0.src !== (img0_src_value = chessSets[ctx.__set].K)) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (changed.__human || changed.__darkBg || changed.__lightBg) {
    				set_style(img0, "background", ctx.__human === "w" ? ctx.__darkBg : ctx.__lightBg);
    			}

    			if (changed.__set && img1.src !== (img1_src_value = chessSets[ctx.__set].k)) {
    				attr_dev(img1, "src", img1_src_value);
    			}

    			if (changed.__human || changed.__darkBg || changed.__lightBg) {
    				set_style(img1, "background", ctx.__human === "b" ? ctx.__darkBg : ctx.__lightBg);
    			}

    			if (changed.autoPromotion && option_selected_value !== (option_selected_value = !ctx.autoPromotion)) {
    				prop_dev(option, "selected", option_selected_value);
    			}

    			if (changed.autoPromotion) {
    				each_value = [
    					{ name: "Queen", value: "Q" },
    					{ name: "Knight", value: "N" },
    					{ name: "Rook", value: "R" },
    					{ name: "Bishop", value: "B" }
    				];

    				let i;

    				for (i = 0; i < 4; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select2, null);
    					}
    				}

    				for (; i < 4; i += 1) {
    					each_blocks[i].d(1);
    				}
    			}

    			if (changed.autoPromotion) {
    				select_option(select2, ctx.autoPromotion);
    			}

    			if (changed.__status) {
    				set_style(div22, "display", ctx.__status === "CONFIG" ? "flex" : "none");
    			}

    			if (changed.__darkBg) {
    				set_style(div23, "color", ctx.__darkBg);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div24);

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].d();
    			}

    			destroy_each(each_blocks_4, detaching);
    			ctx.div0_binding(null);
    			ctx.div1_binding(null);
    			destroy_each(each_blocks_3, detaching);
    			ctx.div4_binding(null);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const utils = Chess.utils();
    	let { initialFen = Chess.defaultFen() } = $$props;
    	const game = new Chess(initialFen);
    	let { autoPromotion = false } = $$props;
    	const dispatch = createEventDispatcher();
    	let __isPromoting = false;
    	const states = ["PLAY", "VIEW", "ANALYZE", "CONFIG", "SETUP"];
    	let { initialStatus = "ANALYZE" } = $$props;
    	let { __status = initialStatus } = $$props;
    	const getStatus = () => __status;

    	const setStatus = newState => {
    		if (!newState) newState = "ANALYZE";

    		switch (newState.constructor.name) {
    			case "String":
    				newState = newState.toUpperCase();
    				const found = states.find(s => s === newState);
    				$$invalidate("__status", __status = found ? found : __status);
    				if (found) refresh();
    				if (__status === "SETUP" && found) $$invalidate("fenCopy", fenCopy = game.fen);
    				return !!found;
    			case "Number":
    				if (newState < 0 || newState >= states.length) return false;
    				$$invalidate("__status", __status = states[newState]);
    				refresh();
    				if (__status === "SETUP") $$invalidate("fenCopy", fenCopy = game.fen);
    				return true;
    			default:
    				return false;
    		}
    	};

    	const setup = () => setStatus("setup");
    	const config = () => setStatus("config");
    	const analyze = () => setStatus("analyze");
    	const view = () => setStatus("view");
    	const play = () => setStatus("play");
    	let { humanSide = "w" } = $$props;
    	let __human = humanSide;
    	const getHuman = () => __human;

    	const setHuman = h => {
    		if ((/[wb]/i).test(h)) {
    			$$invalidate("__human", __human = h.toLowerCase());
    			refresh();
    			return true;
    		} else {
    			return false;
    		}
    	};

    	const xor_arr = (aoa, xorVal) => aoa.reduce((base, a) => [...base, a.map(v => v ^ xorVal)], []);
    	const rows = utils.partition(utils.chessboard, 8);
    	const flipped_arr = xor_arr(rows, 7);
    	const unflipped_arr = xor_arr(rows, 56);
    	const getWhite = (n = __current) => game.headers("White");
    	const getBlack = (n = __current) => game.headers("Black");
    	const getCurrentRows = () => currentRows;
    	let __flipped = false;
    	const getFlipped = () => __flipped;

    	const flip = () => {
    		$$invalidate("__flipped", __flipped = !__flipped);
    		dispatch("update");
    	};

    	let { __current = 0 } = $$props;
    	const getCurrent = () => __current;

    	const goto = n => {
    		if (__status !== "ANALYZE" && __status !== "VIEW") return -1;

    		n = n < 0
    		? 0
    		: n > game.history().length ? game.history().length : n;

    		if (__current !== n) {
    			$$invalidate("__current", __current = n);
    		}

    		return n;
    	};

    	const version = "0.15.11";
    	const getPosition = () => position;
    	let { figureSets = [] } = $$props;
    	for (let k in chessSets) $$invalidate("figureSets", figureSets = [...figureSets, k]);
    	let __set = "default";
    	const getFigureSet = () => __set;

    	const setFigureSet = newSet => {
    		if (typeof newSet === "undefined") {
    			$$invalidate("__set", __set = "default");
    			dispatch("update");
    			return true;
    		} else {
    			switch (newSet.constructor.name) {
    				case "String":
    					newSet = newSet.toLowerCase();
    					const found = figureSets.find(s => s === newSet);
    					$$invalidate("__set", __set = found ? found : __set);
    					!!found && dispatch("update");
    					return !!found;
    				case "Number":
    					if (newSet < 0 || newSet >= figureSets.length) return false;
    					$$invalidate("__set", __set = figureSets[newSet]);
    					dispatch("update");
    					return true;
    				default:
    					return false;
    			}
    		}
    	};

    	const backgrounds = [
    		{
    			name: "Acqua",
    			dark: "#56B6E2",
    			light: "#DFDFDF"
    		},
    		{
    			name: "Blue",
    			dark: "#6495ED",
    			light: "#ADD8E6"
    		},
    		{
    			name: "Brown",
    			dark: "#B58863",
    			light: "#F0D9B5"
    		},
    		{
    			name: "Green",
    			dark: "#769656",
    			light: "beige"
    		},
    		{
    			name: "Maroon",
    			dark: "#B2535B",
    			light: "#FFF2D7"
    		}
    	];

    	let { initialLightBg } = $$props;
    	let { initialDarkBg } = $$props;
    	let __lightBg = initialLightBg || backgrounds[1].light;
    	let __darkBg = initialDarkBg || backgrounds[1].dark;
    	const getBackgrounds = () => ({ light: __lightBg, dark: __darkBg });

    	const setBackgrounds = options => {
    		switch (options.constructor.name) {
    			case "String":
    				const bg = backgrounds.find(bg => bg.name.toLowerCase() === options.toLowerCase());
    				if (bg) {
    					$$invalidate("__lightBg", __lightBg = bg.light);
    					$$invalidate("__darkBg", __darkBg = bg.dark);
    					dispatch("update");
    					return true;
    				} else {
    					return false;
    				}
    			case "Number":
    				if (options < 0 || options >= backgrounds.length) return false;
    				$$invalidate("__lightBg", __lightBg = backgrounds[options].light);
    				$$invalidate("__darkBg", __darkBg = backgrounds[options].dark);
    				dispatch("update");
    				return true;
    			case "Object":
    				if (options.light && options.dark) {
    					$$invalidate("__lightBg", __lightBg = options.light);
    					$$invalidate("__darkBg", __darkBg = options.dark);
    					dispatch("update");
    					return true;
    				} else {
    					return false;
    				}
    			default:
    				return false;
    		}
    	};

    	let { castling } = $$props;

    	const getPanelProp = (prop = "offsetLeft") => {
    		if (!boardElement) return -1000;
    		if (!panelElement) return -1000;
    		if (!__isPromoting) return -1000;
    		if (__sqFrom === -1 || __sqTo === -1 || !__figureFrom) return -1000;
    		let base;
    		const sqWidth = boardElement.offsetWidth / 8;

    		if (prop === "offsetLeft") {
    			base = boardElement.offsetLeft;
    			const column = __flipped ? utils.col(__sqTo) ^ 7 : utils.col(__sqTo);
    			return base + sqWidth * column;
    		} else if (prop === "offsetTop") {
    			base = boardElement.offsetTop;
    			const row = __flipped ? utils.row(__sqTo) : utils.row(__sqTo) ^ 7;
    			return base + sqWidth * row;
    		} else {
    			return -1000;
    		}
    	};

    	const getPanelLeft = () => getPanelProp("offsetLeft");
    	const getPanelTop = () => getPanelProp("offsetTop");
    	let { boardElement } = $$props;
    	let { historyElement } = $$props;
    	let { panelElement } = $$props;

    	const promotePawn = promotion => {
    		$$invalidate("__promotion", __promotion = promotion.toUpperCase());
    		$$invalidate("__isPromoting", __isPromoting = false);
    		try_move(__sqFrom, __sqTo, __promotion);
    	};

    	const refresh = () => {
    		const curcur = __current;
    		setTimeout(() => $$invalidate("__current", __current = -1), 10);
    		setTimeout(() => $$invalidate("__current", __current = curcur), 15);
    		return curcur;
    	};

    	const remote_move = (...args) => {
    		const response = game.move(...args);

    		if (response) {
    			$$invalidate("__current", __current = game.history().length);
    			setTimeout(() => $$invalidate("historyElement", historyElement.scrollTop = historyElement.scrollHeight, historyElement), 0);
    			dispatch("update");
    		}

    		return response;
    	};

    	let { isCheck } = $$props;
    	let { isCheckMate } = $$props;
    	const getCheck = () => game.isCheck;
    	const getCheckMate = () => game.isCheckMate;

    	const try_move = (...args) => {
    		if (args.length > 1) {
    			if ((/p/i).test(__figureFrom)) {
    				if (utils.isPawnPromotion(args[0] || __sqFrom, args[1] || __sqTo, __figureFrom === "P" ? "w" : "b") && utils.canMove(game.fen, args[0] || __sqFrom, args[1] || __sqTo)) {
    					const prom = args[2] || __promotion;

    					if (prom) {
    						args[2] = prom;
    					} else if (autoPromotion) {
    						args[2] = autoPromotion;
    					} else {
    						if (__imgSrc) {
    							$$invalidate("__imgSrc", __imgSrc.style.opacity = 1, __imgSrc);
    							$$invalidate("__imgSrc", __imgSrc = null);
    						}

    						$$invalidate("__isPromoting", __isPromoting = true);
    						return false;
    					}
    				}
    			}
    		}

    		const response = game.move(...args);

    		if (response) {
    			$$invalidate("__current", __current = game.history().length);
    			setTimeout(() => $$invalidate("historyElement", historyElement.scrollTop = historyElement.scrollHeight, historyElement), 0);
    			dispatch("update");
    		}

    		if (__imgSrc) {
    			$$invalidate("__imgSrc", __imgSrc.style.opacity = 1, __imgSrc);
    		}

    		$$invalidate("__sqFrom", __sqFrom = -1);
    		$$invalidate("__sqTo", __sqTo = -1);
    		$$invalidate("__figureFrom", __figureFrom = null);
    		$$invalidate("__figureTo", __figureTo = null);
    		$$invalidate("__promotion", __promotion = null);
    		$$invalidate("__imgSrc", __imgSrc = null);
    		return response;
    	};

    	const undo = () => {
    		if (__status !== "ANALYZE") return false;
    		const response = game.undo();

    		if (response) {
    			setTimeout(() => $$invalidate("__current", __current = game.history().length), 0);
    		}

    		return response;
    	};

    	const reset = (fen = Chess.defaultFen()) => {
    		if (__status !== "ANALYZE") return false;
    		const response = game.reset(fen);

    		if (response) {
    			$$invalidate("__current", __current = -1);

    			if (__imgSrc) {
    				$$invalidate("__imgSrc", __imgSrc.style.opacity = 1, __imgSrc);
    				$$invalidate("__imgSrc", __imgSrc = null);
    			}

    			$$invalidate("__sqFrom", __sqFrom = -1);
    			$$invalidate("__sqTo", __sqTo = -1);
    			$$invalidate("__figureFrom", __figureFrom = null);
    			$$invalidate("__figureTo", __figureTo = null);
    			$$invalidate("__promotion", __promotion = null);
    			$$invalidate("__imgSrc", __imgSrc = null);

    			setTimeout(
    				() => {
    					$$invalidate("__current", __current = game.history().length);
    					refresh();
    				},
    				0
    			);
    		}

    		return response;
    	};

    	let { now } = $$props;
    	const getHistory = (n = 0) => game.numbered_history();
    	const getResult = (n = 0) => game.headers("Result");
    	let { turn } = $$props;

    	const canMoveFrom = sq => {
    		if (utils.isEmptyFigure(game.position[sq])) {
    			return false;
    		}

    		if (__current !== game.history().length) {
    			return false;
    		}

    		if (__status === "VIEW") {
    			return false;
    		}

    		if (__status === "SETUP") {
    			return true;
    		}

    		sq = utils.sqNumber(sq);

    		if (__status === "PLAY") {
    			if (__human === "w" && utils.isBlackFigure(game.position[sq]) || __human === "b" && utils.isWhiteFigure(game.position[sq])) {
    				return false;
    			} else {
    				return true;
    			}
    		}

    		if (game.turn === "w" && utils.isBlackFigure(game.position[sq]) || game.turn === "b" && utils.isWhiteFigure(game.position[sq])) {
    			return false;
    		}

    		return true;
    	};

    	let { __imgSrc = null } = $$props;
    	let { __figureFrom = null } = $$props;
    	let { __figureTo = null } = $$props;
    	let { __sqFrom = -1 } = $$props;
    	let { __sqTo = -1 } = $$props;
    	let { __promotion = null } = $$props;

    	const setupImgs = [
    		{ figure: "p", index: -10 },
    		{ figure: "n", index: -20 },
    		{ figure: "b", index: -30 },
    		{ figure: "r", index: -40 },
    		{ figure: "q", index: -50 },
    		{ figure: "k", index: -60 },
    		{ figure: "P", index: -110 },
    		{ figure: "N", index: -120 },
    		{ figure: "B", index: -130 },
    		{ figure: "R", index: -140 },
    		{ figure: "Q", index: -150 },
    		{ figure: "K", index: -160 }
    	];

    	const handleDragStart = (ev, sq) => {
    		$$invalidate("__imgSrc", __imgSrc = ev.target);
    		if (sq >= 0) ev.target.style.opacity = 0.1;

    		if (navigator.userAgent.match(/Firefox|Edge/)) {
    			let img = new Image();
    			img.style.opacity = 1;
    			let width = ev.target.parentElement.clientWidth;
    			let distance = width / 2;
    			img.src = ev.target.src;
    			let canvas = document.createElement("canvas");
    			let ctx = canvas.getContext("2d");
    			ctx.canvas.width = width;
    			ctx.canvas.height = width;
    			ctx.drawImage(img, 0, 0, width, width);
    			img.src = canvas.toDataURL();

    			if (ev.dataTransfer.setDragImage) {
    				ev.dataTransfer.setDragImage(img, distance, distance);
    			} else if (ev.dataTransfer.addElement) {
    				ev.dataTransfer.addElement(img);
    			}
    		}

    		handleInput(ev, sq);
    	};

    	const handleInput = (ev, sq) => {
    		if (__sqFrom === -1) {
    			if (canMoveFrom(sq)) {
    				$$invalidate("__sqFrom", __sqFrom = sq);

    				$$invalidate("__figureFrom", __figureFrom = sq >= 0
    				? game.position[sq]
    				: setupImgs.find(i => i.index === sq).figure);

    				return true;
    			} else {
    				return false;
    			}
    		} else {
    			if (__sqFrom === sq) {
    				if (__imgSrc) {
    					$$invalidate("__imgSrc", __imgSrc.style.opacity = 1, __imgSrc);
    				}

    				$$invalidate("__sqFrom", __sqFrom = -1);
    				$$invalidate("__sqTo", __sqTo = -1);
    				$$invalidate("__figureFrom", __figureFrom = null);
    				$$invalidate("__figureTo", __figureTo = null);
    				$$invalidate("__imgSrc", __imgSrc = null);
    				return false;
    			} else {
    				$$invalidate("__sqTo", __sqTo = sq);
    				$$invalidate("__figureTo", __figureTo = game.position[sq]);

    				if (__status !== "SETUP") {
    					try_move(__sqFrom, __sqTo);
    				} else {
    					game.put(__sqFrom, "0");
    					game.put(__sqTo, __figureFrom);
    					$$invalidate("__sqFrom", __sqFrom = -1);
    					$$invalidate("__sqTo", __sqTo = -1);
    					$$invalidate("__figureFrom", __figureFrom = null);
    					$$invalidate("__figureTo", __figureTo = null);
    					$$invalidate("__imgSrc", __imgSrc = null);
    					refresh();
    				}
    			}
    		}
    	};

    	const load_pgn = pgn => {
    		if (__status !== "VIEW" && __status !== "ANALYZE") return false;
    		const ret = game.load_pgn(pgn);

    		if (ret) {
    			setTimeout(() => goto(game.history().length), 0);
    			setTimeout(() => goto(0), 1);
    		}

    		return ret;
    	};

    	const contextMenu = ev => console.log("Context menu invoked.");

    	const getCastlingIndex = fig => {
    		switch (fig) {
    			case "K":
    				return 0;
    			case "Q":
    				return 1;
    			case "k":
    				return 2;
    			case "q":
    				return 3;
    			default:
    				return -1;
    		}
    	};

    	let { fenCopy = utils.defaultFen } = $$props;

    	const setTurn = t => {
    		let obj = utils.fen2obj(game.fen);
    		obj.turn = t;
    		$$invalidate("game", game.fen = utils.obj2fen(obj), game);
    		refresh();
    	};

    	const setCastling = fig => {
    		let obj = utils.fen2obj(game.fen);
    		const ccastling = obj.castling;

    		let currCastling = [
    			ccastling.indexOf("K") !== -1 ? "K" : "-",
    			ccastling.indexOf("Q") !== -1 ? "Q" : "-",
    			ccastling.indexOf("k") !== -1 ? "k" : "-",
    			ccastling.indexOf("q") !== -1 ? "q" : "-"
    		];

    		const index = currCastling.findIndex(f => f === fig);

    		if (index !== -1) {
    			currCastling[index] = "-";
    		} else {
    			currCastling[getCastlingIndex(fig)] = fig;
    		}

    		let newCastling = currCastling.filter(x => x !== "-").join("");
    		newCastling = newCastling.length ? newCastling : "-";
    		obj.castling = newCastling;
    		$$invalidate("game", game.fen = utils.obj2fen(obj), game);
    		refresh();
    	};

    	onMount(() => {
    		document.body.addEventListener("dragover", e => e.preventDefault());

    		document.body.addEventListener("drop", e => {
    			 console.log("Dropping out of the board!!");
    			$$invalidate("__sqFrom", __sqFrom = -1);
    			$$invalidate("__sqTo", __sqTo = -1);
    			$$invalidate("__figureFrom", __figureFrom = null);
    			$$invalidate("__figureTo", __figureTo = null);

    			__imgSrc
    			? $$invalidate("__imgSrc", __imgSrc.style.opacity = 1, __imgSrc)
    			: null;

    			$$invalidate("__imgSrc", __imgSrc = null);
    		});
    	});

    	const writable_props = [
    		"initialFen",
    		"autoPromotion",
    		"initialStatus",
    		"__status",
    		"humanSide",
    		"__current",
    		"figureSets",
    		"initialLightBg",
    		"initialDarkBg",
    		"castling",
    		"boardElement",
    		"historyElement",
    		"panelElement",
    		"isCheck",
    		"isCheckMate",
    		"now",
    		"turn",
    		"__imgSrc",
    		"__figureFrom",
    		"__figureTo",
    		"__sqFrom",
    		"__sqTo",
    		"__promotion",
    		"fenCopy"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<chess-board> was created with unknown prop '${key}'`);
    	});

    	function dragover_handler(event) {
    		bubble($$self, event);
    	}

    	function dragover_handler_2(event) {
    		bubble($$self, event);
    	}

    	function dragover_handler_3(event) {
    		bubble($$self, event);
    	}

    	function dragover_handler_1(event) {
    		bubble($$self, event);
    	}

    	const dragstart_handler = ({ y, x }, e) => handleDragStart(e, currentRows[y][x]);
    	const click_handler = ({ y, x }, e) => handleInput(e, currentRows[y][x]);
    	const drop_handler = ({ y, x }, e) => handleInput(e, currentRows[y][x]);
    	const click_handler_1 = ({ fig }) => promotePawn(fig);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("panelElement", panelElement = $$value);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("boardElement", boardElement = $$value);
    		});
    	}

    	const click_handler_2 = () => goto(0);
    	const click_handler_3 = ({ i }) => goto(i + 1);
    	const click_handler_4 = () => goto(history.length);

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate("historyElement", historyElement = $$value);
    		});
    	}

    	const click_handler_5 = ({ fig }) => setCastling(fig);
    	const click_handler_6 = ({ fig }) => setTurn(fig.side);

    	const click_handler_7 = () => {
    		utils.range(0, 63).forEach(n => game.put(n, "0"));
    		refresh();
    	};

    	const click_handler_8 = () => {
    		utils.defaultFenArray.forEach((v, n) => game.put(n, v));
    		refresh();
    	};

    	const drop_handler_1 = ev => {
    		game.put(__sqFrom, "0");
    		$$invalidate("__sqFrom", __sqFrom = -1);
    		$$invalidate("__sqTo", __sqTo = -1);
    		$$invalidate("__figureFrom", __figureFrom = null);
    		$$invalidate("__figureTo", __figureTo = null);
    		$$invalidate("__imgSrc", __imgSrc = null);
    		refresh();
    	};

    	const click_handler_9 = ev => {
    		if (__sqFrom < 0) return;
    		game.put(__sqFrom, "0");
    		$$invalidate("__sqFrom", __sqFrom = -1);
    		$$invalidate("__sqTo", __sqTo = -1);
    		$$invalidate("__figureFrom", __figureFrom = null);
    		$$invalidate("__figureTo", __figureTo = null);
    		$$invalidate("__imgSrc", __imgSrc = null);
    		refresh();
    	};

    	const click_handler_10 = ({ i }, e) => handleInput(e, setupImgs[i].index);
    	const dragstart_handler_1 = ({ i }, e) => handleDragStart(e, setupImgs[i].index);
    	const click_handler_11 = ({ i }, e) => handleInput(e, setupImgs[i].index);
    	const dragstart_handler_2 = ({ i }, e) => handleDragStart(e, setupImgs[i].index);

    	const click_handler_12 = () => {
    		$$invalidate("game", game.fen = fenCopy, game);
    		setStatus("analyze");
    		refresh();
    	};

    	const click_handler_13 = () => {
    		const validFen = utils.validateFen(game.fen);

    		if (validFen.valid) {
    			setStatus("analyze");
    			refresh();
    			dispatch("update");
    		} else {
    			alert(`Current position is not valid.\n${validFen.message}`);
    		}
    	};

    	const change_handler = ev => setBackgrounds(ev.target.value);
    	const change_handler_1 = ev => setFigureSet(ev.target.value);

    	function input_change_handler() {
    		__flipped = this.checked;
    		$$invalidate("__flipped", __flipped);
    	}

    	const click_handler_14 = () => setHuman("w");
    	const click_handler_15 = () => setHuman("b");

    	function select2_change_handler() {
    		autoPromotion = select_value(this);
    		$$invalidate("autoPromotion", autoPromotion);
    	}

    	const drop_handler_2 = ev => {
    		$$invalidate("__sqFrom", __sqFrom = -1);
    		$$invalidate("__sqTo", __sqTo = -1);
    		$$invalidate("__figureFrom", __figureFrom = null);
    		$$invalidate("__figureTo", __figureTo = null);

    		__imgSrc
    		? $$invalidate("__imgSrc", __imgSrc.style.opacity = 1, __imgSrc)
    		: null;

    		$$invalidate("__imgSrc", __imgSrc = null);
    	};

    	const keypress_handler = e => console.log(e.keycode);

    	$$self.$set = $$props => {
    		if ("initialFen" in $$props) $$invalidate("initialFen", initialFen = $$props.initialFen);
    		if ("autoPromotion" in $$props) $$invalidate("autoPromotion", autoPromotion = $$props.autoPromotion);
    		if ("initialStatus" in $$props) $$invalidate("initialStatus", initialStatus = $$props.initialStatus);
    		if ("__status" in $$props) $$invalidate("__status", __status = $$props.__status);
    		if ("humanSide" in $$props) $$invalidate("humanSide", humanSide = $$props.humanSide);
    		if ("__current" in $$props) $$invalidate("__current", __current = $$props.__current);
    		if ("figureSets" in $$props) $$invalidate("figureSets", figureSets = $$props.figureSets);
    		if ("initialLightBg" in $$props) $$invalidate("initialLightBg", initialLightBg = $$props.initialLightBg);
    		if ("initialDarkBg" in $$props) $$invalidate("initialDarkBg", initialDarkBg = $$props.initialDarkBg);
    		if ("castling" in $$props) $$invalidate("castling", castling = $$props.castling);
    		if ("boardElement" in $$props) $$invalidate("boardElement", boardElement = $$props.boardElement);
    		if ("historyElement" in $$props) $$invalidate("historyElement", historyElement = $$props.historyElement);
    		if ("panelElement" in $$props) $$invalidate("panelElement", panelElement = $$props.panelElement);
    		if ("isCheck" in $$props) $$invalidate("isCheck", isCheck = $$props.isCheck);
    		if ("isCheckMate" in $$props) $$invalidate("isCheckMate", isCheckMate = $$props.isCheckMate);
    		if ("now" in $$props) $$invalidate("now", now = $$props.now);
    		if ("turn" in $$props) $$invalidate("turn", turn = $$props.turn);
    		if ("__imgSrc" in $$props) $$invalidate("__imgSrc", __imgSrc = $$props.__imgSrc);
    		if ("__figureFrom" in $$props) $$invalidate("__figureFrom", __figureFrom = $$props.__figureFrom);
    		if ("__figureTo" in $$props) $$invalidate("__figureTo", __figureTo = $$props.__figureTo);
    		if ("__sqFrom" in $$props) $$invalidate("__sqFrom", __sqFrom = $$props.__sqFrom);
    		if ("__sqTo" in $$props) $$invalidate("__sqTo", __sqTo = $$props.__sqTo);
    		if ("__promotion" in $$props) $$invalidate("__promotion", __promotion = $$props.__promotion);
    		if ("fenCopy" in $$props) $$invalidate("fenCopy", fenCopy = $$props.fenCopy);
    	};

    	$$self.$capture_state = () => {
    		return {
    			initialFen,
    			autoPromotion,
    			__isPromoting,
    			initialStatus,
    			__status,
    			humanSide,
    			__human,
    			__flipped,
    			__current,
    			figureSets,
    			__set,
    			initialLightBg,
    			initialDarkBg,
    			__lightBg,
    			__darkBg,
    			castling,
    			boardElement,
    			historyElement,
    			panelElement,
    			isCheck,
    			isCheckMate,
    			now,
    			turn,
    			__imgSrc,
    			__figureFrom,
    			__figureTo,
    			__sqFrom,
    			__sqTo,
    			__promotion,
    			fenCopy,
    			white,
    			black,
    			currentRows,
    			gameTitle,
    			position,
    			promotionBg,
    			promotionSet,
    			history,
    			result
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("initialFen" in $$props) $$invalidate("initialFen", initialFen = $$props.initialFen);
    		if ("autoPromotion" in $$props) $$invalidate("autoPromotion", autoPromotion = $$props.autoPromotion);
    		if ("__isPromoting" in $$props) $$invalidate("__isPromoting", __isPromoting = $$props.__isPromoting);
    		if ("initialStatus" in $$props) $$invalidate("initialStatus", initialStatus = $$props.initialStatus);
    		if ("__status" in $$props) $$invalidate("__status", __status = $$props.__status);
    		if ("humanSide" in $$props) $$invalidate("humanSide", humanSide = $$props.humanSide);
    		if ("__human" in $$props) $$invalidate("__human", __human = $$props.__human);
    		if ("__flipped" in $$props) $$invalidate("__flipped", __flipped = $$props.__flipped);
    		if ("__current" in $$props) $$invalidate("__current", __current = $$props.__current);
    		if ("figureSets" in $$props) $$invalidate("figureSets", figureSets = $$props.figureSets);
    		if ("__set" in $$props) $$invalidate("__set", __set = $$props.__set);
    		if ("initialLightBg" in $$props) $$invalidate("initialLightBg", initialLightBg = $$props.initialLightBg);
    		if ("initialDarkBg" in $$props) $$invalidate("initialDarkBg", initialDarkBg = $$props.initialDarkBg);
    		if ("__lightBg" in $$props) $$invalidate("__lightBg", __lightBg = $$props.__lightBg);
    		if ("__darkBg" in $$props) $$invalidate("__darkBg", __darkBg = $$props.__darkBg);
    		if ("castling" in $$props) $$invalidate("castling", castling = $$props.castling);
    		if ("boardElement" in $$props) $$invalidate("boardElement", boardElement = $$props.boardElement);
    		if ("historyElement" in $$props) $$invalidate("historyElement", historyElement = $$props.historyElement);
    		if ("panelElement" in $$props) $$invalidate("panelElement", panelElement = $$props.panelElement);
    		if ("isCheck" in $$props) $$invalidate("isCheck", isCheck = $$props.isCheck);
    		if ("isCheckMate" in $$props) $$invalidate("isCheckMate", isCheckMate = $$props.isCheckMate);
    		if ("now" in $$props) $$invalidate("now", now = $$props.now);
    		if ("turn" in $$props) $$invalidate("turn", turn = $$props.turn);
    		if ("__imgSrc" in $$props) $$invalidate("__imgSrc", __imgSrc = $$props.__imgSrc);
    		if ("__figureFrom" in $$props) $$invalidate("__figureFrom", __figureFrom = $$props.__figureFrom);
    		if ("__figureTo" in $$props) $$invalidate("__figureTo", __figureTo = $$props.__figureTo);
    		if ("__sqFrom" in $$props) $$invalidate("__sqFrom", __sqFrom = $$props.__sqFrom);
    		if ("__sqTo" in $$props) $$invalidate("__sqTo", __sqTo = $$props.__sqTo);
    		if ("__promotion" in $$props) $$invalidate("__promotion", __promotion = $$props.__promotion);
    		if ("fenCopy" in $$props) $$invalidate("fenCopy", fenCopy = $$props.fenCopy);
    		if ("white" in $$props) $$invalidate("white", white = $$props.white);
    		if ("black" in $$props) $$invalidate("black", black = $$props.black);
    		if ("currentRows" in $$props) $$invalidate("currentRows", currentRows = $$props.currentRows);
    		if ("gameTitle" in $$props) gameTitle = $$props.gameTitle;
    		if ("position" in $$props) $$invalidate("position", position = $$props.position);
    		if ("promotionBg" in $$props) $$invalidate("promotionBg", promotionBg = $$props.promotionBg);
    		if ("promotionSet" in $$props) $$invalidate("promotionSet", promotionSet = $$props.promotionSet);
    		if ("history" in $$props) $$invalidate("history", history = $$props.history);
    		if ("result" in $$props) $$invalidate("result", result = $$props.result);
    	};

    	let white;
    	let black;
    	let currentRows;
    	let gameTitle;
    	let position;
    	let promotionBg;
    	let promotionSet;
    	let history;
    	let result;

    	$$self.$$.update = (changed = { __current: 1, __flipped: 1, game: 1, __sqTo: 1, __darkBg: 1, __lightBg: 1, __figureFrom: 1, boardElement: 1, panelElement: 1, promotionBg: 1, __isPromoting: 1 }) => {
    		if (changed.__current) {
    			 $$invalidate("white", white = getWhite(__current));
    		}

    		if (changed.__current) {
    			 $$invalidate("black", black = getBlack(__current));
    		}

    		if (changed.__flipped) {
    			 $$invalidate("currentRows", currentRows = __flipped ? flipped_arr : unflipped_arr);
    		}

    		if (changed.game) {
    			 gameTitle = game.title;
    		}

    		if (changed.game || changed.__current) {
    			 $$invalidate("position", position = game.positions[__current < 0 ? 0 : __current]);
    		}

    		if (changed.game || changed.__current) {
    			 $$invalidate("castling", castling = game.getCastling(__current >= 0 ? __current : 0));
    		}

    		if (changed.__sqTo || changed.__darkBg || changed.__lightBg) {
    			 $$invalidate("promotionBg", promotionBg = utils.isDarkSquare(__sqTo || 0) ? __darkBg : __lightBg);
    		}

    		if (changed.__figureFrom) {
    			 $$invalidate("promotionSet", promotionSet = __figureFrom === "P"
    			? ["Q", "N", "R", "B"]
    			: ["q", "n", "r", "b"]);
    		}

    		if (changed.boardElement || changed.panelElement || changed.promotionBg) {
    			 if (!!boardElement) {
    				if (!!panelElement) {
    					$$invalidate("panelElement", panelElement.style.top = getPanelTop() + "px", panelElement);
    					$$invalidate("panelElement", panelElement.style.left = getPanelLeft() + "px", panelElement);
    					$$invalidate("panelElement", panelElement.style.background = promotionBg, panelElement);
    				}
    			}
    		}

    		if (changed.__isPromoting) {
    			 if (__isPromoting) {
    				$$invalidate("panelElement", panelElement.style.top = getPanelTop() + "px", panelElement);
    				$$invalidate("panelElement", panelElement.style.left = getPanelLeft() + "px", panelElement);
    			}
    		}

    		if (changed.__current) {
    			 $$invalidate("history", history = getHistory(__current));
    		}

    		if (changed.__current) {
    			 $$invalidate("result", result = getResult(__current));
    		}

    		if (changed.game || changed.__current) {
    			 $$invalidate("turn", turn = game.getTurn(__current));
    		}
    	};

    	 $$invalidate("isCheck", isCheck = getCheck());
    	 $$invalidate("isCheckMate", isCheckMate = getCheckMate());
    	 $$invalidate("now", now = (() => Date.now())());

    	return {
    		utils,
    		initialFen,
    		game,
    		autoPromotion,
    		dispatch,
    		__isPromoting,
    		states,
    		initialStatus,
    		__status,
    		getStatus,
    		setStatus,
    		setup,
    		config,
    		analyze,
    		view,
    		play,
    		humanSide,
    		__human,
    		getHuman,
    		setHuman,
    		getCurrentRows,
    		__flipped,
    		getFlipped,
    		flip,
    		__current,
    		getCurrent,
    		goto,
    		version,
    		getPosition,
    		figureSets,
    		__set,
    		getFigureSet,
    		setFigureSet,
    		backgrounds,
    		initialLightBg,
    		initialDarkBg,
    		__lightBg,
    		__darkBg,
    		getBackgrounds,
    		setBackgrounds,
    		castling,
    		boardElement,
    		historyElement,
    		panelElement,
    		promotePawn,
    		refresh,
    		remote_move,
    		isCheck,
    		isCheckMate,
    		getCheck,
    		getCheckMate,
    		try_move,
    		undo,
    		reset,
    		now,
    		getHistory,
    		getResult,
    		turn,
    		canMoveFrom,
    		__imgSrc,
    		__figureFrom,
    		__figureTo,
    		__sqFrom,
    		__sqTo,
    		__promotion,
    		setupImgs,
    		handleDragStart,
    		handleInput,
    		load_pgn,
    		contextMenu,
    		getCastlingIndex,
    		fenCopy,
    		setTurn,
    		setCastling,
    		white,
    		black,
    		currentRows,
    		position,
    		promotionSet,
    		history,
    		result,
    		dragover_handler,
    		dragover_handler_2,
    		dragover_handler_3,
    		dragover_handler_1,
    		dragstart_handler,
    		click_handler,
    		drop_handler,
    		click_handler_1,
    		div0_binding,
    		div1_binding,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		div4_binding,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		drop_handler_1,
    		click_handler_9,
    		click_handler_10,
    		dragstart_handler_1,
    		click_handler_11,
    		dragstart_handler_2,
    		click_handler_12,
    		click_handler_13,
    		change_handler,
    		change_handler_1,
    		input_change_handler,
    		click_handler_14,
    		click_handler_15,
    		select2_change_handler,
    		drop_handler_2,
    		keypress_handler
    	};
    }

    class ChessBoard extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>::-webkit-scrollbar{width:7px}::-webkit-scrollbar-track{background:#f1f1f1}::-webkit-scrollbar-thumb{background:#bbb}::-webkit-scrollbar-thumb:hover{background:#888}.pad5{padding:5px}.board-frame{display:flex;flex-direction:column;width:320px;max-width:320px;min-width:320px;height:640px;max-height:640px;min-height:640px;-webkit-user-select:none;-webkit-touch-callout:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.board-child{width:100%;max-width:100%;min-width:100%;height:50%;max-height:50%;min-height:50%;margin-top:0;border:solid 1px black}.board{display:flex;flex-direction:column;background:steelblue;color:whitesmoke}.row{display:flex;flex-direction:row;height:12.5%;min-height:12.5%;max-height:12.5%;width:100%;max-width:100%;min-width:100%}.row:nth-child(even){background:whitesmoke}.row:nth-child(odd){background:cyan}.line{display:flex;width:95%;min-width:95%;max-width:95%;flex-direction:row;justify-content:space-between;align-items:center;padding:5px;margin-bottom:0;font-size:10pt}.square{display:flex;justify-content:center;align-items:center;height:100%;min-height:100%;max-height:100%;width:12.5%;max-width:12.5%;min-width:12.5%}.board-panel-child{display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-start;width:100%;max-width:100%;min-width:100%;height:100%;max-height:100%;min-height:100%}.headers{display:flex;flex-direction:column;justify-content:flex-start;align-content:space-around;align-items:center;padding:5px;width:100%;max-width:100%;min-width:100%;height:20%;max-height:30%;min-height:20%;border-bottom:solid 1px silver}.header-row{display:flex;width:90%;flex-direction:row;justify-content:space-between}.history{display:flex;flex-direction:row;flex-wrap:wrap;justify-content:flex-start;justify-items:flex-start;align-content:flex-start;width:95%;max-width:95%;min-width:95%;height:60%;max-height:60%;min-height:60%;overflow-y:auto;font-family:monospace;font-size:10pt;padding:5px}.san{cursor:pointer;padding:3px;padding-bottom:5px;height:0.75em;max-height:0.75em;min-height:0.75em;margin-right:0.35em;margin-bottom:8px}.san:hover{text-shadow:4px 4px 4px}.promotion-panel{position:absolute;flex-direction:row;z-index:1000;width:160px;min-width:160px;max-width:160px;height:40px;min-height:40px;max-height:40px;border:solid 1px black}.promotion-panel>div{width:25%;min-width:25%;max-width:25%;height:100%;min-height:100%;max-height:100%}@media only screen and (min-width: 640px){.board-frame{flex-direction:row;width:640px;max-width:640px;min-width:640px;height:320px;max-height:320px;min-height:320px;margin-top:20px;margin-left:20px}.board-child{width:50%;max-width:50%;min-width:50%;height:100%;max-height:100%;min-height:100%}}@media only screen and (min-width: 1280px){.board-frame{width:800px;max-width:800px;min-width:800px;height:400px;max-height:400px;min-height:400px}.promotion-panel{width:200px;min-width:200px;max-width:200px;height:50px;min-height:50px;max-height:50px}}@media only screen and (min-width: 1600px){.board-frame{width:960px;max-width:960px;min-width:960px;height:480px;max-height:480px;min-height:480px}.promotion-panel{width:240px;min-width:240px;max-width:240px;height:60px;min-height:60px;max-height:60px}}</style>`;

    		init(this, { target: this.shadowRoot }, instance, create_fragment, safe_not_equal, {
    			utils: 0,
    			initialFen: 0,
    			game: 0,
    			autoPromotion: 0,
    			states: 0,
    			initialStatus: 0,
    			__status: 0,
    			getStatus: 0,
    			setStatus: 0,
    			setup: 0,
    			config: 0,
    			analyze: 0,
    			view: 0,
    			play: 0,
    			humanSide: 0,
    			getHuman: 0,
    			setHuman: 0,
    			getCurrentRows: 0,
    			getFlipped: 0,
    			flip: 0,
    			__current: 0,
    			getCurrent: 0,
    			goto: 0,
    			version: 0,
    			getPosition: 0,
    			figureSets: 0,
    			getFigureSet: 0,
    			setFigureSet: 0,
    			backgrounds: 0,
    			initialLightBg: 0,
    			initialDarkBg: 0,
    			getBackgrounds: 0,
    			setBackgrounds: 0,
    			castling: 0,
    			boardElement: 0,
    			historyElement: 0,
    			panelElement: 0,
    			refresh: 0,
    			remote_move: 0,
    			isCheck: 0,
    			isCheckMate: 0,
    			getCheck: 0,
    			getCheckMate: 0,
    			try_move: 0,
    			undo: 0,
    			reset: 0,
    			now: 0,
    			getHistory: 0,
    			getResult: 0,
    			turn: 0,
    			canMoveFrom: 0,
    			__imgSrc: 0,
    			__figureFrom: 0,
    			__figureTo: 0,
    			__sqFrom: 0,
    			__sqTo: 0,
    			__promotion: 0,
    			load_pgn: 0,
    			getCastlingIndex: 0,
    			fenCopy: 0,
    			setTurn: 0,
    			setCastling: 0
    		});

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (ctx.initialLightBg === undefined && !("initialLightBg" in props)) {
    			console_1.warn("<chess-board> was created without expected prop 'initialLightBg'");
    		}

    		if (ctx.initialDarkBg === undefined && !("initialDarkBg" in props)) {
    			console_1.warn("<chess-board> was created without expected prop 'initialDarkBg'");
    		}

    		if (ctx.castling === undefined && !("castling" in props)) {
    			console_1.warn("<chess-board> was created without expected prop 'castling'");
    		}

    		if (ctx.boardElement === undefined && !("boardElement" in props)) {
    			console_1.warn("<chess-board> was created without expected prop 'boardElement'");
    		}

    		if (ctx.historyElement === undefined && !("historyElement" in props)) {
    			console_1.warn("<chess-board> was created without expected prop 'historyElement'");
    		}

    		if (ctx.panelElement === undefined && !("panelElement" in props)) {
    			console_1.warn("<chess-board> was created without expected prop 'panelElement'");
    		}

    		if (ctx.isCheck === undefined && !("isCheck" in props)) {
    			console_1.warn("<chess-board> was created without expected prop 'isCheck'");
    		}

    		if (ctx.isCheckMate === undefined && !("isCheckMate" in props)) {
    			console_1.warn("<chess-board> was created without expected prop 'isCheckMate'");
    		}

    		if (ctx.now === undefined && !("now" in props)) {
    			console_1.warn("<chess-board> was created without expected prop 'now'");
    		}

    		if (ctx.turn === undefined && !("turn" in props)) {
    			console_1.warn("<chess-board> was created without expected prop 'turn'");
    		}

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return [
    			"utils",
    			"initialFen",
    			"game",
    			"autoPromotion",
    			"states",
    			"initialStatus",
    			"__status",
    			"getStatus",
    			"setStatus",
    			"setup",
    			"config",
    			"analyze",
    			"view",
    			"play",
    			"humanSide",
    			"getHuman",
    			"setHuman",
    			"getCurrentRows",
    			"getFlipped",
    			"flip",
    			"__current",
    			"getCurrent",
    			"goto",
    			"version",
    			"getPosition",
    			"figureSets",
    			"getFigureSet",
    			"setFigureSet",
    			"backgrounds",
    			"initialLightBg",
    			"initialDarkBg",
    			"getBackgrounds",
    			"setBackgrounds",
    			"castling",
    			"boardElement",
    			"historyElement",
    			"panelElement",
    			"refresh",
    			"remote_move",
    			"isCheck",
    			"isCheckMate",
    			"getCheck",
    			"getCheckMate",
    			"try_move",
    			"undo",
    			"reset",
    			"now",
    			"getHistory",
    			"getResult",
    			"turn",
    			"canMoveFrom",
    			"__imgSrc",
    			"__figureFrom",
    			"__figureTo",
    			"__sqFrom",
    			"__sqTo",
    			"__promotion",
    			"load_pgn",
    			"getCastlingIndex",
    			"fenCopy",
    			"setTurn",
    			"setCastling"
    		];
    	}

    	get utils() {
    		return this.$$.ctx.utils;
    	}

    	set utils(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'utils'");
    	}

    	get initialFen() {
    		return this.$$.ctx.initialFen;
    	}

    	set initialFen(initialFen) {
    		this.$set({ initialFen });
    		flush();
    	}

    	get game() {
    		return this.$$.ctx.game;
    	}

    	set game(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'game'");
    	}

    	get autoPromotion() {
    		return this.$$.ctx.autoPromotion;
    	}

    	set autoPromotion(autoPromotion) {
    		this.$set({ autoPromotion });
    		flush();
    	}

    	get states() {
    		return this.$$.ctx.states;
    	}

    	set states(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'states'");
    	}

    	get initialStatus() {
    		return this.$$.ctx.initialStatus;
    	}

    	set initialStatus(initialStatus) {
    		this.$set({ initialStatus });
    		flush();
    	}

    	get __status() {
    		return this.$$.ctx.__status;
    	}

    	set __status(__status) {
    		this.$set({ __status });
    		flush();
    	}

    	get getStatus() {
    		return this.$$.ctx.getStatus;
    	}

    	set getStatus(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getStatus'");
    	}

    	get setStatus() {
    		return this.$$.ctx.setStatus;
    	}

    	set setStatus(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'setStatus'");
    	}

    	get setup() {
    		return this.$$.ctx.setup;
    	}

    	set setup(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'setup'");
    	}

    	get config() {
    		return this.$$.ctx.config;
    	}

    	set config(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'config'");
    	}

    	get analyze() {
    		return this.$$.ctx.analyze;
    	}

    	set analyze(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'analyze'");
    	}

    	get view() {
    		return this.$$.ctx.view;
    	}

    	set view(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'view'");
    	}

    	get play() {
    		return this.$$.ctx.play;
    	}

    	set play(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'play'");
    	}

    	get humanSide() {
    		return this.$$.ctx.humanSide;
    	}

    	set humanSide(humanSide) {
    		this.$set({ humanSide });
    		flush();
    	}

    	get getHuman() {
    		return this.$$.ctx.getHuman;
    	}

    	set getHuman(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getHuman'");
    	}

    	get setHuman() {
    		return this.$$.ctx.setHuman;
    	}

    	set setHuman(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'setHuman'");
    	}

    	get getCurrentRows() {
    		return this.$$.ctx.getCurrentRows;
    	}

    	set getCurrentRows(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getCurrentRows'");
    	}

    	get getFlipped() {
    		return this.$$.ctx.getFlipped;
    	}

    	set getFlipped(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getFlipped'");
    	}

    	get flip() {
    		return this.$$.ctx.flip;
    	}

    	set flip(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'flip'");
    	}

    	get __current() {
    		return this.$$.ctx.__current;
    	}

    	set __current(__current) {
    		this.$set({ __current });
    		flush();
    	}

    	get getCurrent() {
    		return this.$$.ctx.getCurrent;
    	}

    	set getCurrent(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getCurrent'");
    	}

    	get goto() {
    		return this.$$.ctx.goto;
    	}

    	set goto(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'goto'");
    	}

    	get version() {
    		return this.$$.ctx.version;
    	}

    	set version(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'version'");
    	}

    	get getPosition() {
    		return this.$$.ctx.getPosition;
    	}

    	set getPosition(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getPosition'");
    	}

    	get figureSets() {
    		return this.$$.ctx.figureSets;
    	}

    	set figureSets(figureSets) {
    		this.$set({ figureSets });
    		flush();
    	}

    	get getFigureSet() {
    		return this.$$.ctx.getFigureSet;
    	}

    	set getFigureSet(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getFigureSet'");
    	}

    	get setFigureSet() {
    		return this.$$.ctx.setFigureSet;
    	}

    	set setFigureSet(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'setFigureSet'");
    	}

    	get backgrounds() {
    		return this.$$.ctx.backgrounds;
    	}

    	set backgrounds(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'backgrounds'");
    	}

    	get initialLightBg() {
    		return this.$$.ctx.initialLightBg;
    	}

    	set initialLightBg(initialLightBg) {
    		this.$set({ initialLightBg });
    		flush();
    	}

    	get initialDarkBg() {
    		return this.$$.ctx.initialDarkBg;
    	}

    	set initialDarkBg(initialDarkBg) {
    		this.$set({ initialDarkBg });
    		flush();
    	}

    	get getBackgrounds() {
    		return this.$$.ctx.getBackgrounds;
    	}

    	set getBackgrounds(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getBackgrounds'");
    	}

    	get setBackgrounds() {
    		return this.$$.ctx.setBackgrounds;
    	}

    	set setBackgrounds(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'setBackgrounds'");
    	}

    	get castling() {
    		return this.$$.ctx.castling;
    	}

    	set castling(castling) {
    		this.$set({ castling });
    		flush();
    	}

    	get boardElement() {
    		return this.$$.ctx.boardElement;
    	}

    	set boardElement(boardElement) {
    		this.$set({ boardElement });
    		flush();
    	}

    	get historyElement() {
    		return this.$$.ctx.historyElement;
    	}

    	set historyElement(historyElement) {
    		this.$set({ historyElement });
    		flush();
    	}

    	get panelElement() {
    		return this.$$.ctx.panelElement;
    	}

    	set panelElement(panelElement) {
    		this.$set({ panelElement });
    		flush();
    	}

    	get refresh() {
    		return this.$$.ctx.refresh;
    	}

    	set refresh(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'refresh'");
    	}

    	get remote_move() {
    		return this.$$.ctx.remote_move;
    	}

    	set remote_move(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'remote_move'");
    	}

    	get isCheck() {
    		return this.$$.ctx.isCheck;
    	}

    	set isCheck(isCheck) {
    		this.$set({ isCheck });
    		flush();
    	}

    	get isCheckMate() {
    		return this.$$.ctx.isCheckMate;
    	}

    	set isCheckMate(isCheckMate) {
    		this.$set({ isCheckMate });
    		flush();
    	}

    	get getCheck() {
    		return this.$$.ctx.getCheck;
    	}

    	set getCheck(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getCheck'");
    	}

    	get getCheckMate() {
    		return this.$$.ctx.getCheckMate;
    	}

    	set getCheckMate(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getCheckMate'");
    	}

    	get try_move() {
    		return this.$$.ctx.try_move;
    	}

    	set try_move(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'try_move'");
    	}

    	get undo() {
    		return this.$$.ctx.undo;
    	}

    	set undo(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'undo'");
    	}

    	get reset() {
    		return this.$$.ctx.reset;
    	}

    	set reset(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'reset'");
    	}

    	get now() {
    		return this.$$.ctx.now;
    	}

    	set now(now) {
    		this.$set({ now });
    		flush();
    	}

    	get getHistory() {
    		return this.$$.ctx.getHistory;
    	}

    	set getHistory(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getHistory'");
    	}

    	get getResult() {
    		return this.$$.ctx.getResult;
    	}

    	set getResult(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getResult'");
    	}

    	get turn() {
    		return this.$$.ctx.turn;
    	}

    	set turn(turn) {
    		this.$set({ turn });
    		flush();
    	}

    	get canMoveFrom() {
    		return this.$$.ctx.canMoveFrom;
    	}

    	set canMoveFrom(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'canMoveFrom'");
    	}

    	get __imgSrc() {
    		return this.$$.ctx.__imgSrc;
    	}

    	set __imgSrc(__imgSrc) {
    		this.$set({ __imgSrc });
    		flush();
    	}

    	get __figureFrom() {
    		return this.$$.ctx.__figureFrom;
    	}

    	set __figureFrom(__figureFrom) {
    		this.$set({ __figureFrom });
    		flush();
    	}

    	get __figureTo() {
    		return this.$$.ctx.__figureTo;
    	}

    	set __figureTo(__figureTo) {
    		this.$set({ __figureTo });
    		flush();
    	}

    	get __sqFrom() {
    		return this.$$.ctx.__sqFrom;
    	}

    	set __sqFrom(__sqFrom) {
    		this.$set({ __sqFrom });
    		flush();
    	}

    	get __sqTo() {
    		return this.$$.ctx.__sqTo;
    	}

    	set __sqTo(__sqTo) {
    		this.$set({ __sqTo });
    		flush();
    	}

    	get __promotion() {
    		return this.$$.ctx.__promotion;
    	}

    	set __promotion(__promotion) {
    		this.$set({ __promotion });
    		flush();
    	}

    	get load_pgn() {
    		return this.$$.ctx.load_pgn;
    	}

    	set load_pgn(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'load_pgn'");
    	}

    	get getCastlingIndex() {
    		return this.$$.ctx.getCastlingIndex;
    	}

    	set getCastlingIndex(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'getCastlingIndex'");
    	}

    	get fenCopy() {
    		return this.$$.ctx.fenCopy;
    	}

    	set fenCopy(fenCopy) {
    		this.$set({ fenCopy });
    		flush();
    	}

    	get setTurn() {
    		return this.$$.ctx.setTurn;
    	}

    	set setTurn(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'setTurn'");
    	}

    	get setCastling() {
    		return this.$$.ctx.setCastling;
    	}

    	set setCastling(value) {
    		throw new Error("<chess-board>: Cannot set read-only property 'setCastling'");
    	}
    }

    customElements.define("chess-board", ChessBoard);

    return ChessBoard;

}(Chess));
//# sourceMappingURL=chess-board.js.map
