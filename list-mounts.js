#!/usr/bin/node

var mounts = [],
	byDevice = {},
	byMountpoint = {};

/* an ugly hack to escape things like \040 or \n */
function escapeUnix(str)
{
	return eval("'"+str+"'")
}

require("fs")	
.readFileSync("/proc/mounts")
.toString()
.split("\n")
.reverse() /* if we go the normal order, entries that are down the /proc/mounts file would override (in byDevice and byMountpoint) the first entries; we want the first entries to have priority */
.forEach(function(line)
{
	/*
	 * TODO: VERY IMPORTANT:
	 * proper unescaping (shell-style), e.g. /040 becomes an interval
	 */
	
	var lineSplit = line.split(" "),
		mount = {
			device: escapeUnix(lineSplit[0] || ""),
			mountpoint: escapeUnix(lineSplit[1] || ""),
			fsType: lineSplit[2],
			fsOptions: lineSplit[3]
		};

	mounts.push(byMountpoint[mount.mountpoint] = byDevice[mount.device] = mount)
})

module.exports = 
{
	mounts: mounts,
	byDevice: byDevice,
	byMountpoint: byMountpoint
}
