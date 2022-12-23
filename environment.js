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
	
	evaluate (client, message, line, listOfIds) {
		if (this.tokenIs(line[0], "help") && line.length === 1) {
			message.reply(`Here is the list of available commands: \n**!e help** - See this message. \n**!e time** - See the current time in Discordia. \n**!e balance** - See your current balance. \n**!e budget** - See the government's current balance. \n**!e give {person} {number}** - Send your DCP to someone. \n**!e reward {person/role} {number} "{reason (optional)}"** - Send the government's DCP to people\\*. \n**!e charge {person/role} {number} "{reason (optional)}"** - Send people's DCP to the government\\*. \n**!e print {number}** - Print new DCP for the government\\*. \n**!e burn {number}** - Burn depreciated DCP held by the government\\*. \n**!e dice {probability of success (from 0 to 100 percent)} "{action}"** - Let fate decide whether an extrajudicial action is successful or not\\*\\*. \n\\* Only for Presidents, Judges, Bankers, Police Officers and Dungeon Masters. \n\\*\\* Only for Dungeon Masters. `);
		} else if (this.tokenIs(line[0], "time") && line.length === 1) {
			let daysElapsed = Math.floor((new Date()).getTime() / 86400000) - 19036;
			let currentTime = {year: 1984 + Math.floor(daysElapsed / 12), month: 0 + (daysElapsed % 12)};
			let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			message.reply(`Discordia is currently in ${months[currentTime.month]}, ${currentTime.year}. `);
		} else if (this.tokenIs(line[0], "balance") && line.length === 1) {
			this.store.getBalance(message.author.id, function (balance) {
				message.reply(`Your balance currently is ${balance} DCP. `);
			});
		} else if (this.tokenIs(line[0], "budget") && line.length === 1) {
			this.store.getBalance("-1", function (budget) {
				message.reply(`The government currently has a total of ${budget} DCP. `);
			});
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
			if (message.guild.id !== listOfIds.rootServer) {
				message.reply(`Server not recognized! `);
				return;
			}
			
			let authorized = false;
			Object.values(listOfIds.fiscalAuthorizers).forEach(role => {
				message.guild.roles.cache.get(role).members.forEach(roleMember => {
					if (roleMember.user.id === message.author.id) authorized = true;
				});
			});
			
			if (authorized === false) {
				message.reply(`Access denied! `);
				return;
			}
			
			if (!this.tokenIs(line[1], null, "account_id") && !this.tokenIs(line[1], null, "role_id")) {
				message.reply(`Parameter 1 has to ping a user or a role! `);
			} else if (!this.tokenIs(line[2], null, "integer")) {
				message.reply(`Parameter 2 has to be a number! `);
			} else if (line[2].content < 0) {
				message.reply(`Parameter 2 cannot be less than 0! `);
			} else {
				const environment = this;
				let rewardOrCharge = function (target, time, noReply = false) {
					if (environment.tokenIs(line[0], "reward")) {
						environment.store.transact(function (value) {
							if (value === null) {
								message.reply(`Syntax error! `);
							} else if (value === false) {
								message.reply(`Bots cannot be rewarded! `);
							} else if (value === true && noReply === false) {
								message.reply(`They are rewarded successfully. `);
								client.channels.cache.get(listOfIds.rewardChargeLogs).send(`<@${message.author.id}> has just rewarded <@${target}> ${line[2].content} DCP. `);
								if (environment.tokenIs(line[3], null)) {
									client.channels.cache.get(listOfIds.rewardChargeLogs).send(`**Reason provided: **${line[3].content}`);
								}
							}
						}, time, line[2].content, "-1", target, message.author.id);
					} else if (environment.tokenIs(line[0], "charge")) {
						environment.store.transact(function (value) {
							if (value === null) {
								message.reply(`Syntax error! `);
							} else if (value === false) {
								message.reply(`Bots cannot be charged! `);
							} else if (value === true && noReply === false) {
								message.reply(`They are charged successfully. `);
								client.channels.cache.get(listOfIds.rewardChargeLogs).send(`<@${message.author.id}> has just charged <@${target}> ${line[2].content} DCP. `);
								if (environment.tokenIs(line[3], null)) {
									client.channels.cache.get(listOfIds.rewardChargeLogs).send(`**Reason provided: **${line[3].content}`);
								}
							}
						}, time, line[2].content, target, "-1", message.author.id);
					}
				}
				
				if (environment.tokenIs(line[1], null, "account_id")) {
					rewardOrCharge(line[1].content, message.createdTimestamp);
				} else if (environment.tokenIs(line[1], null, "role_id")) {
					let list = [];
					let time = message.createdTimestamp;
					message.guild.roles.cache.get(line[1].content).members.forEach(roleMember => {
						rewardOrCharge(roleMember.user.id, time, true);
						list.push(roleMember.user.id);
						time++;
					});
					
					list = list.join(", ");
					list = list.substring(0, list.length - 2);
					if (environment.tokenIs(line[0], "reward")) {
						message.reply(`Everyone has been rewarded successfully. `);
						client.channels.cache.get(listOfIds.rewardChargeLogs).send(`<@${message.author.id}> has just rewarded all members of the <@&${line[1].content}> role ${line[2].content} DCP each. `);
						if (environment.tokenIs(line[3], null)) {
							client.channels.cache.get(listOfIds.rewardChargeLogs).send(`**Reason provided: **${line[3].content}`);
						}
					} else if (environment.tokenIs(line[0], "charge")) {
						message.reply(`Everyone has been charged successfully. `);
						client.channels.cache.get(listOfIds.rewardChargeLogs).send(`<@${message.author.id}> has just charged all members of the <@&${line[1].content}> role ${line[2].content} DCP each. `);
						if (environment.tokenIs(line[3], null)) {
							client.channels.cache.get(listOfIds.rewardChargeLogs).send(`**Reason provided: **${line[3].content}`);
						}
					}
				}
			}
		} else if (this.tokenIs(line[0], "print") || this.tokenIs(line[0], "burn") && line.length === 2) {
			if (message.guild.id !== listOfIds.rootServer) {
				message.reply(`Server not recognized! `);
				return;
			}
			
			let authorized = false;
			Object.values(listOfIds.fiscalAuthorizers).forEach(role => {
				message.guild.roles.cache.get(role).members.forEach(roleMember => {
					if (roleMember.user.id === message.author.id) authorized = true;
				});
			});
			
			if (authorized === false) {
				message.reply(`Access denied! `);
				return;
			}
			
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
		} else if (this.tokenIs(line[0], "dice") && line.length === 3) {
			if (message.guild.id === listOfIds.rootServer) {
				let authorized = false;
				message.guild.roles.cache.get(listOfIds.fiscalAuthorizers.dungeonMaster).members.forEach(roleMember => {
					if (roleMember.user.id === message.author.id) authorized = true;
				});
				
				if (authorized === false) {
					message.reply(`Access denied! `);
				} else if (authorized === true) {
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
				}
			} else {
				message.reply(`Server not recognized! `);
			}
		} else {
			message.reply(`Command not recognized! `);
		}
	}
};