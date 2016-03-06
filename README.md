
# primitive-enum

[![Build Status](https://travis-ci.org/evan-king/node-primitive-enum.svg)](https://travis-ci.org/evan-king/node-primitive-enum)

Primitive-enum is a a lightweight enum generator that aims to optimize convenience
and utility without resorting to enumerated keys, values, or pairs wrapped in objects.
This enum facility may be the best fit if you need full control over how values are
generated for enumerated properties, want efficient lookup for both properties and
values, want to maximize interoperability by keeping values primitive (string, int,
float), or just want to reference enums via terse expressions.

## Basic Usage

Create a new enum.  Enjoy.

```javascript
const Enum = require('primitive-enum');

const myEnum = Enum({a: 'x', c: 'z', b: 'y'});

myEnum instanceof Enum; // => true
myEnum.name; // => 'PrimitiveEnum'
myEnum.keys; // => ['a', 'c', 'b'];
myEnum.values; // => ['x', 'z', 'y'];
myEnum.a; // => 'x'
myEnum.x; // => 'a'
myEnum['a']; // => 'x'
myEnum.count; // => 3

var keys = [];
for(var key in myEnum) {
    keys.push(key);
}
keys; // => ['a', 'c', 'b']
```

## API

### Construction

```javascript
const myEnum = Enum(mapping, transform);
```

* `mapping` is either an object defining key => value enum pairs, or an array listing only keys.
* `transform` is a function of the form `fn(value, key|idx) => enum-value` used to transform or generate the enum values to pair with keys.  Several built-in transform options are available, along with configurable default behavior.  See [Value Transforms](#value-transforms).

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
myEnum.a; // => x
myEnum.x; // => a
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

###### Enum('_propname_')

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

### Value Transforms

When constructing an enum from an array, the array values are treated as enum keys.
When constructing an enum from an object, the property names are treated as enum keys.
In either case, the object/array keys/indices and values are passed through a transform
function to determine the paired enum values.  Several standard options are made available
through the enum constructor, and as well as configuration properties to alter the
default choices.

* `Enum.defaultArrayTransform` Default transform to use on arrays.  Initially [Enum.sequence](#enumsequence)
* `Enum.defaultObjectTransform` Default transform to use on objects.  Initially unset (`Enum.defaultTransform` is used instead).
* `Enum.defaultTransform` Default transform to use for arrays or objects if no input-type-specific transform is provided.  Initially [Enum.identity](#enumidentity).  Changing is supported but not advised.

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

### Limitations

By design, primitive-enum does not allow the same value to be used as two different keys
nor as two different values.  Future support for explicit enum property aliases is plausible
but not planned.  Additionally, no same value may be used as both enum key and enum value,
except in the case of matching key-value pairs where key == value.  This is partly to enforce
good enum-defining conventions, and partly to minimize drawbacks of using the most convenient
means of performing enum lookups - which works with keys and values interchangeably.

Lastly, all enum keys and values are expected to be simple primitives, castable to strings.
Instead supplying custom objects which cast to (unique) strings should also work, but is not
explicitly supported at this time.
