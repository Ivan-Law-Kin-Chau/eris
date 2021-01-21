module.exports = {
	cache: new (require("sqlite3")).Database("cache.db"), 
	cacheDiaPesos: function (id) {
		realTime = JSON.stringify(timeFunctions.getRealTime("JSON"));
		realTime = realTime.split("\"").join("\"\"");
		module.exports.cache.run("INSERT INTO dia_pesos VALUES (\"" + realTime + "\", \"" + id + "\")");
	}, 
	checkDiaPesos: function (id, callback = function (input) { console.log(input); }) {
		module.exports.cache.all("SELECT * FROM dia_pesos WHERE id = \"" + id + "\" ORDER BY time DESC", function(error, rows) {
			if (error) {
				console.log(error);
			} else {
				if (rows.length === 0) {
					callback(true);
				} else {
					checkedTime = JSON.parse(rows[0].time);
					realTime = timeFunctions.getRealTime("JSON");
					if (checkedTime.day === realTime.day) {
						callback(false);
					} else {
						callback(true);
					}
				}
			}
		});
	}, 
	cacheFarm: function (state, county) {
		realTime = JSON.stringify(timeFunctions.getRealTime("JSON"));
		realTime = realTime.split("\"").join("\"\"");
		module.exports.cache.run("INSERT INTO farm VALUES (\"" + realTime + "\", \"" + state + "\", \"" + county + "\")");
	}, 
	checkFarm: function (state, county, callback = function (input) { console.log(input); }) {
		module.exports.cache.all("SELECT * FROM farm WHERE state = \"" + state + "\" AND county = \"" + county + "\" ORDER BY time DESC", function(error, rows) {
			if (error) {
				console.log(error);
			} else {
				if (rows.length === 0) {
					callback(true);
				} else {
					checkedTime = JSON.parse(rows[0].time);
					realTime = timeFunctions.getRealTime("JSON");
					if (checkedTime.day === realTime.day) {
						callback(false);
					} else {
						callback(true);
					}
				}
			}
		});
	}, 
	cacheHealth: function (id, health, message = null, death = null) {
		if (health <= 0 && message !== null && death !== null) {
			message.guild.members.fetch(id).then(function (users) {
				suppressedRoles = users._roles;
				users.roles.add(deadRole);
				for (i = 0; i < suppressedRoles.length; i++) {
					users.roles.remove(suppressedRoles[i]);
				}
				module.exports.cacheSuppressedRoles(id, suppressedRoles);
				client.channels.cache.get(deadChannel).send("**<@" + id + ">** has just died. ");
				store.dispatch(death);
			});
		}
		
		realTime = timeFunctions.getRealTime("integer");
		module.exports.cache.run("INSERT INTO health VALUES (" + realTime + ", \"" + id + "\", " + health + ")");
	}, 
	checkHealth: function (id, callback = function (input) { console.log(input); }) {
		module.exports.cache.all("SELECT * FROM health WHERE id = \"" + id + "\" ORDER BY unix_time DESC", function(error, rows) {
			if (error) {
				console.log(error);
			} else {
				if (rows.length === 0) {
					callback(1);
				} else if (rows[0].health <= 0) {
					callback(rows[0].health);
				} else {
					checkedTime = rows[0].unix_time / 1000000;
					realTime = timeFunctions.getRealTime("integer") / 1000000;
					checkedTime = checkedTime - checkedTime % 1;
					realTime = realTime - realTime % 1;
					currentHealth = rows[0].health - (realTime - checkedTime);
					if (currentHealth < 1) {
						currentHealth = 1;
					}
					callback(currentHealth);
				}
			}
		});
	},
	cacheSuppressedRoles: function (id, suppressedRoles) {
		module.exports.cache.all("SELECT * FROM suppressed_roles WHERE id = \"" + id + "\" ORDER BY suppression DESC", function(error, rows) {
			if (error) {
				console.log(error);
			} else {
				if (rows.length === 0) {
					suppression = 1;
				} else {
					suppression = rows[0].suppression + 1;
				}
				for (i = 0; i < suppressedRoles.length; i++) {
					module.exports.cache.run("INSERT INTO suppressed_roles VALUES (" + suppression + ", \"" + id + "\", " + suppressedRoles[i] + ")");
				}
			}
		});
	}, 
	checkSuppressedRoles: function (id, callback = function (input) { console.log(input); }) {
		module.exports.cache.all("SELECT * FROM suppressed_roles WHERE id = \"" + id + "\" ORDER BY suppression DESC", function(error, rows) {
			if (error) {
				console.log(error);
			} else {
				suppressedRoles = [];
				if (rows.length !== 0) {
					suppression = rows[0].suppression;
					for (i = 0; i < rows.length; i++) {
						if (rows[i].suppression === suppression) {
							suppressedRoles[suppressedRoles.length] = rows[i].role;
						} else {
							break;
						}
					}
				}
				callback(suppressedRoles);
			}
		});
	}
};