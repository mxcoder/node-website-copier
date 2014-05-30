/*
 * node-website-copier
 * https://github.com/mxcoder/node-website-copier
 *
 * Copyright (c) 2014 Ricardo Vega
 * Licensed under the MIT license.
 */

'use strict';
module.exports = (function() {

    var fs = require('fs'),
        path = require('path');

    function isFile(fn) {
        try {
            var ss = fs.statSync(fn);
            return ss ? ss.isFile() : false;
        } catch (e) {
            return false;
        }
    }

    function download(url, options) {
        var parseUrl = require('parse-url'),
            spawn = require('child_process').spawn,
            exec = require('child_process').exec,
            verbose = options.verbose,
            mobile = options.mobile,
            ua, parsedUrl, folder, domain, indexFile, indexFileOld,
            wgetParams, wgetProc;

        // Parses url to detect hostname, for folder name
        parsedUrl = parseUrl(url);
        if (!parsedUrl) {
            throw new Error('Cannot understand the URL: ' + url);
        }
        domain = parsedUrl.baseUrl.replace('www.','');
        folder = domain.replace(/\W/g,'_');

        ua = mobile ? "Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3" : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.19 (KHTML, like Gecko) Ubuntu/12.04 Chromium/18.0.1025.168 Chrome/18.0.1025.168 Safari/535.19";
        // TODO - Replace wget with node request on workers
        wgetParams = [
            //'--random-wait','--wait=1','--timeout=2', // connection
            '--output-file=www-download-get.log','--debug',
            // request
            //'--header="accept-encoding: gzip,deflate"',
            //'--header="accept-encoding: deflate"',
            '--user-agent="'+ua+'"',
            '--no-parent','--reject=js,*ord=*,*php*','--ignore-case', '--span-hosts', // spider
            '--page-requisites','--adjust-extension','--convert-links', // parser
            '--no-directories','--content-disposition','--directory-prefix='+(folder), // saving
            url
        ];
        if (verbose) {
            console.log("WGET command: ", wgetParams.join(' '));
        }
        wgetProc = spawn("wget", wgetParams);

        if (verbose) {
            wgetProc.stdout.on('data', function(data){
                console.log('STDOUT:' + data);
            });
            wgetProc.stderr.on('data', function(data){
                console.log('STDERR:' + data);
            });
        }
        wgetProc.on('close', function(code){
            if (code !== 0) {
                console.log('WGET process exited with code ' + code);
            }
            exec([
                'cd '+(folder),
                'for f in *',
                    'do if [ "1" -eq `file $f | grep -c gzip` ]',
                        'then mv "$f" "$f.gz"',
                        'gzip -d "$f.gz"',
                    'fi',
                'done',
                'for f in *',
                    'do if [ "1" -eq `file $f | grep -c "1 x 1"` ]',
                        'then rm "$f"',
                    'fi',
                'done',
            ].join(';'));
            // beautifies index.html, if none, it creates it
            indexFile = path.join(folder,'index.html');
            indexFileOld = path.join(folder, parsedUrl.file);
            if (isFile(indexFileOld) && !isFile(indexFile)) {
                fs.renameSync(indexFileOld, indexFile);
            }
            beautify(indexFile);
        });
    }

    function beautify(filename, verbose) {
        if (!isFile(filename)) {
            throw new Error('Cannot read the file' + filename);
        }
        if (verbose) {
            console.log('Reading file: ' + filename);
        }
        fs.readFile(filename, "utf8", function(err, contents){
            if (err !== null) {
                if (verbose) {
                    console.log('Error while reading file: ' + err);
                }
                throw err;
            }
            var htmlParser = require("html-parser"),
                sanitized = htmlParser.sanitize(contents, {
                    elements: ['script','iframe','noscript'],
                    attributes: function(name, value){
                        switch(true) {
                            case (/href/.test(name) && !/css/.test(value)):
                            case /prefix/.test(name):
                            case /xmlns/.test(name):
                            case /data-/.test(name):
                            case /item/.test(name):
                            case /on[click|mouse]/.test(name):
                                return true;
                        }
                    },
                    comments: false
                });
            if (verbose) {
                console.log('Writing file: ' + filename);
            }
            writeFile(filename, sanitized);
        });
    }

    function writeFile(filename, content) {
        if (!isFile(filename)) {
            throw new Error('Cannot write the file: ' + filename);
        }
        // Write to file
        fs.writeFile(filename, require("html/lib/html").prettyPrint(content, {indent_size: 4, max_char: 3000, brace_style: 'collapse', unformatted:[]}), function(err){
            if (err) {
                throw err;
            }
        });
    }

    return {
        download: download,
        beautify: beautify
    };
})();
