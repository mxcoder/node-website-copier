/*
 * node-website-copier
 * https://github.com/mxcoder/node-website-copier
 *
 * Copyright (c) 2014 Ricardo Vega
 * Licensed under the MIT license.
 */

'use strict';

function isFile(fn) {
    try {
        var ss = fs.statSync(fn);
        return ss ? ss.isFile() : false;
    } catch (e) {
        return false;
    }
}

function download(url, verbose) {
    var parseUrl = require('parse-url'),
        parsedUrl, folder, domain, wgetCmd, childproc, indexFile, indexFileOld;

    // Parses url to detect hostname, for folder name
    parsedUrl = parseUrl(url);
    if (!parsedUrl) program.help();
    domain = parsedUrl.baseUrl.replace('www.','');
    folder = domain.replace(/\W/g,'_');

    // TODO - Replace wget with node request on workers
    wgetCmd = [
        'wget', // common
        //'--random-wait','--wait=2','--timeout=2', // connection
        // request
        //'--header="accept-encoding: gzip,deflate"',
        '--execute="robots=off"','--user-agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.19 (KHTML, like Gecko) Ubuntu/12.04 Chromium/18.0.1025.168 Chrome/18.0.1025.168 Safari/535.19"',
        '--no-parent','--reject=js,*ord=*,*php*','--ignore-case', '--span-hosts', // spider
        '--page-requisites','--adjust-extension','--convert-links', // parser
        '--no-directories','--content-disposition','--directory-prefix='+(folder), // saving
        url
    ].join(' ');
    if (verbose) {
        console.log("WGET command: "+wgetCmd);
    }
    childproc = exec(wgetCmd, {maxBuffer:1024*500}, function(error, stdout, stderr){
        if (verbose) {
            console.log(stderr);
            console.log(stdout);
        }
        if (error === null) {
            // gzip -d gzipped files && removes pixel files
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
        } else {
            throw new Error('Wget Error:' + error);
        }
    });
}


function beautify(filename) {
    if (!isFile(htmlFile)) {
        throw new Error('Cannot read the file' + filename)
    }
    fs.readFile(filename, "utf8", function(err, contents){
        if (err !== null) {
            throw err;
        }
        var htmlParser = require("html-parser"),
            sanitized = htmlParser.sanitize(contents, {
                elements: ['script','iframe','noscript'],
                attributes: function(name, value){
                    switch(true) {
                        case /prefix/.test(name):
                        case /xmlns/.test(name):
                        case /data-/.test(name):
                        case /item/.test(name):
                        case /on[click|mouse]/.test(name):
                            return true;
                    }
                },
                comments: true
            });
        writeHTML(indexFile, sanitized);
    });
}

function writeFile(filename, content) {
    if (!isFile(filename)) {
        throw new Error('Cannot write the file: ' + filename);
    }
    // Write to file
    fs.writeFile(filename, require("html/lib/html").prettyPrint(content, {indent_size: 4, max_char: 1000, brace_style: 'collapse'}), function(err){
        if (err) throw err;
    });
}

exports.wwwcopier = function() {
    return {
        download: download
    }
};