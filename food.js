module.exports = {
	generateHarvest: function (state, county, callback = function (yield) {}) {
		counties = new (require("sqlite3")).Database("counties.db");
		counties.all("SELECT * FROM counties WHERE state = \"" + state + "\" AND county = \"" + county + "\" ORDER BY yield DESC", function(error, rows) {
			if (error) {
				console.log(error);
			} else {
				seed = Math.random() * 10;
				seed = parseInt(seed - seed % 1);
				probabilityPortions = [[0, 0], [1, 2], [3, 6], [7, 8], [9, 9]];
				probabilityReturnMessages = ["a very good harvest", "a good harvest", "an average harvest", "a bad harvest", "a very bad harvest"];
				callbackWithNull = true;
				
				if (rows) {
					if (rows.length === 5) {
						for (i = 0; i < probabilityPortions.length; i++) {
							if (seed >= probabilityPortions[i][0] && seed <= probabilityPortions[i][1]) {
								callbackWithNull = false;
								callback({
									"name": probabilityReturnMessages[i], 
									"value": parseInt(rows[i].yield)
								});
							}
						}
					}
				}
				
				if (callbackWithNull === true) {
					callback(null);
				}
			}
		});
	}
};