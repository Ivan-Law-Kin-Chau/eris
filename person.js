module.exports = class Person {
	constructor () {
		// Person state
		// Should not be accessed from outside the class instance
		// The only way to interact with the person state should be via the functions below
		this.inventory = {};
		this.bans = {
			create: {}, 
			give: {}, 
			has: {}
		};
	}
	
	ban (contractId, type, amount, item) {
		if (this.bans[type][contractId]) {
			if (this.bans[type][contractId][item]) {
				if (this.bans[type][contractId][item] < amount) this.bans[type][contractId][item] = amount;
				return true;
			} else {
				this.bans[type][contractId][item] = amount;
				return true;
			}
		} else {
			this.bans[type][contractId] = {};
			this.bans[type][contractId][item] = amount;
			return true;
		}
	}
	
	unban (contractId) {
		delete this.bans["create"][contractId];
		delete this.bans["give"][contractId];
		delete this.bans["has"][contractId];
	}
	
	checkBan (type, amount, item) {
		let isBanned = false;
		this.bans[type].forEach(function (contractBans) {
			if (contractBans[item] && contractBans[item] >= amount) isBanned = true;
		});
		return isBanned;
	}
	
	add (amount, item) {
		if (this.inventory[item]) {
			this.inventory[item] += amount;
			return true;
		} else {
			this.inventory[item] = amount;
			return true;
		}
	}
	
	remove (amount, item) {
		if (this.inventory[item] >= amount) {
			this.inventory[item] -= amount;
			if (this.inventory[item] === 0) delete this.inventory[item];
			return true;
		} else {
			return false;
		}
	}
	
	checkItem (amount, item) {
		if (this.inventory[item] && this.inventory[item] >= amount) {
			return true;
		} else {
			return false;
		}
	}
};