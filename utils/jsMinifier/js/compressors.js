var srcRootPath = __dirname +  '/../../../src/';
var Kekule = require(srcRootPath + 'kekule.js').Kekule;
require('./kekule.dev.packageTools.js');

var fs = require('fs');
var path = require('path');
var minify = require('node-minify');
const minifierNoCompress = require('@node-minify/no-compress');

const defMinifierName = 'terser';
const defMinifierOptions = {
	'yui': {
		'charset': 'utf8',
		'type': 'js'
	},
	'gcc': {
		//compilationLevel: 'ADVANCED'
		//warningLevel: 'VERBOSE'
	},
	'uglifyES': {
		mangle: { reserved: ['$super', '$origin'] }
	},
	'terser': {
		mangle: { reserved: ['$super', '$origin'] }
	}
};

var Compressor = class {
	constructor (destPath, minifierName, minifierOptions)
	{
		this.destPath = destPath;
		this.minifierName = minifierName || defMinifierName;
		this.minifierOptions = minifierOptions || defMinifierOptions[this.minifierName];
	}

	_compress(targetModuleNames, destPath)
	{
		if (destPath)
		{
			var details = Kekule.Dev.PackageUtils.getCompressFileDetails(targetModuleNames, true);
			var minFiles = details.targetMinFileNames;
			var fileMap = details.compressFileMap;

			//console.log('fileMap', fileMap);
			var compressedMinFileNames = [];
			var minifierName = this.minifierName;

			var doMinify = function(minifierName, minifierOptions, srcFileNames, destPath, minFileName)
			{
				minify.minify({
					compressor: minifierName,
					input: srcFileNames,
					output: path.resolve(destPath, minFileName),
					sync: true,
					//options: minifierOptions || {},
					callback: function(err, min) {
						if (err)
							//console.error(err);
							console.log(err);
						else
						{
							compressedMinFileNames.push(path.resolve(destPath, minFileName));
							console.log('Min file ' + minFileName + ' created');
						}
					}
				});
			};

			//console.log('need to compress', minFiles.length);
			minFiles.forEach((minFileName) => {
				//console.log('now compress ' + minFileName, this.minifierName, this.minifierOptions);
				/*
				if (this.minifierName === 'yui' && minFileName === details.targetFileName)  // some times there may be problem in compress kekule.min.js in YUI
				{
					//console.log('another approach');
					// try another approach, combine the compressed module min files together
					if (compressedMinFileNames.length === minFiles.length - 1)  // only need to compress kekule.min.js now
					{
						doMinify('noCompress', null, compressedMinFileNames, destPath, details.targetFileName);
					}
					else
					{
						console.log(compressedMinFileNames.length, minFiles.length);
					}
					return;
				}
				*/
				var srcFileNames = fileMap[minFileName];
				for (var i = 0, l = srcFileNames.length; i < l; ++i)
				{
					srcFileNames[i] = path.resolve(srcRootPath, srcFileNames[i]);
				}
				try
				{
					var minifierOptions =  this.minifierOptions? JSON.parse(JSON.stringify(this.minifierOptions)) : {};  // some minifier seems to modify this object, so clone it first
					//doMinify(minifierName, minifierOptions, srcFileNames, destPath, minFileName);
					doMinify(minifierNoCompress, {}/*minifierOptions*/, srcFileNames, destPath, minFileName);
				}
				catch(e)
				{
					throw e;
					//console.error('Error in creating', minFileName);
				}
			});
		}
	}

	_copyAdditionalJsFiles(targetModuleNames, destPath)
	{
		// copy extra js files
		var extraJsFilePairs = Kekule.Dev.PackageUtils.getStandaloneJsFileDetails(targetModuleNames);
		//console.dir(extraJsFilePairs);

		extraJsFilePairs.forEach(function(pair){
			var destFileName = path.resolve(destPath, pair[1]);
			var destDir = path.dirname(destFileName);
			if (!fs.existsSync(destDir)){
				fs.mkdirSync(destDir);
			}
			fs.copyFile(srcRootPath + pair[0], destFileName, function(err){
				if (err)
					console.error(err);
				else
					console.log('Copy file ' + pair[1] + ' done');
			});
		});
	}

	execute(targetModuleNames, destPath)
	{
		if (!destPath)
			destPath = this.destPath;
		if (destPath)
		{
			if (!fs.existsSync(destPath)){
				fs.mkdirSync(destPath);
			}
			this._compress(targetModuleNames, destPath);
			this._copyAdditionalJsFiles(targetModuleNames, destPath);
		}
	}
};

exports.Compressor = Compressor;


