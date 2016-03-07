
# primitive-enum

[![version][version-img]][version-url]
[![npm][npmjs-img]][npmjs-url]
[![build status][travis-img]][travis-url]
[![deps status][daviddm-img]][daviddm-url]
[![mit license][license-img]][license-url]

Primitive-enum is a a lightweight generator of immutable enums that aims to optimize
convenience and utility without resorting to enumerated keys, values, or pairs wrapped
in objects.  This enum facility may be the best fit if you:

- want convenient lookup for both properties and values
- need full control over how values are generated for enumerated properties
- want to maximize interoperability by keeping values primitive (string, int, float)
- want the reliability of immutable enums
- or just want to keep enum usage terse

## Basic Usage

Create a new enum.  Enjoy.

```javascript
const Enum = require('primitive-enum');

const myEnum = Enum({a: 'x', c: 'z', b: 'y'});

// myEnum is identifiable
myEnum instanceof Enum; // => true
myEnum.name; // => 'PrimitiveEnum'

// myEnum provides immutable metadata
myEnum.keys; // => ['a', 'c', 'b'];
myEnum.values; // => ['x', 'z', 'y'];
myEnum.map; // => {a: 'x', c: 'z', b: 'y'}
myEnum.reverseMap; // => {x: 'a', z: 'c', y: 'b'}
myEnum.defaultKey; // => 'a'
myEnum.defaultValue; // => 'x'
myEnum.count; // => 3

// myEnum supports multiple forms of expression and lookup
myEnum.a; // => 'x'
myEnum['a']; // => 'x'
myEnum('a'); // => 'x'
myEnum.value('a') // => 'x'
myEnum.value('x') // => undefined

myEnum.x; // => 'a'
myEnum['x']; // => 'a'
myEnum('x'); // => 'a'
myEnum.key('x') // => 'a'
myEnum.key('a') // => undefined

// myEnum is iterable
var keys = [];
for(var key in myEnum) {
    keys.push(key);
}
keys; // => ['a', 'c', 'b']
```

## API

### Construction

```javascript
const myEnum = Enum(mapping, options);
```

