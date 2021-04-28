erisID = "";
masterID = "";
rootServer = "";
rootChannel = "";
botsChannel = "";
memberRole = "";

parseFunctions = require(".\/parse.js");
storeFunctions = require(".\/store.js");

client = new (require("discord.js")).Client();
client.login("");
client.on("ready", function () {
	console.log("The bot has been started. ");
	cronJob = function () {
		client.guilds.cache.get(rootServer).members.fetch().then(function (users) {
			list = [];
			users.forEach(function (user) {
				if (user.user.bot === false) {
					list[list.length] = [user.user.id, user.user.username, user.user.discriminator];
				}
			});
			storeFunctions.handler(list);
		});
	}
	
	cronJob();
	cron = require("node-cron");
	cron.schedule("30 * * * * *", cronJob);
});

client.on("message", function (message) {
	if (message.guild === null || message.channel.id === botsChannel || message.channel.id === rootChannel) {
		if (message.content.startsWith("!e ")) {
			console.log(message.author.id, message.content);
			var arguments = parseFunctions.parseCommand(message.content);
			if (JSON.parse(arguments[1])[1] === "half" || JSON.parse(arguments[1])[1] === "gift") {
				var target = null;
				for (var listElement of list) {
					if (JSON.parse(arguments[2])[1] === listElement[1]) {
						target = listElement[0];
						break;
					} else if (JSON.parse(arguments[2])[1] === listElement[1] + "#" + listElement[2]) {
						target = listElement[0];
						break;
					}
				}
				
				if (target === null || target === masterID) {
					message.channel.send("Target not found. ");
					return;
				}
			}
			if (JSON.parse(arguments[1])[1] === "help") {
				message.channel.send("You can send two HDH-related commands, either at the #bots channel of the Hardened Hearts server or in the DM with Erisal. \r\n\r\n**1. !e half \"Ivan Law\"** - Vote to half the amount of HDH that Ivan Law (or someone else) has. This only works for the 2/3 supermajority vote, not the unanimous vote. \r\n\r\n**2. !e gift \"Ivan Law\" 123** - Gift 123 HDH to Ivan Law (or someone else). Of course, they would only receive half of it, rounded down to the nearest integer. \r\n\r\nRemember to use Discord usernames instead of nicknames in these commands. Also, if two or more accounts share the same username, add a # and their Discord discriminator behind their username to clarify who are you referring to. ");
			} else if (JSON.parse(arguments[1])[1] === "half") {
				client.channels.fetch(rootChannel).then(channel => {
					channel.send("!e vote <@!" + message.author.id + "> <@!" + target + ">");
					if (message.guild === null) {
						channel.send("(Which is from `" + message.id + "`)");
					} else {
						channel.send("(Which is from `" + message.id + "` at `" + message.channel.id + "`)");
					}
					message.channel.send("Your command has been executed. ");
				});
			} else if (JSON.parse(arguments[1])[1] === "gift") {
				const amount = JSON.parse(arguments[3])[1];
				// Reject the command if the amount that is being gifted is not an integer
				if (parseInt(amount).toString() !== amount) {
					message.channel.send("The amount is not an integer. ");
					return;
				}
				(require(".\/recalc.js"))(message, client, "balance", message.author.id).then(function (balance) {
					if (balance < amount) {
						message.channel.send("Your balance is not sufficient. ");
						return;
					} else if (amount < 0) {
						message.channel.send("The amount is less than zero. ");
						return;
					} else {
						client.channels.fetch(rootChannel).then(channel => {
							channel.send("!e pay " + amount + " <@!" + message.author.id + "> <@!" + target + "> X");
							if (message.guild === null) {
								channel.send("(Which is from `" + message.id + "`)");
							} else {
								channel.send("(Which is from `" + message.id + "` at `" + message.channel.id + "`)");
							}
							message.channel.send("Your command has been executed. ");
						});
					}
				});
			}
		}
	}
	if (message.channel.id === rootChannel) {
		if (message.content.startsWith("!e vote ")) {
			var arguments = parseFunctions.parseCommand(message.content);
			if (JSON.parse(arguments[2])[0] === "account_id" && JSON.parse(arguments[3])[0] === "account_id") {
				const voter = JSON.parse(arguments[2])[1];
				const target = JSON.parse(arguments[3])[1];
				const currentTime = message.createdTimestamp;
				const yesterdayTime = message.createdTimestamp - (86400 * 1000);
				storeFunctions.database.all("SELECT * FROM votes WHERE agent = \"" + voter + "\" AND time_stamp > \"" + yesterdayTime + "\" AND time_stamp <= \"" + currentTime + "\";", function (error, rows) {
					if (rows.length === 0) (async function () {
						await storeFunctions.database.run("INSERT INTO votes VALUES (null, \"" + message.createdTimestamp + "\", \"" + voter + "\", \"" + target + "\");");
						if (message.channel.id !== rootChannel) message.channel.send("Voted. ");
						
						(require(".\/recalc.js"))(message, client, "vote", target).then(function (votable) {
							storeFunctions.database.all("SELECT * FROM votes WHERE message_id IS NULL AND receiver = \"" + target + "\" AND time_stamp > \"" + yesterdayTime + "\" AND time_stamp <= \"" + currentTime + "\";", function (error, rows) {
								if (rows.length >= (votable * 2 / 3)) (require(".\/recalc.js"))(message, client, "balance", target).then(function (balance) {
									client.channels.fetch(rootChannel).then(channel => {
										if (balance % 2 === 0) {
											balance = balance / 2;
										} else {
											balance = balance / 2 + 0.5;
										}
										channel.send("!e voted " + balance + " <@!" + target + "> X X").then(async function (messageSent) {
											await storeFunctions.database.run("UPDATE votes SET message_id = \"" + messageSent.id + "\" WHERE message_id IS NULL AND receiver = \"" + target + "\" AND time_stamp > \"" + yesterdayTime + "\" AND time_stamp <= \"" + currentTime + "\";");
											channel.send("`UPDATE votes SET message_id = \"" + messageSent.id + "\" WHERE message_id IS NULL AND receiver = \"" + target + "\" AND time_stamp > \"" + yesterdayTime + "\" AND time_stamp <= \"" + currentTime + "\";`");
										});
									});
								});
							});
						});
					})();
				});
			}
		} else if (message.content === "!e leaderboard") {
			(require(".\/recalc.js"))(message, client).then(function (messages) {
				/*
				// New
				messages.forEach(function (messagesElement) {
					message.channel.send(messagesElement);
				});
				*/
				// Existing
				client.channels.fetch("816244892694347776").then(channel => {
					channel.messages.fetch("817608537147703297").then(fetched => fetched.edit(messages[0]));
					channel.messages.fetch("817608538314375169").then(fetched => fetched.edit(messages[1]));
					channel.messages.fetch("817608539589050430").then(fetched => fetched.edit(messages[2]));
					channel.messages.fetch("817608540918775819").then(fetched => fetched.edit(messages[3]));
				});
			});
		} else if (message.content.startsWith("!e formula ")) {
			var arguments = parseFunctions.parseCommand(message.content);
			arguments.forEach(function (argument, index, arguments) {
				argument = JSON.parse(argument)[1];
				if (index !== 0 && index !== 1 && index !== 3) argument = parseInt(argument);
				arguments[index] = argument;
			});
			
			if (arguments[3] !== "X") return;
			
			var balance = 0;
			if (arguments[2] < 4) {
				balance += 200;
			} else {
				balance += 100;
			}
			
			if (arguments[4] >= 3 && arguments[4] <= 8) balance += 40;
			balance += (arguments[5] + arguments[6]) * 4;
			message.channel.send("`" + balance + "`");
		} else {
			var extractjs = require("extractjs"),
			extractor = extractjs();
			
			var capture = function (type, template) {
				var captured = extractor(template, message.content);
				if (JSON.stringify(captured) !== "{}") {
					captured.id = message.id;
					captured.createdTimestamp = message.createdTimestamp;
					captured.type = type;
					
					var accountID = function (input, substring3 = true) {
						if (input) {
							if (substring3 === true) {
								var substring = 3;
							} else {
								var substring = 2;
							}
							number = input.substring(substring, input.length - 1);
						} else {
							number = "null";
						}
						
						if (number.length === 18 && typeof parseInt(number) === "number" && !(isNaN(parseInt(number)))) {
							// If the account id is in the <@xxx> format, it will be returned here at the first pass
							return "\"" + number + "\"";
						} else {
							if (substring3 === true) {
								// If the account id is in the <@!xxx> format, it will be accounted for here with a second pass
								return accountID(input, false);
							} else {
								// If the account id is neiter the <@xxx> format or the <@!xxx> format, it will return null
								return "null";
							}
						}
					}
					
					if (type === "levelUp") captured.amount = captured.amount * 8;
					
					captured.agent = accountID(captured.agent);
					captured.receiver = accountID(captured.receiver);
					captured.reason = accountID(captured.reason);
					
					query = "INSERT INTO transactions VALUES (\"" + captured.id + "\", \"" + captured.createdTimestamp + "\", \"" + captured.type + "\", " + captured.amount + ", " + captured.agent + ", " + captured.receiver + ", " + captured.reason + ");\r\n";
				}
			}
			
			var query = "";
			
			capture("levelUp", "GG {receiver}, you just advanced to level {amount}!");
			capture("joining", "!e join {amount} X {receiver} X");
			capture("paying", "!e pay {amount} {agent} {receiver} X");
			capture("inviting", "!e invite {amount} X {receiver} {reason}");
			capture("voting", "!e voted {amount} {agent} X X");
			capture("disrespect", "!e disrespect {amount} {agent} {receiver} X");
			capture("proposeJustification", "!e proposeJ {amount} X {receiver} X");
			capture("proposeAddiction", "!e proposeA {amount} X {receiver} X");
			capture("proposeBug", "!e proposeB {amount} X {receiver} X");
			capture("snitchingRule1", "!e snitch1 {amount} {agent} {receiver} X");
			capture("snitchingRule2", "!e snitch2 {amount} {agent} {receiver} X");
			capture("snitchingRule3", "!e snitch3 {amount} {agent} {receiver} X");
			
			if (query) {
				setTimeout(async function () {
					await storeFunctions.database.run(query);
					message.channel.send("`" + query + "`");
					message.channel.send("!e leaderboard");
				}, 416.7);
			}
		}
	}
});