#!/usr/bin/env node

// Simple CLI JSON utility script
//
// Usage: json-util.js MYFILE.json set KEY VALUE
//		--type boolean  (Custom type)
// 		--indent "\t"   (Custom indent chars)
//		--compact       (Compress output onto one line)
//		--atomic        (Write file atomically)
//		--quiet         (Don't print anything to STDOUT)
//		--dryrun        (Print JSON to STDOUT, instead of file)
//
// Copyright (c) 2018 - 2022 Joseph Huckaby and PixlCore.com, MIT License

var fs = require('fs');
var cli = require('pixl-cli');
var args = cli.args;
cli.global();

var Tools = cli.Tools;

if (args.help) {
	print( fs.readFileSync( __dirname + '/README.md', 'utf8' ) );
	process.exit(0);
}

var usage = "Usage: ./json-util.js MYFILE.json set KEY VALUE\n";
var other = args.other;
if (!other) die(usage);

var file = other.shift();
if (!file) die(usage);

var cmd = other.shift() || 'echo';
if (!cmd || !cmd.match(/^(set|add|replace|delete|get|validate|echo|pretty)$/)) die(usage);

var content = fs.readFileSync( file, 'utf8' );

// use parser wrapper for improved error messages
var json = null;
try {
	json = Tools.parseJSON( content );
}
catch (err) {
	die("ERROR: Failed to parse JSON file: " + file + ": " + (err.message || err) + "\n");
}

var compact = args.compact || false;
var indent = args.indent || "\t";
var atomic = args.atomic || false;

if (cmd == 'validate') {
	print("File is valid JSON: " + file + "\n");
	process.exit(0);
}
else if (cmd == 'echo') {
	var payload = (compact ? JSON.stringify(json) : JSON.stringify( json, null, indent )) + "\n";
	print(payload); 
	process.exit(0);
}
else if (cmd == 'pretty') {
	var payload = (compact ? JSON.stringify(json) : JSON.stringify( json, null, indent )) + "\n";
	if (args.dryrun || args.debug) { print(payload); process.exit(0); }
	fs.writeFileSync( file, payload );
	print("File saved: " + file + "\n");
	process.exit(0);
}

var path = other.shift();
if (!path) die(usage);

// split path into parts (slash or dot separators)
// preserve dots and slashes if escaped
var parts = path.replace(/\\\./g, '__PXDOT__').replace(/\\\//g, '__PXSLASH__').split(/[\.\/]/).map( function(elem) {
	return elem.replace(/__PXDOT__/g, '.').replace(/__PXSLASH__/g, '/');
} );

// pop final key off end
var key = parts.pop();
if (!key) die(usage);

if (cmd.match(/^(set|add|replace)$/) && !other.length) die(usage);
var value = other.pop(); // only for set / add / replace

var target = json;

// traverse path
while (parts.length) {
	var part = parts.shift();
	if (part) {
		if (!(part in target)) {
			if (cmd.match(/^(set|add)$/)) target[part] = {};
			else die("Error: Path not found: " + path + " (" + part + ")\n");
		}
		if (typeof(target[part]) != 'object') {
			die("Error: Path runs into non-object: " + path + " (" + part + ")\n");
		}
		target = target[part];
	}
}

// determine target type
var type = typeof(target[key]);
if (type == 'undefined') {
	if (cmd.match(/^(set|add)$/)) {
		// guess type based on input
		type = typeof(value);
	}
	else die("Error: Key not found: " + path + " (" + key + ")\n");
}
else {
	if (cmd == 'add') {
		die("Error: Key already exists: " + path + " (" + key + ")\n");
	}
}

// allow custom type on CLI
if (args.type) type = args.type;

if (cmd == 'get') {
	// print value and exit
	print( (compact ? JSON.stringify(target[key]) : JSON.stringify( target[key], null, indent )) + "\n" );
	process.exit(0);
}

if (cmd == 'delete') {
	// delete key
	delete target[key];
	print("Key deleted: " + path + " (" + key + ")\n");
}
else {
	// set, add or replace
	switch (type) {
		case 'string': value = value.toString(); break;
		case 'number': value = parseFloat(value); break;
		case 'boolean': value = value.toString().match(/^(false|0)$/i) ? false : true; break;
		case 'object': value = JSON.parse(value); break;
		case 'null': value = null; break;
		default: die("Error: Unsupported data type: " + type + "\n"); break;
	}
	
	// apply change
	target[key] = value;
	
	var action = '';
	switch (cmd) {
		case 'set': action = 'Value set'; break;
		case 'add': action = 'Key added'; break;
		case 'replace': action = 'Value replaced'; break;
	}
	
	print(action + ": " + path + ": " + JSON.stringify(value) + "\n");
}

// compose final new JSON
var payload = (compact ? JSON.stringify(json) : JSON.stringify( json, null, indent )) + "\n";
if (args.dryrun || args.debug) { print(payload); process.exit(0); }

// save file
if (atomic) {
	var temp_file = file + '.' + process.pid + '.tmp';
	fs.writeFileSync( temp_file, payload );
	fs.renameSync( temp_file, file );
}
else {
	fs.writeFileSync( file, payload );
}
print("File saved: " + file + "\n");

// and we're done
process.exit(0);