- `mapping` is either an object defining key => value enum pairs, or an array listing only keys.
- `options` is either a configuration object or one of the properties accepted in one:
  - `options.defaultKey` is a string identifying the default key (and by extension default value).  If unspecified, it will be the first key defined.
  - `options.transform` is a function of the form `fn(value, key|idx) => enum-value` used to transform or generate the enum values to pair with keys.  Several built-in transform options are available, along with configurable default behavior.  See [Value Transforms](#value-transforms).

### Retrieval

Access enum keys and values, in original order.

###### Enum.keys

```javascript
myEnum.keys; // => ['a', 'c', 'b']
```

###### Enum.values

```javascript
myEnum.values; // => ['x', 'z', 'y']
```

Access forward and reverse mappings as immutable objects.

###### Enum.map

```javascript
myEnum.map; // => {a: 'x', c: 'z', b: 'y'}
```

###### Enum.reverseMap

```javascript
myEnum.reverseMap; // => {x: 'a', z: 'c', y: 'b'}
```

### Lookup

Find any value or key by its corresponding property-like pair.

###### Enum._propname_

```javascript
myEnum.a; // => 'x'
myEnum.x; // => 'a'
```

For non-strings and strings that cannot be used as property names, use array or function access.

###### Enum['_propname_']

```javascript
const uglyEnum = {'string with spaces': 12}

uglyEnum['string with spaces']; // => 12
uglyEnum[''+12]; // => 'string with spaces'
```

Note that array lookup must be by string keys or values cast to strings.
The returned value for any key will however be in its original primitive
form.  Lookups by non-string primitive types can be performed using the
following function-based lookup options.

Primitive-enum is not intended to support non-primitive keys or values.

###### Enum(prop)

```javascript
uglyEnum('string with spaces'); // => 12
uglyEnum(12); // => 'string with spaces'
```

For explicit lookup among only keys or values, use one-way lookup methods.

###### Enum.key(value)

```javascript
myEnum.key('x'); // => 'a'
myEnum.key('a'); // => undefined
```

###### Enum.value(key)

```javascript
myEnum.value('a'); // => 'x'
myEnum.value('x'); // => undefined
```

### Extras

PrimitiveEnums also specify a default key/value, which is initially the first pair defined.

###### Enum.defaultKey

```javascript
myEnum.defaultKey; // => 'a'
myEnum.defaultKey = 'b'; // throws Error
```

###### Enum.defaultValue

```javascript
myEnum.defaultValue; // => 'x'
myEnum.defaultValue = 'y'; // throws Error
```

PrimitiveEnum instances are string-comparable - so long as their enumerated values are
comparable primitives - and serializable.  The constructed results are preserved, but
details of construction are discarded.

###### Enum.toString()

```javascript
const
    enum1 = Enum(['a', 'b', 'c'], Enum.bitwise),
    enum2 = Enum({a: 1, b: 2, c: 4});

enum1.toString(); // => '[Function: PrimitiveEnum] a,b,c|1,2,4|0
''+enum1 == enum2; // => true
```

###### Enum.fromJSON(str|obj)

```javascript
const jsonStr = JSON.stringify(myEnum);
const copiedEnum = Enum.fromJSON(jsonStr);
''+copiedEnum == myEnum; // => true
```


### Value Transforms

When constructing an enum from an array, the array values are treated as enum keys.
When constructing an enum from an object, the property names are treated as enum keys.
In either case, the object/array keys/indices and values are passed through a transform
function to determine the paired enum values.  Several standard options are made available
through the enum constructor, and as well as configuration properties to alter the
default choices.

- `Enum.defaultArrayTransform` Default transform to use on arrays.  Initially [Enum.sequence](#enumsequence)
- `Enum.defaultObjectTransform` Default transform to use on objects.  Initially unset (`Enum.defaultTransform` is used instead).
- `Enum.defaultTransform` Default transform to use for arrays or objects if no input-type-specific transform is provided.  Initially [Enum.identity](#enumidentity).  Changing is supported but not advised.

###### Enum.identity

```javascript
const identEnum = Enum(['a', 'b', 'c'], Enum.identity);
identEnum.map; // => {'a': 'a', 'b': 'b', 'c': 'c'}

const normalEnum = Enum({a: 'x', b: 'y', c: 'z'}, Enum.identity);
normalEnum.map; // => {a: 'x', b: 'y', c: 'z'}
```
Straightforward identity mapping: key === value.
Final default option, supports objects and arrays.

###### Enum.sequence

```javascript
const seqEnum = Enum(['a', 'b', 'c'], Enum.sequence);
seqEnum.map; // => {'a': 1, 'b': 2, 'c': 3};
```
Basic incrementing integer values for array inputs.  Starts at 1 so that
the enumeration contains no falsey values.  For arrays only.  Default
option for arrays.

###### Enum.bitwise

```javascript
const bitEnum = Enum(['a', 'b', 'c'], Enum.bitwise);
bitEnum.map; // => {'a': 1, 'b': 2, 'c': 4}
```
Sequence of incrementing powers of 2.  While primitive-enum provides
no support for bitwise comparisons or combinations (yet), this will
play nicely with other tools that do.  For arrays only.

###### Enum.idString

```javascript
const colorEnum = Enum(['RED', 'BLUE', 'COUNTRY_ROSE'], Enum.idString);
colorEnum.map; // => {RED: 'red', BLUE: 'blue', COUNTRY_ROSE: 'country-rose'}
```
Provides conversion from `SCREAMING_SNAKE_CASE` to `winding-river-format`, as
an option for working with classic c-style constant naming conventions, where
string values are also needed.  For objects only.

#### Example custom transforms

Arrays send `value`, `idx` as arguments.
Objects send `propvalue`, `propname` as arguments.

```javascript
// Generate values based on enum keys (from array or object)
const ucKeys = (propvalue, propname) => propname.toUpperCase();
const ucKeysEnum = Enum({a: 1, b: 2}, ucKeys);
ucKeysEnum.map; // => {a: 'A', b: 'B'}

const ucArr = (value, idx) => value.toUpperCase();
const ucArrEnum = Enum(['a', 'b'], ucArr);
ucArrEnum.map; // => {a: 'A', b: 'B'}

// Generate values based on array indices
const even = (value, idx) => (idx+1) * 2;
const evenEnum = Enum(['a', 'b'], even);
evenEnum.map; // => {a: 2, b: 4}
```

## Limitations

By design, primitive-enum does not allow the same value to be used as two different keys
nor as two different values.  Additionally, no same value may be used as both enum key
and enum value, except in the case of matching key-value pairs where key == value.  This
is partly to enforce good enum-defining conventions, and partly to minimize limitations
of using the most convenient means of performing enum lookups - which works with keys and
values interchangeably.

Lastly, all enum keys and values are expected to be simple primitives, castable to strings.
Instead supplying custom objects which cast to (unique) strings may also work, but is not
explicitly supported.

## Roadmap

The following features are planned for the 1.0 release:

- Package for client-side use (with browser testing and elimination of es6 dependencies).
- Add support for aliases (`options.aliases` probably as map of key => [alternate keys]).

The following feature is being (weakly) considered:

- Throw errors where possible when referencing an invalid enum key or value.

[version-url]: https://github.com/evan-king/node-primitive-enum/releases
[version-img]: https://img.shields.io/github/release/evan-king/node-primitive-enum.svg?style=flat

[npmjs-url]: https://www.npmjs.com/package/primitive-enum
[npmjs-img]: https://img.shields.io/npm/v/primitive-enum.svg?style=flat

[coveralls-url]: https://coveralls.io/r/evan-king/node-primitive-enum?branch=master
[coveralls-img]: https://img.shields.io/coveralls/evan-king/node-primitive-enum.svg?style=flat

[license-url]: https://github.com/evan-king/node-primitive-enum/blob/master/LICENSE
[license-img]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat

[travis-url]: https://travis-ci.org/evan-king/node-primitive-enum
[travis-img]: https://img.shields.io/travis/evan-king/node-primitive-enum.svg?style=flat

[daviddm-url]: https://david-dm.org/evan-king/node-primitive-enum
[daviddm-img]: https://img.shields.io/david/evan-king/node-primitive-enum.svg?style=flat
