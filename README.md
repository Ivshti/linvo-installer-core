This is the core for Linvo Installer 5. Linvo Installer 4 is in the repo "Ivshti/linvo-installer", all others are obsolete, with 3 being the last used in the Linvo distribution.

# How to use:

```javascript
var installer = require("./linvo-installer.js");

installer.startInstallation({
	path: "/media/some-partition", /* a path where the OS would be installed */
	extraFiles: [{from: "/memory/data/linvo/apps/Mozilla Firefox 14.0.lxm", to: "/home/linvo"}], /* an array of {from: x, to: y} pairs representing additional files to be copied ; 
		the "to" path is relative to the installation path
		the "to" path would be created if it does not exist */
	ready: function() { /* called when installation is ready */ },
	progress: function(percentage) { /* percentage is a floating point value from 0 to 100 representing the progress of the installation */ }
})
```


# Basic TODO

* Partitioner Node.js module, based on LinvoInstaller4 partitioner
* Do not call progress until weighing is complete
