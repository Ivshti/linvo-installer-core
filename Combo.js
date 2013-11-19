function Combo(callback, items) {
  this.callback = callback;
  this.items = items || 0;
  this.itemsPreset = items;
  this.results = [];
}

Combo.prototype = {
  add: function (cb) {
    var self = this,
        id = this.items;
    if (!this.itemsPreset) this.items++;
    return function () {
		if (typeof(cb)=="function")
		{	
			cb.apply(this, arguments);
			self.check(id, null);
		}
		else self.check(id, arguments);
	};
  },
  check: function (id, arguments) {
    if (arguments)
		this.results[id] = Array.prototype.slice.call(arguments);
 
    this.items--;
    if (this.items == 0) {
      this.callback.apply(this, this.results);
    }
  }
};

module.exports = Combo;
