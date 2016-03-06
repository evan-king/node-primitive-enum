"use strict";

const
    expect = require('chai').expect,
    Enum = require('./index');

describe('Enums from primitive-enum', function() {

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
        expect(() => mapEnum.defaultKey.d = 'q').throw;
        expect(() => mapEnum.defaultValue.d = 'q').throw;
        
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
    
    they('reject duplicate keys or values', function(done) {
        expect(() => Enum(['a', 'a'])).throw;
        expect(() => Enum({a: 1, b: 1})).throw;
        done();
    });
    
    they('reject values used as unrelated enum keys and values', function(done) {
        expect(() => Enum({a: 'b', b: 'c'})).throw;
        expect(() => Enum({a: 'a', b: 'b'})).not.throw;
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
    
    they('reject maps with lookup conflict', function(done) {
        expect(Enum.bind(null, {a: 'x', b: 'x'})).throw;
        expect(Enum.bind(null, {a: 'b', b: 'c'})).throw;
        expect(Enum.bind(null, ['a', 'a', 'b'])).throw;
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
    
    they('use built-in array transforms', function(done) {
        const transEnum = Enum(['FIRST_KEY', 'SECOND_KEY'], Enum.idString);
        expect(transEnum.values).eql(['first-key', 'second-key']);
        done();
    });
    
    they('support additional transforms', function(done) {
        const transEnum = Enum(['hello', 'world'], key => key.split('').reverse().join(''));
        expect(transEnum.values).eql(['olleh', 'dlrow']);
        
        const errEnum = Enum(['error', 'really error'], (key, idx) => 10000 + idx);
        expect(errEnum.values).eql([10000, 10001]);
        done();
    });
    
    they('use default transforms', function(done) {
        Enum.defaultObjectTransform = (propvalue, propname) => propname.toUpperCase();
        expect(Enum({a: 1, b: 2}).map).eql({a: 'A', b: 'B'});
        
        Enum.defaultArrayTransform = (value, idx) => value.toUpperCase();
        expect(Enum(['a', 'b']).map).eql({a: 'A', b: 'B'});
        done();
    });
    
    they('maintain default keys and values', function(done) {
        expect(mapEnum.defaultKey).eql(mapEnum.keys[0]);
        expect(mapEnum.defaultValue).eql(mapEnum.values[0]);
        
        mapEnum.defaultValue = mapEnum.values[1];
        expect(mapEnum.defaultKey).eql(mapEnum.keys[1]);
        expect(mapEnum.defaultValue).eql(mapEnum.values[1]);
        
        mapEnum.defaultKey = mapEnum.keys[2];
        expect(mapEnum.defaultKey).eql(mapEnum.keys[2]);
        expect(mapEnum.defaultValue).eql(mapEnum.values[2]);
        
        expect(() => mapEnum.defaultKey = 'd').throw;
        
        done();
    });
    
});
