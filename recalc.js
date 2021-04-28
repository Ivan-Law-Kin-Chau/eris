module.exports = function (message, client, mode = "normal", id = null) {
	return new Promise(function (resolve, reject) {
		var users = [];
		var database = new (require("sqlite3").verbose()).Database("database.db");
		
		database.all("SELECT * FROM transactions;", function(error, rows) {
			for (var i = 0; i < rows.length; i++) {
				var addAmount = rows[i].amount;
				var minusAmount = rows[i].amount;
				
				// The time when HDH starts to decay
				if (rows[i].type !== "joining" && rows[i].time_stamp > "1615309359835") {
					var lastReceived = null;
					for (var j = 0; j < i; j++) {
						if (rows[i].receiver === rows[j].receiver && rows[j].type !== "joining") {
							lastReceived = rows[j];
						}
					}
					
					if (lastReceived !== null) {
						const timeElapsed = parseInt(rows[i].time_stamp) - parseInt(lastReceived.time_stamp);
						if (rows[i].time_stamp > "1616375917806") {
							var decayAmount = 0.75;
						} else {
							var decayAmount = 0.5;
						}
						addAmount = Math.floor(0.1 * rows[i].amount + 0.9 * rows[i].amount * Math.pow(decayAmount, timeElapsed / 86400000));
					}
				}
				
				var userFound = false;
				users.forEach(function (user) {
					if (user.id === rows[i].receiver) userFound = true;
				});
				
				if (userFound === false) users.push({
					"id": rows[i].receiver, 
					"balance": 0
				});
				
				if (rows[i].agent === null) {
					users.forEach(function (user) {
						if (user.id === rows[i].receiver) user.balance += addAmount;
					});
				} else if (rows[i].receiver === null) {
					users.forEach(function (user) {
						if (user.id === rows[i].agent) user.balance -= minusAmount;
					});
				} else {
					if (rows[i].type === "paying") {
						users.forEach(function (user) {
							if (user.id === rows[i].receiver) user.balance += Math.floor(addAmount / 2);
							if (user.id === rows[i].agent) user.balance -= minusAmount;
						});
					} else {
						users.forEach(function (user) {
							if (user.id === rows[i].receiver) user.balance += addAmount;
							if (user.id === rows[i].agent) user.balance -= minusAmount;
						});
					}
				}
			}
			
			database.all("SELECT * FROM accounts;", function(error, rows) {
				client.guilds.cache.get(rootServer).members.fetch().then(function (clientUsers) {
					var enabledUsers = [];
					for (var i = 0; i < rows.length; i++) {
						userLoop: for (var user of users) {
							for (var [clientUserKey, clientUserValue] of clientUsers) {
								if (user.id === rows[i].account_id && user.id === clientUserKey) {
									if (rows[i].disabled === 0 && clientUserValue._roles.indexOf(memberRole) !== -1) {
										enabledUsers.push(user);
										break userLoop;
									}
								}
							}
						}
					}
					
					enabledUsers.sort(function (a, b) {
						if (a.balance > b.balance) {
							return -1;
						} else if (a.balance < b.balance) {
							return 1;
						}
						return 0;
					});
					
					if (mode === "normal") {
						var messages = ["", "", ""];
						var stage = 3;
						enabledUsers.forEach(function (user) {
							if (stage === 3 && user.balance >= 300) {
								stage = 2;
								messages[2 - stage] += "**Leaderboard (300 HDH+)**\r\n";
							} else if (stage === 2 && user.balance >= 200 && user.balance < 300) {
								stage = 1;
								messages[2 - stage] += "**Leaderboard (200-299 HDH)**\r\n";
							} else if (stage === 1 && user.balance < 200) {
								stage = 0;
								messages[2 - stage] += "**Leaderboard (0-199 HDH)**\r\n";
							}
							const userObject = message.guild.member(user.id);
							if (userObject) messages[2 - stage] += userObject.displayName + ": " + user.balance + " HDH\r\n";
						});
						
						messages.push("(<@" + masterID + "> does not have any HDH because he is one of the staffs)");
						resolve(messages);
					} else if (mode === "balance") {
						enabledUsers.forEach(function (user) {
							if (user.id === id) resolve(user.balance);
						});
					} else if (mode === "vote") {
						var votable = 0;
						var voteEnded = false;
						enabledUsers.forEach(function (user) {
							if (user.id === id) voteEnded = true;
							if (voteEnded === false && parseInt(user.balance.toString()[0]) % 2 === 0) votable++;
						});
						resolve(votable);
					}
				});
			});
		});
	});
}