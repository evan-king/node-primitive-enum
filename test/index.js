"use strict";

const
    expect = require('chai').expect,
    Enum = require('../index');

describe('PrimitiveEnumBuilder', function() {
    
    it('accepts flexible configuration', function() {
        const
            e1 = Enum(['a', 'c', 'b'], {transform: Enum.bitwise, defaultKey: 'b'}),
            e2 = Enum(['a', 'c', 'b'], {transform: Enum.bitwise}),
            e3 = Enum(['a', 'c', 'b'], Enum.bitwise),
            e4 = Enum(['a', 'c', 'b'], {defaultKey: 'b'}),
            e5 = Enum({a: 1, c: 2, b: 4}, 'b');
        
        expect(e1.map).eql(e2.map);
        expect(e2.map).eql(e3.map);
        expect(e3.map).eql(e5.map);
        expect(e1.map).not.eql(e4.map);
        
        expect(e1.defaultKey).eql(e4.defaultKey);
        expect(e1.defaultKey).eql(e5.defaultKey);
        expect(e2.defaultKey).eql(e3.defaultKey);
        expect(e1.defaultKey).not.eql(e2.defaultKey);
    });
    
    it('rejects invalid configuration', function() {
        const
            eArr = ['a', 'b'],
            eObj = {a: 1, b: 2},
            invalidTransform = {transform: 'blah'};
        
        expect(Enum.bind(null, eArr, true)).throw();
        expect(Enum.bind(null, eArr, false)).throw();
        expect(Enum.bind(null, eArr, null)).throw();
        expect(Enum.bind(null, eArr, invalidTransform)).throw();
        expect(Enum.bind(null, eObj, invalidTransform)).throw();
        
        expect(Enum.bind(null, eObj, 'c')).throw();
        expect(Enum.bind(null, eObj, {defaultKey: 'c'})).throw();
    });
    
    it('rejects duplicate keys or values', function() {
        expect(() => Enum(['a', 'a'])).throw();
        expect(() => Enum({a: 1, b: 1})).throw();
    });
    
    it('rejects maps with lookup conflict', function() {
        expect(Enum.bind(null, {a: 'x', b: 'x'})).throw();
        expect(Enum.bind(null, {a: 'b', b: 'c'})).throw();
        expect(Enum.bind(null, ['a', 'a', 'b'])).throw();
    });
    
    it('rejects enum values duplicating unrelated keys', function() {
        expect(() => Enum({a: 'b', b: 'c'})).throw();
        expect(() => Enum({a: 'a', b: 'b'})).not.throw();
    });
    
    it('works with built-in array transforms', function() {
        expect(Enum(['a', 'b', 'c', 'd', 'e', 'f'], Enum.bitwise).values)
            .eql([1, 2, 4, 8, 16, 32]);
        
        expect(Enum(['a', 'b', 'c', 'd', 'e', 'f'], Enum.sequential).values)
            .eql([1, 2, 3, 4, 5, 6]);
    });
    
    it('works with built-in object transforms', function() {
        expect(Enum(['FIRST_KEY', 'SECOND_KEY'], Enum.idString).values)
            .eql(['first-key', 'second-key']);
    });
    
    it('supports additional transforms', function() {
        const transEnum = Enum(['hello', 'world'], key => key.split('').reverse().join(''));
        expect(transEnum.values).eql(['olleh', 'dlrow']);
        
        const errEnum = Enum(['error', 'really error'], (key, idx) => 10000 + idx);
        expect(errEnum.values).eql([10000, 10001]);
    });
    
    it('configures default transforms', function() {
        Enum.defaultObjectTransform = (propvalue, propname) => propname.toUpperCase();
        expect(Enum({a: 1, b: 2}).map).eql({a: 'A', b: 'B'});
        
        Enum.defaultArrayTransform = (value, idx) => value.toUpperCase();
        expect(Enum(['a', 'b']).map).eql({a: 'A', b: 'B'});
    });
    
});

