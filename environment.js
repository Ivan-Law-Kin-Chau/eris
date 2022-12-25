module.exports = class Environment {
	constructor (store) {
		this.store = store;
	}
	
	tokenIs (token, expectedContent = null, expectedType = "string") {
		if (!token) return false;
		if (token.type !== expectedType) return false;
		if (token.content !== expectedContent && expectedContent !== null) return false;
		return true;
	}
	
	authorize (client, message, listOfIds, callback, sayAccessDenied = true, dungeonMasterMode = false) {
		if (message.guild.id !== listOfIds.rootServer) {
			message.reply(`Server not recognized! `);
			return;
		}
		
		let authorized = false;
		
		if (dungeonMasterMode === false) {
			// Test if the message author is a President, Judge, Banker, Police Officer or Dungeon Master
			Object.values(listOfIds.fiscalAuthorizers).forEach(role => {
				message.guild.roles.cache.get(role).members.forEach(roleMember => {
					if (roleMember.user.id === message.author.id) authorized = true;
				});
			});
		} else if (dungeonMasterMode === true) {
			// Test if the message author is a Dungeon Master
			message.guild.roles.cache.get(listOfIds.fiscalAuthorizers.dungeonMaster).members.forEach(roleMember => {
				if (roleMember.user.id === message.author.id) authorized = true;
			});
		}
		
		if (authorized === false && sayAccessDenied === true) {
			message.reply(`Access denied! `);
		} else if (authorized === true) {
			callback();
		}
	}
	
	evaluate (client, message, line, listOfIds) {
		if (this.tokenIs(line[0], "help") && line.length === 1) {
			let version = 0;
			this.authorize(client, message, listOfIds, () => {
				version = 1;
				this.authorize(client, message, listOfIds, () => {
					version = 2;
				}, false, true);
			}, false);
			
			let replyMessage = `Here is the list of available commands: \n**!e help** - See this message. \n**!e time** - See the current time in Discordia. \n**!e balance {person (optional)}** - See your, or someone else's current balance. \n**!e give {person} {number}** - Send your DCP to someone. `;
			
			if (version >= 1) {
				replyMessage += `\n\nBecause you are a President, Judge, Banker, Police Officer or Dungeon Master, you can also use these commands: \n**!e reward {person} {number} "{reason (optional)}"** - Send the government's DCP to people. \n**!e charge {person} {number} "{reason (optional)}"** - Send people's DCP to the government. \n**!e print {number}** - Print new DCP for the government. \n**!e burn {number}** - Burn depreciated DCP held by the government. `;
			}
			
			if (version >= 2) {
				replyMessage += `\n\nBecause you are a Dungeon Master, you can also use these commands: \n**!e dice {probability of success (from 0 to 100 percent)} "{action}"** - Let fate decide whether an extrajudicial action is successful or not. `;
			}
			
			message.reply(replyMessage);
		} else if (this.tokenIs(line[0], "time") && line.length === 1) {
			let daysElapsed = Math.floor((new Date()).getTime() / 86400000) - 19036;
			let currentTime = {year: 1984 + Math.floor(daysElapsed / 12), month: 0 + (daysElapsed % 12)};
			let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			message.reply(`Discordia is currently in ${months[currentTime.month]}, ${currentTime.year}. `);
		} else if (this.tokenIs(line[0], "balance") && (line.length >= 1 || line.length <= 2)) {
			if (line.length === 1) {
				this.store.getBalance(message.author.id, function (balance) {
					message.reply(`Your balance currently is ${balance} DCP. `);
				});
			} else if (line.length === 2) {
				if (this.tokenIs(line[1], "1046514022566072371", "role_id")) {
					this.store.getBalance("-1", function (balance) {
						message.reply(`The government currently has a total of ${balance} DCP. `);
					});
				} else if (this.tokenIs(line[1], "1032097268091867147", "account_id")) {
					this.store.getBalance("0", function (balance) {
						message.reply(`Eris currently has a total of undefined DCP. `);
						message.reply(`Syntax error! `);
					});
				} else if (line[1].type === "account_id") {
					this.store.getBalance(line[1].content, function (balance) {
						message.reply(`<@${line[1].content}>'s balance currently is ${balance} DCP. `);
					});
				} else {
					message.reply(`Person not found! `);
				}
			}
		} else if (this.tokenIs(line[0], "demo") && line.length === 1) {
			require(".\/chart.js")(function (dataURL) {
				message.reply(`https://cingjue.org/bot/charts/${dataURL}`);
			});
		} else if (this.tokenIs(line[0], "give") && line.length === 3) {
			const environment = this;
			if (!environment.tokenIs(line[1], null, "account_id")) {
				message.reply(`Parameter 1 has to ping a user! `);
			} else if (!environment.tokenIs(line[2], null, "integer")) {
				message.reply(`Parameter 2 has to be a number! `);
			} else if (line[2].content < 0) {
				message.reply(`Parameter 2 cannot be less than 0! `);
			} else {
				environment.store.getBalance(message.author.id, function (balance) {
					if (balance - parseInt(line[2].content) < 0) {
						message.reply(`You have insufficient funds! `);
					} else {
						environment.store.transact(function (value) {
							if (value === null) {
								message.reply(`Syntax error! `);
							} else if (value === false) {
								message.reply(`Your transaction cannot involve bots! `);
							} else if (value === true) {
								message.reply(`Your transaction is performed successfully. `);
							}
						}, message.createdTimestamp, line[2].content, message.author.id, line[1].content);
					}
				});
			}
		} else if (this.tokenIs(line[0], "reward") || this.tokenIs(line[0], "charge") && (line.length >= 3 || line.length <= 4)) {
			this.authorize(client, message, listOfIds, () => {
				if (!this.tokenIs(line[1], null, "account_id") && !this.tokenIs(line[1], null, "role_id")) {
					message.reply(`Parameter 1 has to ping a user or a role! `);
				} else if (!this.tokenIs(line[2], null, "integer")) {
					message.reply(`Parameter 2 has to be a number! `);
				} else if (line[2].content < 0) {
					message.reply(`Parameter 2 cannot be less than 0! `);
				} else {
					const environment = this;
					if (environment.tokenIs(line[0], "reward")) {
						environment.store.transact(function (value) {
							if (value === null) {
								message.reply(`Syntax error! `);
							} else if (value === false) {
								message.reply(`Bots cannot be rewarded! `);
							} else if (value === true) {
								message.reply(`They are rewarded successfully. `);
								client.channels.cache.get(listOfIds.rewardChargeLogs).send(`<@${message.author.id}> has just rewarded <@${line[1].content}> ${line[2].content} DCP. `);
								if (environment.tokenIs(line[3], null)) {
									client.channels.cache.get(listOfIds.rewardChargeLogs).send(`**Reason provided: **${line[3].content}`);
								}
							}
						}, message.createdTimestamp, line[2].content, "-1", line[1].content, message.author.id);
					} else if (environment.tokenIs(line[0], "charge")) {
						environment.store.transact(function (value) {
							if (value === null) {
								message.reply(`Syntax error! `);
							} else if (value === false) {
								message.reply(`Bots cannot be charged! `);
							} else if (value === true) {
								message.reply(`They are charged successfully. `);
								client.channels.cache.get(listOfIds.rewardChargeLogs).send(`<@${message.author.id}> has just charged <@${line[1].content}> ${line[2].content} DCP. `);
								if (environment.tokenIs(line[3], null)) {
									client.channels.cache.get(listOfIds.rewardChargeLogs).send(`**Reason provided: **${line[3].content}`);
								}
							}
						}, message.createdTimestamp, line[2].content, line[1].content, "-1", message.author.id);
					}
				}
			});
		} else if (this.tokenIs(line[0], "print") || this.tokenIs(line[0], "burn") && line.length === 2) {
			this.authorize(client, message, listOfIds, () => {
				if (!this.tokenIs(line[1], null, "integer")) {
					message.reply(`Parameter 1 has to be a number! `);
				} else if (line[1].content < 0) {
					message.reply(`Parameter 1 cannot be less than 0! `);
				} else {
					if (this.tokenIs(line[0], "print")) {
						this.store.transact(function (value) {
							message.reply(`You have printed ${line[1].content} DCP. `);
						}, message.createdTimestamp, line[1].content, "0", "-1", message.author.id);
					} else if (this.tokenIs(line[0], "burn")) {
						this.store.transact(function (value) {
							message.reply(`You have burnt ${line[1].content} DCP. `);
						}, message.createdTimestamp, line[1].content, "-1", "0", message.author.id);
					}
				}
			});
		} else if (this.tokenIs(line[0], "dice") && line.length === 3) {
			this.authorize(client, message, listOfIds, () => {
				if (!this.tokenIs(line[1], null, "integer")) {
					message.reply(`Parameter 1 has to be a number! `);
				} else if (line[1].content < 0) {
					message.reply(`Parameter 1 cannot be less than 0! `);
				} else if (line[1].content > 100) {
					message.reply(`Parameter 1 cannot be more than 100! `);
				} else if (!this.tokenIs(line[2], null)) {
					message.reply(`Parameter 2 has to be a string! `);
				} else if (Math.random() * 100 >= line[1].content) {
					message.reply(`The attempt to ${line[2].content} is unsuccessful. `);
				} else {
					message.reply(`The attempt to ${line[2].content} is successful. `);
				}
			}, true, true);
		} else {
			message.reply(`Command not recognized! `);
		}
	}
};