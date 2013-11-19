#!/usr/bin/node

require("./linvoapp-constants.js");

var fs = require("fs"),
	child = require("child_process"),
	path = require("path"),
	mounts = require("./list-mounts.js"),
	Combo = require("./Combo.js"),
	statfsSync = require("./node-statfs").statfsSync;

var progressPollInterval = 450;
	
/* TODO: calculate the weight of all modules (size of directories when mounted) + size of apps directory (just with the .lzm modules as it is, without mounting it) */

function prepareSystemModules(callback)
{
	var modulesWeight = 0, modules = [];	
	var finishedWeigh = function()
	{
		console.log("Finished weighing modules: "+modulesWeight);
		callback({"modulesWeight": modulesWeight, modules: modules})
	};
	
	var baseDir = dataDir+"/linvo/base";

	fs.readdirSync(baseDir)
	.filter(function(a) { return a.match(linvoappExt+"$") })
	.sort() /* By default, an alphabetical sort */
	.forEach(function(moduleBasename)
	{
		var modulePath = path.join(baseDir, moduleBasename),
			mountPath = path.join(imagesDir, moduleBasename);
		
		modules.push({basename: moduleBasename, path: modulePath, mountPath: mountPath});
					
		if (! path.existsSync(mountPath))
			fs.mkdirSync(mountPath);
			
		/*
		 * This would be started when the module is mounted & ready (check below)
		 */
		var i = modules.length;
		
		var	startWeigh = function()
		{
			console.log(moduleBasename+": ready, weighing started");
			
			var weighProcess = child.spawn(weighUtility, [mountPath]);
			weighProcess.stdout.on("data", function(weight)
			{ 
				if (! isNaN(weight))
					modulesWeight += parseInt(weight);

				if ((--i) == 0)
					finishedWeigh();					
			});
			weighProcess.stderr.on("data", function(err) { console.log(err) });
		};
		
		/*
		 *  Mount the module if not mounted 
		 * */
		if (! mounts.byMountpoint[mountPath])
		{
			var l = nextLoop();
			child.exec("mknod /dev/loop"+l+" b 7 "+l+"; losetup /dev/loop"+l+" '"+modulePath+"'; mount /dev/loop"+l+" '"+mountPath+"'", function(err)
			{
				if (err)
				{
					--i;
					return console.error("failure in weighing module "+moduleBasename+": "+err);
				}
				console.log("base module "+moduleBasename+" now mounted");
				startWeigh();
			});
		}
		else
			startWeigh();
	})
}

function startInst(opts, modulesData)
{
	if (! path.existsSync(opts.path))
		fs.mkdirSync(opts.path);
		
	var instReady = new Combo(function()
	{
		/* TODO: maybe do config here ? */
		isReady = true;
		if (typeof(opts.ready) == "function")
			opts.ready();
	}),
		systemReady = instReady.add(),
		extraReady = instReady.add(),
		isReady = false;
		
	/* 
	 * Start watching progress
	 */
	function kscale(b, bs) { return (b*bs + 1024/2) / 1024 };
	function pollProgress()
	{		
		if (isReady)
			return;
			
		var s = statfsSync(opts.path),
			progress = Math.min(100, kscale(s.f_blocks - s.f_bfree, s.f_bsize)*100/modulesData.modulesWeight);

		if (typeof(opts.progress) == "function")
			opts.progress(Math.round(progress*100)/100); /* Round to two decimal points */
				
		if (progress < 100)
			setTimeout(pollProgress, progressPollInterval)
	};
	pollProgress();
	
	/* 
	 * Start copying installation modules
	 */
	var modulesQueue = [].concat(modulesData.modules); /* Copy the modules array */
	function nextModule()
	{
		var module;
		if (! (module = modulesQueue.shift()))
			return systemReady();
		
		child.exec("cp -R \""+module.mountPath+"\"/* \""+opts.path+"\"", function(err)
		{
			if (err)
				console.error(err);
				
			nextModule();
		});
	};
	nextModule();
	
	/* 
	 * Start copying additional files
	 * 
	 * WARNING: POTENTIAL BUG: that would bump up the progress (usually) because the files would increase the used space
	 * on the partition, while they would not be considered as a part of the system's weight
	 * 
	 * However, this would usually be used on Linvo Applications, which are installed in /home, which would be mounted
	 * as a separate partition, which means it would not play with the progress (statfs is used, the system root FS would be the only factor)
	 * 
	 */
	if (opts.extraFiles && opts.extraFiles.length)
	{
		var filesQueue = [].concat(opts.extraFiles); /* Copy the files array */

		function nextFile()
		{
			var file;
			if (! (file = filesQueue.shift()))
				return extraReady();
			
			var to = path.join(opts.path, file.to);
			child.exec("mkdir -p \""+to+"\" ; cp \""+file.from+"\" \""+to+"\"", nextFile);
		}
		
		nextFile();
	}
	else 
		extraReady();
}

/*
 * modulesData is the pre-collected data about the .lzm/lxm modules
 * which compose the system; 
 * for now, modulesData contains only the size of the modules when uncompressed: the purpose of this is 
 * to be able to calculate the progress properly
 */
var modulesData, onReadyQueue = [];
prepareSystemModules(function(response)
{ 
	modulesData = response;
	var cb;
	while (cb = onReadyQueue.pop()) cb();
});

module.exports = {
	startInstallation: function(opts)
	{
		if (! (opts && opts.path))
			return console.error("Must supply 'path' argument to the startInstallation function"); 
		
		if (! modulesData)
			onReadyQueue.push(function() { startInst(opts, modulesData) });
		else 
			startInst(opts, modulesData);
	},
	dataDir: dataDir
};

/* DEBUG */
/*
if (! module.parent)
{
	onReadyQueue.push(function() { 
		startInst({
				path: "/linvo-installer-testing",
				ready: function(){console.log("inst is ready ")},
				progress: function(percent){console.log("complete: "+percent+"%")},
				extraFiles: [{from: "/ivo/Linvo/modules/modules-2010.12/Transmission 2.13.lzm", to: "/home/linvo/Applications"}]
			}, modulesData)
		 });
}*/
