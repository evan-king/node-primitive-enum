"use strict";

const
    expect = require('chai').expect,
    Enum = require('./index');

describe('PrimitiveEnumBuilder', function() {
    
    it('accepts flexible configuration', function(done) {
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
        
        done();
    });
    
    it('rejects duplicate keys or values', function(done) {
        expect(() => Enum(['a', 'a'])).throw;
        expect(() => Enum({a: 1, b: 1})).throw;
        done();
    });
    
    it('rejects maps with lookup conflict', function(done) {
        expect(Enum.bind(null, {a: 'x', b: 'x'})).throw;
        expect(Enum.bind(null, {a: 'b', b: 'c'})).throw;
        expect(Enum.bind(null, ['a', 'a', 'b'])).throw;
        done();
    });
    
    it('rejects enum values duplicating unrelated keys', function(done) {
        expect(() => Enum({a: 'b', b: 'c'})).throw;
        expect(() => Enum({a: 'a', b: 'b'})).not.throw;
        done();
    });
    
    it('works with built-in array transforms', function(done) {
        expect(Enum(['a', 'b', 'c', 'd', 'e', 'f'], Enum.bitwise).values)
            .eql([1, 2, 4, 8, 16, 32]);
        
        expect(Enum(['a', 'b', 'c', 'd', 'e', 'f'], Enum.sequential).values)
            .eql([1, 2, 3, 4, 5, 6]);
        
        done();
    });
    
    it('works with built-in object transforms', function(done) {
        expect(Enum(['FIRST_KEY', 'SECOND_KEY'], Enum.idString).values)
            .eql(['first-key', 'second-key']);
        
        done();
    });
    
    it('supports additional transforms', function(done) {
        const transEnum = Enum(['hello', 'world'], key => key.split('').reverse().join(''));
        expect(transEnum.values).eql(['olleh', 'dlrow']);
        
        const errEnum = Enum(['error', 'really error'], (key, idx) => 10000 + idx);
        expect(errEnum.values).eql([10000, 10001]);
        done();
    });
    
    it('configures default transforms', function(done) {
        Enum.defaultObjectTransform = (propvalue, propname) => propname.toUpperCase();
        expect(Enum({a: 1, b: 2}).map).eql({a: 'A', b: 'B'});
        
        Enum.defaultArrayTransform = (value, idx) => value.toUpperCase();
        expect(Enum(['a', 'b']).map).eql({a: 'A', b: 'B'});
        done();
    });
    
});

describe('PrimitiveEnum instances', function() {
    
    before(Enum.resetDefaultTransforms);
    
    const
        they = it,
        seqEnum = Enum(['a', 'b', 'c', 'd', 'e', 'f']),
        bitEnum = Enum(seqEnum.keys, Enum.bitwise),
        mapEnum = Enum({a: 'x', c: 'z', b: 'y'});
    
    they('are identifiable as enums', function(done) {
        expect(mapEnum.name).eql('PrimitiveEnum');
        expect(mapEnum instanceof Enum).true;
        done();
    });
    
    they('are immutable', function(done) {
        expect(() => mapEnum.c.d = 'q').throw;
        expect(() => mapEnum.key.c = 'q').throw;
        expect(() => mapEnum.value.c = 'q').throw;
        expect(() => mapEnum.defaultKey = 'q').throw;
        expect(() => mapEnum.defaultValue = 'q').throw;
        
        expect(() => mapEnum.c = 'q').throw;
        expect(() => mapEnum.map.c = 'q').throw;
        expect(() => mapEnum.keys.c = 'q').throw;
        expect(() => mapEnum.values.c = 'q').throw;
        expect(() => mapEnum.reverseMap.c = 'q').throw;
        
        expect(() => mapEnum.d = 'q').throw;
        expect(() => mapEnum.map.d = 'q').throw;
        expect(() => mapEnum.keys.d = 'q').throw;
        expect(() => mapEnum.values.d = 'q').throw;
        expect(() => mapEnum.reverseMap.d = 'q').throw;
        
        done();
    });
    
    they('are serializable', function(done) {
        const
            json = JSON.stringify(mapEnum),
            copy = Enum.fromJSON(json);
        
        expect(copy.map).eql(mapEnum.map);
        expect(copy.defaultValue).eql(mapEnum.defaultValue);
        done();
    });
    
    they('are string-comparable', function(done) {
        expect(''+mapEnum == Enum({a: 'x', c: 'z', b: 'y'})).true;
        expect(''+mapEnum == Enum({a: 'x', c: 'z', b: 'aa'})).false;
        expect(''+mapEnum == Enum({a: 'x', aa: 'z', b: 'y'})).false;
        expect(''+mapEnum == Enum({a: 'x', c: 'z', b: 'y'}, 'b')).false;
        expect(''+bitEnum == seqEnum).false;
        done();
    });
    
    they('enumerate and iterate over keys only', function(done) {
        expect(Object.keys(mapEnum)).eql(mapEnum.keys);
        const keys = [];
        for(var key in mapEnum) {
            keys.push(key);
        }
        expect(keys).eql(mapEnum.keys);
        expect(mapEnum.count).eql(keys.length);
        done();
    });
    
    they('provide keys and values, in original order', function(done) {
        expect(mapEnum.keys).eql(['a', 'c', 'b']);
        expect(mapEnum.values).eql(['x', 'z', 'y']);
        done();
    });
    
    they('perform lookups and reverse lookups', function(done) {
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
        done();
    });
    
    they('build from arrays using sequential or bitwise integer values', function(done) {
        expect(bitEnum.values).eql([1, 2, 4, 8, 16, 32]);
        expect(seqEnum.values).eql([1, 2, 3, 4, 5, 6]);
        done();
    });
    
    they('have default keys and values', function(done) {
        expect(mapEnum.defaultKey).eql(mapEnum.keys[0]);
        expect(mapEnum.defaultValue).eql(mapEnum.values[0]);
        
        const dmapEnum = Enum(mapEnum.map, mapEnum.keys[1]);
        expect(dmapEnum.defaultKey).eql(dmapEnum.keys[1]);
        expect(dmapEnum.defaultValue).eql(dmapEnum.values[1]);
        
        expect(Enum.bind(null, mapEnum.map, 'q')).throw;
        
        done();
    });
    
});
