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
			// Test if the message author is a President, Judge, Accountant, Police Officer or Dungeon Master
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
			
			let replyMessage = `Here is the list of available commands: \n\n**!e help**\nSee this message. \n\n**!e time**\nSee the current time in Discordia. \n\n**!e balance {person (optional)}**\nSee your, or someone else's current balance. Use <@&${listOfIds.governmentID}> to prefer to the government. \n\n**!e give {person} {number}**\nSend your DCP to someone. `;
			
			if (version >= 1) {
				replyMessage += `\n\nBecause you are a President, Judge, Accountant, Police Officer or Dungeon Master, you can also use these commands: \n\n**!e transfer {person/role from} {person/role to} {number} "{reason (optional)}"**\nSend DCP from a person/role to a person/role. Use <@&${listOfIds.governmentID}> to prefer to the government and <@${listOfIds.erisID}> to refer to all entities other than the government or a Discord account. `;
			}
			
			if (version >= 2) {
				replyMessage += `\n\nBecause you are a Dungeon Master, you can also use these commands: \n\n**!e dice {probability of success (from 0 to 100 percent)} "{action}"**\nLet fate decide whether an extrajudicial action is successful or not. `;
			}
			
			message.reply(replyMessage);
		} else if (this.tokenIs(line[0], "time") && line.length === 1) {
			let unifiedDateObject = new Date();
			
			let daysElapsed = Math.floor((unifiedDateObject.getTime() - 176157000) / 86400000) - 19036;
			let currentTime = {year: 1984 + Math.floor(daysElapsed / 12), month: 0 + (daysElapsed % 12)};
			
			let simulatedDateObject = (new Date(-28800000));
			simulatedDateObject.setFullYear(currentTime.year);
			simulatedDateObject.setMonth(currentTime.month);
			
			if (simulatedDateObject < unifiedDateObject) {
				let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
				message.reply(`Discordia is currently in ${months[currentTime.month]}, ${currentTime.year}. `);
			} else {
				message.reply(`Discordia is currently in sync with real life, in terms of time. `);
			}
		} else if (this.tokenIs(line[0], "balance") && (line.length >= 1 || line.length <= 2)) {
			if (line.length === 1) {
				this.store.getBalance(message.author.id, function (balance) {
					message.reply(`Your balance currently is ${balance} DCP. `);
				});
			} else if (line.length === 2) {
				if (this.tokenIs(line[1], listOfIds.governmentID, "role_id")) {
					this.store.getBalance("-1", function (balance) {
						message.reply(`The government currently has a total of ${balance} DCP. `);
					});
				} else if (this.tokenIs(line[1], listOfIds.erisID, "account_id")) {
					this.store.getBalance("0", function (balance) {
						message.reply(`Person not found! `);
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
		} else if (this.tokenIs(line[0], "transfer") && (line.length >= 4 || line.length <= 5)) {
			this.authorize(client, message, listOfIds, () => {
				if (!this.tokenIs(line[1], null, "account_id") && !this.tokenIs(line[1], null, "role_id")) {
					message.reply(`Parameter 1 has to ping a user or a role! `);
				} else if (!this.tokenIs(line[2], null, "account_id") && !this.tokenIs(line[2], null, "role_id")) {
					message.reply(`Parameter 2 has to ping a user or a role! `);
				} else if (!this.tokenIs(line[3], null, "integer")) {
					message.reply(`Parameter 3 has to be a number! `);
				} else if (line[3].content < 0) {
					message.reply(`Parameter 3 cannot be less than 0! `);
				} else {
					const environment = this;
					
					let substitute = function (accountOrRoleID) {
						if (environment.tokenIs(accountOrRoleID, null, "account_id")) {
							if (accountOrRoleID.content === listOfIds.erisID) return "0";
							return accountOrRoleID.content;
						} else if (environment.tokenIs(accountOrRoleID, null, "role_id")) {
							if (accountOrRoleID.content === listOfIds.erisID) return "0";
							if (accountOrRoleID.content === listOfIds.governmentID) return "-1";
							return accountOrRoleID.content;
						}
					}
					
					// True means it will be an account after substitute() is called
					// False means it will be a role after substitute() is called
					let toBoolean = function (accountOrRoleID) {
						if (environment.tokenIs(accountOrRoleID, null, "account_id")) {
							return true;
						} else if (environment.tokenIs(accountOrRoleID, null, "role_id")) {
							if (accountOrRoleID.content === listOfIds.erisID) return true;
							if (accountOrRoleID.content === listOfIds.governmentID) return true;
							return false;
						}
					}
					
					// Generate the text for the transfer logs
					let toText = function (accountOrRoleID) {
						if (environment.tokenIs(accountOrRoleID, null, "account_id")) {
							return `<@${accountOrRoleID.content}>`;
						} else if (environment.tokenIs(accountOrRoleID, null, "role_id")) {
							if (accountOrRoleID.content === listOfIds.erisID) return `<@&${accountOrRoleID.content}>`;
							if (accountOrRoleID.content === listOfIds.governmentID) return `the government`;
							return `all members with the <@&${accountOrRoleID.content}> role`;
						}
					}
					
					let transfer = function (from, to, time) {
						environment.store.transact(function (value) {
							if (value === null) {
								message.reply(`Syntax error! `);
							} else if (value === false) {
								message.reply(`Their transaction cannot involve bots! `);
							} else if (value === true) {}
						}, time, line[3].content, from, to, message.author.id);
					}
					
					if (toBoolean(line[1]) && toBoolean(line[2])) {
						let time = message.createdTimestamp;
						transfer(substitute(line[1]), substitute(line[2]), message.createdTimestamp);
						time++;
						
						message.reply(`Their transaction is performed successfully. `);
					} else if (toBoolean(line[1]) && !toBoolean(line[2])) {
						let time = message.createdTimestamp;
						message.guild.roles.cache.get(line[2].content).members.forEach(toMember => {
							transfer(substitute(line[1]), toMember.user.id, message.createdTimestamp);
							time++;
						});
						
						message.reply(`Their transactions are performed successfully. `);
					} else if (!toBoolean(line[1]) && toBoolean(line[2])) {
						let time = message.createdTimestamp;
						message.guild.roles.cache.get(line[1].content).members.forEach(fromMember => {
							transfer(fromMember.user.id, substitute(line[2]), message.createdTimestamp);
							time++;
						});
						
						message.reply(`Their transactions are performed successfully. `);
					} else if (!toBoolean(line[1]) && !toBoolean(line[2])) {
						let time = message.createdTimestamp;
						message.guild.roles.cache.get(line[1].content).members.forEach(fromMember => {
							message.guild.roles.cache.get(line[2].content).members.forEach(toMember => {
								transfer(fromMember.user.id, toMember.user.id, message.createdTimestamp);
								time++;
							});
						});
						
						message.reply(`Their transactions are performed successfully. `);
					}
					
					client.channels.cache.get(listOfIds.transferLogs).send(`<@${message.author.id}> has just authorized a transaction of ${line[3].content} DCP from ${toText(line[1])} to ${toText(line[2])}. `);
					if (environment.tokenIs(line[4], null, "string")) {
						client.channels.cache.get(listOfIds.transferLogs).send(`**Reason provided: **${line[4].content}`);
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