"use strict";

(function(root) {


/**
 * Enum builder - wraps arrays and maps in a function that
 * supplies (precomputed) key and value lists, maps, and
 * reverse maps.  Supplies multiple means of lookup and
 * reference, and offers full control over how enum values
 * are generated.
 * 
 * @author Evan King
 * @see https://github.com/evan-king/node-primitive-enum
 * 
 * Usage:
 *     const myEnum = Enum({a: 'x', b: 'y'});
 *     myEnum.keys; // ['a', 'b']
 *     myEnum.values; // ['x', 'y']
 *     myEnum.map; // {a: 'x', b: 'y'}
 *     myEnum.reverseMap; // {x: 'a', y: 'b'}
 *     myEnum('a'); // 'x'
 *     myEnum('x'): // 'a'
 *     myEnum.a; // 'x'
 *     myEnum.x; // 'a'
 *     myEnum.count: // 2
 * 
 * @param mixed inputMap Array of keys or Object mapping keys to values
 * @param mixed options Configuration object supporting these options:
 *      - transform: Function describing how to generate enum values from inputMap
 *      - defaultKey: String specifying which key/value are considered the default option
 *     Alternatively, options can be either one of those directly.
 */
const Enum = function PrimitiveEnumBuilder(inputMap, options) {
    
    const
        opts = buildOptions(options),
        keys = [],
        values = [],
        map = {},
        reverseMap = {},
        API = function PrimitiveEnum(lookup) { return API[''+lookup]; } ;
    
    function buildOptions(options) {
        switch(typeof options) {
            case 'string': return {defaultKey: options};
            case 'function': return {transform: options};
            case 'object': return options;
            case 'undefined': return {};
            default: throw new TypeError('Invalid argument:' + typeof options);
        }
    }
    
    // Note: We don't want a value appearing twice on one side or
    //       appearing on both sides unless as part of the same mapping.
    //       We could handle them safely with slightly reduced functionality,
    //       but that's a bad enum anyway.
    function checkAvailable() {
        const args = Array.prototype.slice.call(arguments);
        args.forEach(function(lookup) {
            if(API[''+lookup] === undefined) return;
            throw new Error('Enum must be bijective with keys distinctive from values');
        });
    }
    
    function prop(name, value, enumer) {
        Object.defineProperty(API, name, {
            enumerable: enumer || false,
            writable: false,
            configurable: false,
            value: value,
        });
    }
    
    function addMapping(key, val) {
        key.__proto__ = API;
        val.__proto__ = API;
        checkAvailable(key, val);
        keys.push(key);
        values.push(val);
        map[''+key] = val;
        reverseMap[''+val] = key;
        prop(key, val, true);
        if(''+key !== ''+val) prop(val, key);
    }
    
    let transform = opts.transform;
    if(Array.isArray(inputMap)) {
        if(transform === undefined) transform = Enum.defaultArrayTransform || Enum.identity;
        if(typeof transform !== 'function') throw new Error('Invalid transform');
        inputMap.forEach((key, idx) => addMapping(key, transform(key, idx)));
    } else {
        if(transform === undefined) transform = Enum.defaultObjectTransform || Enum.identity;
        if(typeof transform !== 'function') throw new Error('Invalid transform');
        Object.keys(inputMap).forEach(key => addMapping(key, transform(inputMap[key], key)));
    }
    
    const defIdx = (opts.defaultKey === undefined) ? 0 : keys.indexOf(opts.defaultKey);
    if(defIdx < 0) throw new Error('Invalid default key');
    
    function toJSON() {
        return { type: 'PrimitiveEnum', map: map, defaultKey: keys[defIdx] };
    }
    
    // Provide a string representation for comparability
    const asString = '[Function: PrimitiveEnum] '+keys.join(',')+'|'+values.join(',')+'|'+defIdx;
    
    API.__proto__ = Enum.prototype;
    prop('map', Object.freeze(map));
    prop('reverseMap', Object.freeze(reverseMap));
    prop('keys', Object.freeze(keys));
    prop('values', Object.freeze(values));
    prop('count', keys.length);
    prop('key', val => reverseMap[''+val]);
    prop('value', key => map[''+key]);
    prop('defaultKey', keys[defIdx]);
    prop('defaultValue', values[defIdx]);
    prop('toJSON', toJSON);
    prop('toString', () => asString);
    
    return Object.freeze(API);
}

function eprop(name, value, write) {
    Object.defineProperty(Enum, name, {
        enumerable: false,
        writable: write,
        configurable: false,
        value: value,
    });
}

eprop('fromJSON', function(obj) {
    if(typeof obj === "string") obj = JSON.parse(obj);
    if(obj.type != 'PrimitiveEnum') {
        throw new TypeError('Input is not a serialized PrimitiveEnum');
    }
    return Enum(obj.map, obj.defaultKey);
});

// Pre-built mapping transforms

// key == value
eprop('identity', key => key);

// Note: never use 0 as an enum value (because it is falsey)
eprop('sequence', (key, idx) => idx + 1);

// For arrays, create values that can be combined as bitwise flags
eprop('bitwise', (key, idx) => Math.pow(2, idx));

// CONSTANT_KEY => constant-value
eprop('idString', key => key.toLowerCase().replace(/( |_)+/g, '-'));


// Configurable defaults
eprop('defaultArrayTransform', Enum.sequence, true);
eprop('defaultObjectTransform', undefined, true);

// Fallback default transform for arrays and objects.  Changing not recommended - may be hard-coded before 1.0.0
eprop('defaultTransform', Enum.identity, true);

// Undocumented method for unit-testing convenience
eprop('resetDefaultTransforms', function() {
    Enum.defaultArrayTransform = Enum.sequence;
    Enum.defaultObjectTransform = undefined;
    Enum.defaultTransform = Enum.identity;
});

// Determine how to publish the library
if(typeof module === 'object' && typeof module.exports === 'object') {
    // Publish CommonJS module
    module.exports = Enum;
} else {
    // Globally expose PrimitiveEnum, allowing rollback via PrimtiveEnum.noConflict()
    var origModule = root.PrimitiveEnum;
    root.PrimitiveEnum = Enum;
    eprop('noConflict', function() {
        root.PrimitiveEnum = origModule;
        return Enum;
    });
    
    if(typeof define === 'function' && define.amd) {
        // Also expose as AMD
        define('PrimitiveEnum', [], () => Enum);
    }
}


})(this);
