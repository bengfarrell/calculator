var browserify = require('browserify');
var babelify = require('babelify');
var fs = require('fs');



// Bundle external libs in our build file
var libs = fs.createWriteStream('build.js');
fs.createReadStream('node_modules/big.js/big.js').pipe(libs);
fs.createReadStream('src/libs/custom-elements-es5-adapter.js').pipe(libs);
fs.createReadStream('node_modules/@webcomponents/custom-elements/custom-elements.min.js').pipe(libs);


// Concatenate browserified modules
var bundleFs = fs.createWriteStream('build.js', {'flags': 'a'});
var b = browserify({
    entries: './src/webcomponents/calcapp/calcapp.js',
    standalone: 'App',
    cache: {},
    packageCache: {},
    debug: true})
    .transform(babelify);

b.bundle().pipe(bundleFs);


// Concat CSS files
var css = fs.createWriteStream('build.css');
fs.createReadStream('node_modules/github-fork-ribbon-css/gh-fork-ribbon.css').pipe(css);
fs.createReadStream('src/index.css').pipe(css);
