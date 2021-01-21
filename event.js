module.exports = {
	database: new (require("sqlite3").verbose()).Database("event.db"), 
	serverID: "", 
	broadcastChannel: "", 
	roles: {
		"overseer" : "", 
		"cop": "", 
		"jailed": "", 
		"murdered": ""
	}, 
	checkRole: function (message, role, callback) {
		message.guild.members.fetch(message.author.id).then(function (users) {
			if (users._module.exports.roles.indexOf(module.exports.roles[role]) === -1) {
				callback(message, false);
			} else {
				callback(message, true);
			}
		});
	}, 
	execute: function (message) {
		arguments = message.content.split(" ");
		if (arguments[0] === "!insert" && arguments[2] === "money" && arguments[3] === "to") {
			module.exports.checkRole(message, "overseer", function (message, result) {
				if (result === true) {
					arguments = message.content.split(" ");
					amount = arguments[1];
					delete arguments[0];
					delete arguments[1];
					delete arguments[2];
					delete arguments[3];
					receiver = arguments.join(" ");
					receiver = receiver.substring(7, receiver.length - 1);
					module.exports.database.all("SELECT * FROM bank", function(error, rows) {
						if (error) {
							console.log(error);
						} else {
							idList = [];
							for (i = 0; i < rows.length; i++) {
								idList[idList.length] = rows[i].id;
							}
							if (idList.indexOf(receiver) === -1) {
								seed = Math.random() * (Math.pow(10, 12));
								seed = seed - (seed % 1);
								module.exports.database.run("INSERT INTO bank VALUES (\"" + receiver + "\", \"" + seed + "\", " + parseInt(amount) + ")");
								client.channels.cache.get(module.exports.broadcastChannel).send("The bank has just sent " + parseInt(amount) + " dollars to account number " + seed + "! ");
							} else {
								seed = rows[idList.indexOf(receiver)].seed;
								if (amount >= 0) {
									module.exports.database.run("UPDATE bank SET balance = balance + " + parseInt(amount) + " WHERE id = \"" + receiver + "\"");
									client.channels.cache.get(module.exports.broadcastChannel).send("The bank has just sent " + parseInt(amount) + " dollars to account number " + seed + "! ");
								} else {
									module.exports.database.run("UPDATE bank SET balance = balance - " + (0 - parseInt(amount)) + " WHERE id = \"" + receiver + "\"");
									client.channels.cache.get(module.exports.broadcastChannel).send("The bank has just sent " + parseInt(amount) + " dollars to account number " + seed + "! ");
								}
							}
						}
					});
				}
			});
		} else if (arguments[0] === "!murder") {
			delete arguments[0];
			murdered = arguments.join(" ");
			murdered = murdered.substring(1, murdered.length);
			seed = Math.random();
			if (seed > 0.4) {
				message.mentions.members.first().module.exports.roles.add(module.exports.roles["murdered"]);
				message.reply("you killed them! ");
			} else {
				message.member.module.exports.roles.add(module.exports.roles["jailed"]);
				message.reply("you are caught and jailed! ");
			}
		} else if (arguments[0] === "!jail") {
			module.exports.checkRole(message, "cop", function (message, result) {
				if (result === true) {
					arguments = message.content.split(" ");
					delete arguments[0];
					jailed = arguments.join(" ");
					jailed = jailed.substring(1, jailed.length);
					message.mentions.members.first().module.exports.roles.add(module.exports.roles["jailed"]);
					message.reply("you jailed them! ");
				}
			});
		}
	}
};