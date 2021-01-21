module.exports = {
	getTime: function (format = "string") {
		firstDate = new Date(Date.UTC(2020, 9, 23, 10, 16, 0, 0));
		firstDate.setHours(firstDate.getHours() - 5);
		firstDate = firstDate.getTime();
		
		secondDate = new Date();
		secondDate = new Date(Date.UTC(secondDate.getUTCFullYear(), secondDate.getUTCMonth(), secondDate.getUTCDate(), secondDate.getUTCHours(), secondDate.getUTCMinutes(), secondDate.getUTCSeconds(), secondDate.getUTCMilliseconds()));
		secondDate.setHours(secondDate.getHours() - 5);
		secondDate = secondDate.getTime();
		
		roleplayDate = new Date(Date.UTC(1789, 0, 1, 0, 0, 0, 0));
		roleplayDate.setHours(roleplayDate.getHours() - 5);
		roleplayDate = roleplayDate.getTime();
		
		finalDate = roleplayDate + ((secondDate - firstDate) * (31536000 / (86400 * 15)));
		finalDate = new Date(finalDate);
		return module.exports.generateOutput(finalDate, format);
	}, 
	getRealTime: function (format = "string") {
		realDate = new Date();
		realDate = new Date(Date.UTC(realDate.getUTCFullYear(), realDate.getUTCMonth(), realDate.getUTCDate(), realDate.getUTCHours(), realDate.getUTCMinutes(), realDate.getUTCSeconds(), realDate.getUTCMilliseconds()));
		realDate.setHours(realDate.getHours() - 5);
		return module.exports.generateOutput(realDate, format);
	}, 
	generateOutput: function (date, format = "string") {
		if (format === "string") {
			return date.toLocaleString("en-US", {
				"timeZone": "UTC", 
				"hour12": true
			});
		} else if (format === "JSON") {
			return {
				"year": date.getUTCFullYear(), 
				"month": date.getUTCMonth() + 1, 
				"day": date.getUTCDate(), 
				"hour": date.getUTCHours(), 
				"minute": date.getUTCMinutes(), 
				"second": date.getUTCSeconds(), 
				"millisecond": date.getUTCMilliseconds()
			};
		} else if (format === "integer") {
			return date.getTime();
		}
	}
};