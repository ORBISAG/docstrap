"use strict";
/**
 * @fileOverview Gruntfile tasks. These tasks are intended to help you when modifying the template. If you are
 * just using the template, don't sweat this stuff. To use these tasks, you must install grunt, if you haven't already,
 * and install the dependencies. All of this requires node.js, of course.
 *
 * Install grunt:
 *
 *      npm install -g grunt-cli
 *
 * Then in the directory where you found this file:
 *
 *      npm install
 *
 * And you are all set. See the individual tasks for details.
 *
 * @module Gruntfile
 * @requires path
 * @requires lodash
 * @requires http
 * @requires async
 * @requires fs
 */
var path = require( "path" );
var _ = require( "lodash" );
var request = require('request');
var async = require( "async" );
var fs = require( "fs" );

// this rather odd arrangement of composing tasks like this to make sure this works on both
// windows and linux correctly. We can't depend on Grunt or Node to normalize
// paths for us because we shell out to make this work. So we gather up
// our relative paths here, normalize them later and then pass them into
// the shell to be run by JSDoc3.

/**
 * The definition to run the development test files. This runs the files in `fixtures` with the
 * project's `conf.json` file.
 * @private
 */
var jsdocTestPages = {
	dest      : "./test",
	tutorials : "./assets/fixtures/tutorials",
	template  : "./template",
	config    : "./assets/fixtures/testdocs.conf.json",
	options   : " --lenient --verbose --recurse"
};
/**
 * The definition to run the sample files. This runs the files in `fixtures` with the
 * sample's `conf.json` file. No task directly exposes this configuration. The `fixtures` task
 * modifies this for each swatch it finds and then run the docs command against it.
 * @private
 */
var jsdocExamplePages = {
	src       : ["./assets/fixtures/", "./README.md"],
	dest      : "./themes",
	tutorials : "./assets/fixtures/tutorials",
	template  : "./template",
	config    : "./assets/fixtures/example.conf.json",
	options   : " --lenient --verbose --recurse"
};

/**
 * This definition provides the project's main, published documentation.
 *  @private
 */
var projectDocs = {
	src       : ["./Gruntfile.js", "./README.md", "./template/publish.js"],
	dest      : "./doc",
	tutorials : "",
	template  : "./template",
	config    : "./template/jsdoc.conf.json",
	options   : " --lenient --verbose --recurse --private"
};

/**
 * Normalizes all paths from a JSDoc task definition and and returns an executable string that can be passed to the shell.
 * @param {object} jsdoc A JSDoc definition
 * @returns {string}
 */
function jsdocCommand( jsdoc ) {
	var cmd = [];
	cmd.unshift( jsdoc.options );
	if ( jsdoc.tutorials.length > 0 ) {
		cmd.push( "-u " + path.resolve( jsdoc.tutorials ) );
	}
	cmd.push( "-d " + path.resolve( jsdoc.dest ) );
	cmd.push( "-t " + path.resolve( jsdoc.template ) );
	cmd.push( "-c " + path.resolve( jsdoc.config ) );
	_.each( jsdoc.src, function ( src ) {
		cmd.push( path.resolve( src ) );
	} );
	cmd.unshift( path.resolve( "./node_modules/jsdoc/jsdoc" ) );
	cmd.unshift( "node" );

	return cmd.join( " " );
}

