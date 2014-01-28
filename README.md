# node-website-copier [![Build Status](https://secure.travis-ci.org/mxcoder/node-website-copier.png?branch=master)](http://travis-ci.org/mxcoder/node-website-copier)

Thie package aims to be a replacement for "wget -p + beautifiers", when used on a URL a local copy of that site would be downloaded
with all its requisites, like CSS, images, background images, etc.
Optinally (because I find it useful) you will be able to cleanup the generated HTML.

## WIP
Right now this package is not in the npm registry yet, its too green.
You can clone this repo, and use [npm link](https://npmjs.org/doc/cli/npm-link.html) to try it out.

## Current features and limitations
- Depends on wget and bash scripting
- Download one-single page (no recursive)
- Per wget, download required assets (CSS, images) but if gzipped, styles are not parsed to retrieve images in them.

## TODO
- Remove wget and bash, use node to request and parse html and css.
- Add more options for sanitization

## Getting Started
Install the module with: `npm install node-website-copier`

```javascript
var node_website_copier = require('node-website-copier');
node_website_copier.download("URL", [(boolean) verbose]);
```

```cli
./node_modules/node-website-copier/bin/wwwcopy URL [--verbose]
```

Install the module with `npm install -g node-website-copier`

```cli
wwwcopy URL [--verbose]
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
0.1.0 - Prototype, depends on Bash and WGET

## License
Copyright (c) 2014 Ricardo Vega  
Licensed under the MIT license.