describe('PrimitiveEnum instances', function() {
    
    before(Enum.resetDefaultTransforms);
    
    const
        they = it,
        seqEnum = Enum(['a', 'b', 'c', 'd', 'e', 'f']),
        bitEnum = Enum(seqEnum.keys, Enum.bitwise),
        mapEnum = Enum({a: 'x', c: 'z', b: 'y'});
    
    they('are identifiable as enums', function() {
        expect(mapEnum.name).eql('PrimitiveEnum');
        expect(mapEnum instanceof Enum).true;
    });
    
    they('are immutable', function() {
        let throwCount = 0,
            expectCount = 0,
            mutEnum = Enum({a: 'x', c: 'z', b: 'y'});
        
        function tryModify(baseObj, prop) {
            let val = 'blah';
            try {
                expectCount++;
                baseObj[prop] = val;
            } catch(ex) {
                throwCount++;
                expect(ex instanceof TypeError).true;
            }
            expect(baseObj[prop]).not.eql(val);
        }
        
        tryModify(mutEnum, 'key');
        tryModify(mutEnum, 'value');
        tryModify(mutEnum, 'defaultKey');
        tryModify(mutEnum, 'defaultValue');
        
        tryModify(mutEnum, 'c');
        tryModify(mutEnum.map, 'c');
        tryModify(mutEnum.keys, 'c');
        tryModify(mutEnum.values, 'c');
        tryModify(mutEnum.reverseMap, 'c');
        
        tryModify(mutEnum, 'd');
        tryModify(mutEnum.map, 'd');
        tryModify(mutEnum.keys, 'd');
        tryModify(mutEnum.values, 'd');
        tryModify(mutEnum.reverseMap, 'd');
        
        expect(throwCount).eql(expectCount);
        
        // Browsers do not consistently throw an error for this case,
        // but aren't necessessarily accepting the assignment either.
        tryModify(mapEnum.c, 'd', 'q');
    });
    
    they('are serializable', function() {
        const
            json = JSON.stringify(mapEnum),
            copy = Enum.fromJSON(json);
        
        expect(copy.map).eql(mapEnum.map);
        expect(copy.defaultValue).eql(mapEnum.defaultValue);
        expect(Enum.fromJSON.bind(null, "{notAnEnum: true}")).throw();
        expect(Enum.fromJSON.bind(null, {notAnEnum: true})).throw();
        expect(Enum.fromJSON.bind(null, "not even json")).throw();
    });
    
    they('are string-comparable', function() {
        expect(''+mapEnum == Enum({a: 'x', c: 'z', b: 'y'})).true;
        expect(''+mapEnum == Enum({a: 'x', c: 'z', b: 'aa'})).false;
        expect(''+mapEnum == Enum({a: 'x', aa: 'z', b: 'y'})).false;
        expect(''+mapEnum == Enum({a: 'x', c: 'z', b: 'y'}, 'b')).false;
        expect(''+bitEnum == seqEnum).false;
    });
    
    they('enumerate and iterate over keys only', function() {
        expect(Object.keys(mapEnum)).eql(mapEnum.keys);
        const keys = [];
        for(var key in mapEnum) {
            keys.push(key);
        }
        expect(keys).eql(mapEnum.keys);
        expect(mapEnum.count).eql(keys.length);
    });
    
    they('provide keys and values, in original order', function() {
        expect(mapEnum.keys).eql(['a', 'c', 'b']);
        expect(mapEnum.values).eql(['x', 'z', 'y']);
    });
    
    they('perform lookups and reverse lookups', function() {
        expect(seqEnum(4)).eql('d');
        expect(seqEnum('e')).eql(5);
        expect(bitEnum(4)).eql('c');
        expect(bitEnum('e')).eql(16);
        expect(mapEnum('a')).eql('x');
        expect(mapEnum('z')).eql('c');
        expect(mapEnum.a).eql('x');
        expect(mapEnum.x).eql('a');
        expect(mapEnum.key('a')).eql(undefined);
        expect(mapEnum.key('x')).eql('a');
        expect(mapEnum.value('x')).eql(undefined);
        expect(mapEnum.value('a')).eql('x');
        expect(seqEnum['4']).eql('d');
        expect(seqEnum.d).eql(4);
    });
    
    they('build from arrays using sequential or bitwise integer values', function() {
        expect(bitEnum.values).eql([1, 2, 4, 8, 16, 32]);
        expect(seqEnum.values).eql([1, 2, 3, 4, 5, 6]);
    });
    
    they('have default keys and values', function() {
        expect(mapEnum.defaultKey).eql(mapEnum.keys[0]);
        expect(mapEnum.defaultValue).eql(mapEnum.values[0]);
        
        const dmapEnum = Enum(mapEnum.map, mapEnum.keys[1]);
        expect(dmapEnum.defaultKey).eql(dmapEnum.keys[1]);
        expect(dmapEnum.defaultValue).eql(dmapEnum.values[1]);
        
        expect(Enum.bind(null, mapEnum.map, 'q')).throw();
    });
    
});

if(typeof window === "object") {
    describe('PrimitiveEnum in the browser', function() {
        
        it('is available as an AMD module', function(done) {
            requirejs(['PrimitiveEnum'], function(internal) {
                const testEnum = internal(['a', 'b']);
                expect(testEnum.map).eql({a: 1, b: 2});
                done();
            });
        });
        
        it('is available as a global', function() {
            expect(window.PrimitiveEnum).eql(Enum);
        });
        
        it('supports isolation via noConflict', function() {
            const LocalEnum = window.PrimitiveEnum.noConflict();
            expect(LocalEnum).eql(Enum);
            expect(window.PrimitiveEnum).eql('original'); // preset in test.html
        });
        
    });
}