var tasks = {
	shell  : {
		options  : {
			stdout : true,
			stderr : true
		},
		/**
		 * TASK: Create the a documentation set for testing changes to the template
		 * @name shell:testdocs
		 * @memberOf module:Gruntfile
		 */
		testdocs : {
			command : jsdocCommand( jsdocTestPages )
		},
		/**
		 * TASK: Create project documentation
		 * @name shell:dox
		 * @memberOf module:Gruntfile
		 */
		dox      : {
			command : jsdocCommand( projectDocs )
		},
		release1 : {
			command : [
				"touch Gruntfile.js",
				"git add .",
				'git commit -m "ready for release"',
			].join( ";" )

		},
		release2 : {
			command : ["npm version patch",
				"git push",
				"git push --tags",
				"npm publish"
			].join( "&&" )
		}
	},
	jsdoc  : {
		testdocs : {
			src     : ['assets/fixtures/**.js', "./README.md"],
			jsdoc   : "./node_modules/jsdoc/jsdoc.js",
			options : {
				destination : './testdocs',
				rescurse    : true,
				"private"   : true,
				"template"  : "./template",
				"configure" : "./template/jsdoc.conf.json"
			}
		}
	},
	/**
	 * TASK: The less task creates the themed css file from main.less. The file is written to the template styles
	 * directory as site.[name of theme].css. Later the .conf file will look for the theme to apply based
	 * on this naming convention.
	 * @name less
	 * @memberOf module:Gruntfile
	 */
	less   : {
		dev : {
			files : {
				"template/static/styles/site.<%= jsdocConf.templates.theme %>.css" : "styles/main.less"
			}
		}
	},
	copy   : {
		docs : {
			files : [
				{expand : true, cwd : "dox/", src : ['**'], dest : '../docstrap-dox/'},
				{expand : true, cwd : "themes/", src : ['**'], dest : '../docstrap-dox/themes'}
			]
		}
	},
	uglify : {
		template : {
			files : {
				'template/static/scripts/docstrap.lib.js' : [
					'bower_components/jquery/dist/jquery.min.js',
					'bower_components/prism/prism.js',
					'bower_components/prism/components/prism-batch.min.js',
					'bower_components/prism/components/prism-clike.min.js',
					'bower_components/prism/components/prism-csharp.min.js',
					'bower_components/prism/components/prism-javascript.min.js',
					'bower_components/prism/components/prism-json.min.js',
					'bower_components/prism/components/prism-powershell.min.js',
					'bower_components/prism/components/prism-typescript.min.js',
					'bower_components/prism/plugins/command-line/prism-command-line.min.js',
					'bower_components/prism/plugins/line-highlight/prism-line-highlight.min.js',
					'bower_components/prism/plugins/line-numbers/prism-line-numbers.min.js',
					'bower_components/prism/plugins/autolinker/prism-autolinker.min.js',
					'bower_components/prism/plugins/toolbar/prism-toolbar.min.js',
					'bower_components/prism/plugins/data-uri-highlight/prism-data-uri-highlight.min.js',
					'bower_components/prism/plugins/show-language/prism-show-language.min.js',
					'bower_components/jquery.scrollTo/jquery.scrollTo.min.js',
					'bower_components/jquery.localScroll/jquery.localScroll.min.js',
					'bower_components/bootstrap/dist/js/bootstrap.min.js'
				]
			}
		}
	}
};

module.exports = function ( grunt ) {
	tasks.jsdocConf = grunt.file.readJSON( 'template/jsdoc.conf.json' );

	grunt.initConfig( tasks );

	grunt.loadNpmTasks( 'grunt-contrib-less' );
	grunt.loadNpmTasks( 'grunt-shell' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );

	grunt.registerTask( "default", ["docs"] );

	/**
	 * Builds the project's documentation
	 * @name docs
	 * @memberof module:Gruntfile
	 */
	grunt.registerTask( "docs", "Create the project documentation", ["shell:dox"] );
	/**
	 * Compile the CSS and create the project documentation
	 * @name dev
	 * @memberof module:Gruntfile
	 */
	grunt.registerTask( "dev", "Compile the CSS and create the project documentation", ["less", "shell:dox"] );
	/**
	 * TASK: Builds the main less file and then generates the test documents
	 * @name testdocs
	 * @memberof module:Gruntfile
	 */
	grunt.registerTask( "testdocs", "Builds the main less file and then generates the test documents", ["less:dev", "shell:testdocs"] );
	/**
	 * TASK: Builds the whole shebang. Which means creating testdocs, the bootswatch fixtures and then resetting the
	 * styles directory.
	 * @name build
	 * @memberof module:Gruntfile
	 */
	grunt.registerTask( "build", "Builds the whole shebang. Which means creating testdocs, the bootswatch samples and then resetting the styles directory", ["uglify:template", "bootswatch", "apply", "copy"] );
	/**
	 * TASK: Applies the theme in the conf file and applies it to the styles directory.
	 * @name apply
	 * @memberof module:Gruntfile
	 */
	grunt.registerTask( "apply", "Applies the theme in the conf file and applies it to the styles directory", function () {
		var def = {
			less          : `https://raw.githubusercontent.com/thomaspark/bootswatch/v3/${tasks.jsdocConf.templates.theme}/bootswatch.less`,
			lessVariables : `https://raw.githubusercontent.com/thomaspark/bootswatch/v3/${tasks.jsdocConf.templates.theme}/variables.less`
			// less          : "http://bootswatch.com/" + tasks.jsdocConf.templates.theme + "/bootswatch.less",
			// lessVariables : "http://bootswatch.com/" + tasks.jsdocConf.templates.theme + "/variables.less"
		};
		grunt.registerTask( "swatch-apply", _.partial( applyTheme, grunt, def ) );
		grunt.task.run( ["swatch-apply"] );
	} );
	/**
	 * TASK: Grab all Bootswatch themes and create css from each one based on the main.less in the styles directory. NOTE that this will
	 * leave the last swatch downloaded in the styles directory, you will want to call "apply" afterwards
	 * @name bootswatch
	 * @memberof module:Gruntfile
	 */
	grunt.registerTask( "bootswatch", "Grab all Bootswatch themes and create css from each one based on the main.less in the styles directory", function () {
		var toRun = [];

		var done = this.async();
		getBootSwatchList( function ( err, list ) {
			if ( err ) {return done( err );}

			_.each( list.themes, function ( entry ) {

				toRun.push( "swatch" + entry.name );
				grunt.registerTask( "swatch" + entry.name, _.partial( applyTheme, grunt, entry ) );

				var key = "template/static/styles/site." + entry.name.toLowerCase() + ".css";
				var def = {};
				def[key] = "styles/main.less";
				tasks.less["swatch" + entry.name] = {
					files : def
				};
				toRun.push( "less:swatch" + entry.name );
			} );
			grunt.task.run( toRun );
			done();
		} );

	} );
	/**
	 * TASK:Create fixtures from the themes. The files must have been built first from the bootswatch task.
	 * @name examples
	 * @memberof module:Gruntfile
	 */
	grunt.registerTask( "examples", "Create samples from the themes", function () {
		var toRun = [];
		var done = this.async();
		getBootSwatchList( function ( err, list ) {
			if ( err ) {return done( err );}

			_.each( list.themes, function ( entry ) {
				var conf = grunt.file.readJSON( './assets/fixtures/example.conf.json' );
				conf.templates.theme = entry.name.toLowerCase();
				grunt.file.write( "tmp/example.conf." + conf.templates.theme + ".json", JSON.stringify( conf, null, 4 ) );

				var jsdenv = _.cloneDeep( jsdocExamplePages );
				jsdenv.config = "./tmp/example.conf." + conf.templates.theme + ".json";
				jsdenv.dest = "./themes/" + conf.templates.theme;
				tasks.shell["example" + conf.templates.theme] = {
					command : jsdocCommand( jsdenv )
				};
				toRun.push( "shell:example" + conf.templates.theme );
			} );

			grunt.registerTask( "cleanup", "", function () {
				grunt.file["delete"]( "tmp/" );
			} );
			toRun.push( "cleanup" );
			grunt.task.run( toRun );
			done();
		} );

	} );

	grunt.registerTask( "release", "Create the project documentation", ["shell:release1", "shell:release2"] );
};

