"use strict";

const
    fs = require('fs'),
    babel = require('babel-core'),
    babelify = require('babelify'),
    browserify = require('browserify'),
    dependencyShim = require('browserify-global-shim');

fs.existsSync("dist") || fs.mkdirSync("dist");

const babelConfig = {
    comments: false,
    plugins: [
        // TODO: after establishing broad-spectrum browser support, look into pruning this list
        require("babel-plugin-transform-es2015-template-literals"),
        require("babel-plugin-transform-es2015-literals"),
        require("babel-plugin-transform-es2015-function-name"),
        require("babel-plugin-transform-es2015-arrow-functions"),
        require("babel-plugin-transform-es2015-block-scoped-functions"),
        require("babel-plugin-transform-es2015-classes"),
        require("babel-plugin-transform-es2015-object-super"),
        require("babel-plugin-transform-es2015-shorthand-properties"),
        require("babel-plugin-transform-es2015-duplicate-keys"),
        require("babel-plugin-transform-es2015-computed-properties"),
        require("babel-plugin-transform-es2015-for-of"),
        require("babel-plugin-transform-es2015-sticky-regex"),
        require("babel-plugin-transform-es2015-unicode-regex"),
        require("babel-plugin-check-es2015-constants"),
        require("babel-plugin-transform-es2015-spread"),
        require("babel-plugin-transform-es2015-parameters"),
        require("babel-plugin-transform-es2015-destructuring"),
        require("babel-plugin-transform-es2015-block-scoping"),
        require("babel-plugin-transform-es2015-typeof-symbol"),
        //require("babel-plugin-transform-es2015-modules-commonjs"), // breaks exposure via global
        [require("babel-plugin-transform-regenerator"), { async: false, asyncGenerators: false }],
    ]
};

// Transform library to valid es5 for running in browser
// (Note: must be sync else cannot share babelConfig which browserify mutates)
fs.writeFile(
    'dist/primitive-enum.js',
    //fs.readFileSync('./index.js')
    babel.transformFileSync('./index.js', babelConfig).code
);

// Transform tests to valid es5 for running in browser
browserify()
    .transform(babelify, {
        comments: false,
        presets: ['es2015'],
    })
    .transform(dependencyShim.configure({
        'chai': 'chai',
        '../index': 'PrimitiveEnum',
    }))
    .require('./test/index.js', {entry: true})
    .bundle()
    .on("error", err => console.log("Error: " + err.message))
    .pipe(fs.createWriteStream('dist/test.js'));
