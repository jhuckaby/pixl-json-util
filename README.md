<details><summary>Table of Contents</summary>

<!-- toc -->
- [Overview](#overview)
- [Usage](#usage)
	* [Commands](#commands)
		+ [set](#set)
		+ [add](#add)
		+ [replace](#replace)
		+ [delete](#delete)
		+ [get](#get)
		+ [validate](#validate)
		+ [echo](#echo)
	* [Arguments](#arguments)
		+ [--type](#--type)
		+ [--indent](#--indent)
		+ [--compact](#--compact)
		+ [--atomic](#--atomic)
		+ [--quiet](#--quiet)
		+ [--dryrun](#--dryrun)
		+ [--help](#--help)
	* [Adding Complex JSON](#adding-complex-json)
	* [Traversing Arrays](#traversing-arrays)
- [License](#license)

</details>

# Overview

**pixl-json-util** is a simple command-line utility for manipulating JSON files.  It allows you to get, add, replace or delete any value anywhere in the JSON file, and save it back to disk.  You can traverse nested objects and arrays with dot or slash notation, to target a specific property deep in the tree.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```sh
sudo npm install -g pixl-json-util
```

This should add a `jsu` command to your PATH, which you can use thusly:

```sh
jsu FILE COMMAND [PATH] [VALUE] [--ARGS]
```

`FILE` is the JSON file to load/save, `COMMAND` is the command to run (see below), `PATH` is the key name or path (dot notation or slash notation), and `VALUE` is the new value, if you are adding or replacing.  `--ARGS` are optional, and described below.  Example:

```sh
jsu package.json set dependencies/async "2.6.0"
```

This would write an `async` key into the `dependencies` object, and set the value to `2.6.0` as a string:

```js
"dependencies": {
	"async": "2.6.0"
},
```

You can also use [dot notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors) for accessing nested keys, like this:

```sh
jsu package.json set dependencies.async "2.6.0"
```

The data type of the value is inferred by the previous value, or if adding a new key it is guessed from the format of the new value.  You can, however, force the new type using the `--type` argument (see [Arguments](#arguments) below).

If one of your keys actually contains a dot or a slash, you need to escape it by preceding it with a backslash (`\`).  Beware of shell escaping rules here -- if you quote your value, you only need a single backslash, but if your value is not quoted, you will need a double-backslash to properly escape.

## Commands

Here are the available commands, and how to use them:

### set

The `set` command will add or replace a key, and doesn't care if it exists or not.  It will also automatically create any parent objects if necessary.  Example:

```sh
jsu package.json set dependencies/async "2.6.0"
```

### add

The `add` command will add a new key, and will fail if the key already exists.  It will also automatically create any parent objects if necessary.  Example:

```sh
jsu package.json add scripts/test "mocha test.js"
```

The data type of the new value is guessed by the format.  Meaning, if it appears to be a number, it will be written as such (without quotes), or else it will be written as a string.  To customize this, and to support adding booleans, see the `--type` argument below.

### replace

The `replace` command will replace an existing key with a new value, and fail if the key or any parent objects don't exist.  Example:

```sh
jsu package.json replace repository/type "git"
```

### delete

The `delete` command will delete an existing key, and fail if the key or any parent objects don't exist.  Example:

```sh
jsu package.json delete bugs/url
```

### get

The `get` command simply fetches an existing value, and outputs it to the console.  It does not save over the file.  Example:

```sh
jsu package.json get version
```

If you target an object instead of a plain value, the object and all its contents are pretty-printed and outputted:

```sh
jsu package.json get repository
```

Example output:

```js
{
	"type": "git",
	"url": "https://github.com/jhuckaby/pixl-json-util"
}
```

### validate

The `validate` command simply validates the syntax of the JSON file, and exits without saving.  The exit code will be `0` upon success (valid), or non-zero if an error occurred parsing the file.  Details will be available in the STDERR output.  Example:

```sh
jsu package.json validate
```

### echo

The `echo` command simply echoes the entire file to the console, without saving any changes.  This command is also the default action if no command is specified.  This can be used to quickly pretty-print a compact JSON file.  Example:

```sh
jsu some_compact_file.json
```

### pretty

The `pretty` command will pretty-print the file, and save it back to disk, replacing the original file.  Example:

```sh
jsu some_compact_file.json pretty
```

## Arguments

Here are the optional arguments you can specify.  Each argument name should be preceded with a double-dash (`--`).

### --type

The `--type` argument allows you to specify the exact data format of the new value.  By default this is inferred by the existing property value, or by examining the syntax of the new value on the CLI.  Accepted types are:

| Type | Description |
|------|-------------|
| `string` | Wrapped in quotes, e.g. `"MIT"`. |
| `number` | Integer or float, written without quotes, e.g. `45.0`. |
| `boolean` | Written as `true` or `false` without quotes, can also specify as `1` or `0` on the CLI. |
| `object` | Used for adding complex JSON fragments.  See [Adding Complex JSON](#adding-complex-json) below. |
| `null` | Writes out a literal `null` as the value. |

Example use:

```sh
jsu user.json add status/enabled false --type boolean
```

This would add a new property in the `status` object called `enabled`, set to boolean `false`:

```js
"status": {
	"enabled": false
}
```

Note that specifying the data type should only be required in special situations, like when you are forcefully changing the type of an existing property, or adding a new one and a guess of the syntax would be incorrect.  The syntax of new property values is guessed to be a `number` or a `string`, but never a `boolean`, `object` or `null`.

### --indent

By default all JSON files are saved back out to disk using pretty-printing, and a single tab (`\t`) character as the indent.  To change this, you can add a `--indent` argument, followed by any number of spaces or tabs you want.  Example (2 spaces):

```sh
jsu package.json set version "2.0.0" --indent "  "
```

### --compact

If you would prefer your JSON file be compacted and printed onto one line, add the `--compact` argument.  Example:

```sh
jsu package.json set license "MIT" --compact
```

### --atomic

The `--atomic` argument causes the file save operation to be "atomic".  Meaning, the JSON is first written to a temporary file in the same directory, then renamed over the original file.  The temporary file is named by appending the current PID, followed by a `.tmp` file extension.  Example:

```sh
jsu package.json set name "pixl-json-util" --atomic
```

### --quiet

The `--quiet` argument silences all output from the script, unless an error occurs.  Example:

```sh
jsu package.json add devDependencies/mocha "5.2.0" --quiet
```

### --dryrun

The `--dryrun` argument doesn't actually save any changes to disk, and instead simply outputs the final JSON file to the console.  This is great for examining a change before you make it on the real file.  Example:

```sh
jsu package.json delete devDependencies --dryrun
```

### --help

The `--help` argument prints out this README to the console and exits, without taking any other action.  Example:

```sh
jsu --help
```

## Adding Complex JSON

You can actually add entire JSON fragments to your file.  Just make sure you are replacing an existing object, or you specify `--type object` so the engine knows to parse your value as JSON when applying to the document.  Example:

```sh
jsu package.json set dependencies "{\"pixl-cli\":\"^1.0.0\"}" --type object
```

Make sure you properly escape your quotes, when attempting this.

## Traversing Arrays

You can traverse arrays just like any other object, simply by specifying the array index as the key.  Example:

```sh
jsu package.json set keywords/1 "utility"
```

# License

**The MIT License (MIT)**

*Copyright (c) 2018 - 2024 Joseph Huckaby.*

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