/**
 * Applies one of the Bootswatch themes to the working `styles` directory. When you want to modify a particular theme, this where you
 * get the basis for it. The files are written to `./styles/variables.less` and `./styles/bootswatch.less`. The `./styles/main.less`
 * file includes them directly, so after you apply the theme, modify `main.less` to your heart's content and then run the `less` task
 * as in
 *
 *      grunt less
 *
 * @param {object} grunt The grunt object reference
 * @param {object} definition The swatch definition files
 * @param {string} definition.less The url to the `bootswatch.less` file
 * @param {string} definition.lessVariables The url to the `variables.less` file
 * @private
 */
function applyTheme( grunt, definition ) {
	//noinspection JSHint

	var webProtocol = tasks.jsdocConf.templates.protocol || "//";
	var done = this.async();
	async.waterfall( [
		function ( cb ) {
			getBootSwatchComponent( definition.less, function ( err, swatch ) {
				if ( err ) {return cb( err );}
				var fullPath = path.join( __dirname, "styles/bootswatch.less" );
				fs.writeFile( fullPath, swatch.replace( "http://", webProtocol ), cb );
			} );
		},
		function ( cb ) {
			getBootSwatchComponent( definition.lessVariables, function ( err, swatch ) {
				if ( err ) {return cb( err );}
				var fullPath = path.join( __dirname, "styles/variables.less" );
				fs.writeFile( fullPath, swatch.replace( "http://", webProtocol ), cb );
			} );
		}
	], done );
}

/**
 * Gets the list of available Bootswatches from, well, Bootswatch.
 *
 * @see http://news.bootswatch.com/post/22193315172/bootswatch-api
 * @param {function(err, responseBody)} done The callback when complete
 * @param {?object} done.err If an error occurred, you will find it here.
 * @param {object} done.responseBody This is a parsed edition of the bootswatch server's response. It's format it defined
 * by the return message from [here](http://api.bootswatch.com/)
 * @private
 */
function getBootSwatchList( done ) {
	request('https://bootswatch.com/api/3.json', function(error, response, body) {
		if (error) {
			return done(error);
		}
		done(null, JSON.parse(body));
	});
}

/**
 * This method will get one of the components from Bootswatch, which is generally a `less` file or a `lessVariables` file.
 *
 * @see http://news.bootswatch.com/post/22193315172/bootswatch-api
 * @param {string} url The url to retreive from
 * @param {function(err, responseText)} done The callback when complete
 * @param {?object} done.err If an error occurred, you will find it here.
 * @param {string} done.responseText The body of whatever was returned
 * @private
 */
function getBootSwatchComponent( url, done ) {
	var body = "";
	var req = request(url, function ( error, response, body ) {
		if (error) {
			return done(error);
		}
		done(null, body);
	});
}
