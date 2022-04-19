module.exports = class Environment {
	constructor (store) {
		this.store = store;
		this.contractList = false;
		this.personList = false;
		this.loaded = false;
	}
	
	tokenIs (token, expectedContent = null, expectedType = "string") {
		if (!token) return false;
		if (token.type !== expectedType) return false;
		if (token.content !== expectedContent && expectedContent !== null) return false;
		return true;
	}
	
	loadContracts () {
		const environment = this;
		let contractLibrary = {};
		let contractList = {};
		let personList = {};
		
		environment.store.database.all(`SELECT * FROM contracts`, function (error, rows) {
			for (let i = 0; i < rows.length; i++) {
				const sourceCode = rows[i]["raw_source_code"];
				const parsedScript = require(".\/parse.js").parse(sourceCode).content[0];
				const abstractSyntaxTree = require(".\/evaluate.js")(null, parsedScript.content);
				const timeStamp = rows[i]["time_stamp"];
				contractLibrary[timeStamp] = JSON.stringify(abstractSyntaxTree);
			}
			
			environment.store.database.all(`SELECT * FROM signed_contracts`, function (error, rows) {
				for (let i = 0; i < rows.length; i++) {
					Object.keys(contractLibrary).forEach(contractTimeStamp => {
						if (rows[i]["time_stamp"] === contractTimeStamp) {
							contractList[rows[i]["contract_time_stamp"]] = {
								type: "contract", 
								signatures: {}, 
								content: JSON.parse(contractLibrary[contractTimeStamp])
							};
						}
					});
				}
				
				environment.store.database.all(`SELECT * FROM signed_as`, function (error, rows) {
					const Person = require(".\/person.js");
					for (let i = 0; i < rows.length; i++) {
						Object.keys(contractList).forEach(signTimeStamp => {
							if (rows[i]["time_stamp"] === signTimeStamp) {
								contractList[rows[i]["sign_time_stamp"]].signatures[rows[i]["role"]] = rows[i]["person"];
								if (personList[rows[i]["person"]] === undefined) {
									personList[rows[i]["person"]] = new Person();
								}
							}
						});
					}
					
					environment.contractList = contractList;
					environment.personList = personList;
					environment.loaded = true;
				});
			});
		});
	}
	
	evaluate (client, message, lineContent, sourceCode, listOfIds) {
		console.log(this.contractList);
		console.log(this.personList);
		if (this.tokenIs(lineContent[0], "help") && lineContent.length === 1) {
			message.reply(`Here is the list of available commands: \n**!e help** - See this message. \n**!e time** - See the current time in Discordia. \n**!e balance** - See your current balance. \n**!e budget** - See the government's current balance. \n**!e give {person} {number}** - Send your $D to someone. \n**!e reward {person/role} {number} "{reason (optional)}"** - Send the government's $D to people\\*. \n**!e charge {person/role} {number} "{reason (optional)}"** - Send people's $D to the government\\*. \n**!e print {number}** - Print new $D for the government\\*. \n**!e burn {number}** - Burn depreciated $D held by the government\\*. \n**!e dice {probability of success (from 0 to 100 percent)} "{action}"** - Let fate decide whether an extrajudicial action is successful or not\\*\\*. \n\\* Only for Presidents, Judges, Bankers, Police Officers and Dungeon Masters. \n\\*\\* Only for Dungeon Masters. `);
		} else if (this.tokenIs(lineContent[0], "time") && lineContent.length === 1) {
			let daysElapsed = Math.floor((new Date()).getTime() / 86400000) - 19036;
			let currentTime = {year: 1984 + Math.floor(daysElapsed / 12), month: 0 + (daysElapsed % 12)};
			let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			message.reply(`Discordia is currently in ${months[currentTime.month]}, ${currentTime.year}. `);
		} else if (this.tokenIs(lineContent[0], "balance") && lineContent.length === 1) {
			this.store.getBalance(message.author.id, function (balance) {
				message.reply(`Your balance currently is ${balance} $D. `);
			});
		} else if (this.tokenIs(lineContent[0], "budget") && lineContent.length === 1) {
			this.store.getBalance("-1", function (budget) {
				message.reply(`The government currently has a total of ${budget} $D. `);
			});
		} else if (this.tokenIs(lineContent[0], "give", "action") && lineContent.length === 3) {
			const environment = this;
			if (!environment.tokenIs(lineContent[1], null, "account_id")) {
				message.reply(`Parameter 1 has to ping a user! `);
			} else if (!environment.tokenIs(lineContent[2], null, "integer")) {
				message.reply(`Parameter 2 has to be a number! `);
			} else if (lineContent[2].content < 0) {
				message.reply(`Parameter 2 cannot be less than 0! `);
			} else {
				environment.store.getBalance(message.author.id, function (balance) {
					if (balance - parseInt(lineContent[2].content) < 0) {
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
						}, message.createdTimestamp, lineContent[2].content, message.author.id, lineContent[1].content);
					}
				});
			}
		} else if (this.tokenIs(lineContent[0], "reward") || this.tokenIs(lineContent[0], "charge") && (lineContent.length >= 3 || lineContent.length <= 4)) {
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
			
			if (!this.tokenIs(lineContent[1], null, "account_id") && !this.tokenIs(lineContent[1], null, "role_id")) {
				message.reply(`Parameter 1 has to ping a user or a role! `);
			} else if (!this.tokenIs(lineContent[2], null, "integer")) {
				message.reply(`Parameter 2 has to be a number! `);
			} else if (lineContent[2].content < 0) {
				message.reply(`Parameter 2 cannot be less than 0! `);
			} else {
				const environment = this;
				let rewardOrCharge = function (target, time, noReply = false) {
					if (environment.tokenIs(lineContent[0], "reward")) {
						environment.store.transact(function (value) {
							if (value === null) {
								message.reply(`Syntax error! `);
							} else if (value === false) {
								message.reply(`Bots cannot be rewarded! `);
							} else if (value === true && noReply === false) {
								message.reply(`They are rewarded successfully. `);
								client.channels.cache.get(listOfIds.rewardChargeLogs).send(`<@${message.author.id}> has just rewarded <@${target}> ${lineContent[2].content} $D. `);
								if (environment.tokenIs(lineContent[3], null, "string")) {
									client.channels.cache.get(listOfIds.rewardChargeLogs).send(`**Reason provided: **${lineContent[3].content}`);
								}
							}
						}, time, lineContent[2].content, "-1", target, message.author.id);
					} else if (environment.tokenIs(lineContent[0], "charge")) {
						environment.store.transact(function (value) {
							if (value === null) {
								message.reply(`Syntax error! `);
							} else if (value === false) {
								message.reply(`Bots cannot be charged! `);
							} else if (value === true && noReply === false) {
								message.reply(`They are charged successfully. `);
								client.channels.cache.get(listOfIds.rewardChargeLogs).send(`<@${message.author.id}> has just charged <@${target}> ${lineContent[2].content} $D. `);
								if (environment.tokenIs(lineContent[3], null, "string")) {
									client.channels.cache.get(listOfIds.rewardChargeLogs).send(`**Reason provided: **${lineContent[3].content}`);
								}
							}
						}, time, lineContent[2].content, target, "-1", message.author.id);
					}
				}
				
				if (environment.tokenIs(lineContent[1], null, "account_id")) {
					rewardOrCharge(lineContent[1].content, message.createdTimestamp);
				} else if (environment.tokenIs(lineContent[1], null, "role_id")) {
					let list = [];
					let time = message.createdTimestamp;
					message.guild.roles.cache.get(lineContent[1].content).members.forEach(roleMember => {
						rewardOrCharge(roleMember.user.id, time, true);
						list.push(roleMember.user.id);
						time++;
					});
					
					list = list.join(", ");
					list = list.substring(0, list.length - 2);
					if (environment.tokenIs(lineContent[0], "reward")) {
						message.reply(`Everyone has been rewarded successfully. `);
						client.channels.cache.get(listOfIds.rewardChargeLogs).send(`<@${message.author.id}> has just rewarded all members of the <@&${lineContent[1].content}> role ${lineContent[2].content} $D each. `);
						if (environment.tokenIs(lineContent[3], null, "string")) {
							client.channels.cache.get(listOfIds.rewardChargeLogs).send(`**Reason provided: **${lineContent[3].content}`);
						}
					} else if (environment.tokenIs(lineContent[0], "charge")) {
						message.reply(`Everyone has been charged successfully. `);
						client.channels.cache.get(listOfIds.rewardChargeLogs).send(`<@${message.author.id}> has just charged all members of the <@&${lineContent[1].content}> role ${lineContent[2].content} $D each. `);
						if (environment.tokenIs(lineContent[3], null, "string")) {
							client.channels.cache.get(listOfIds.rewardChargeLogs).send(`**Reason provided: **${lineContent[3].content}`);
						}
					}
				}
			}
		} else if (this.tokenIs(lineContent[0], "print") || this.tokenIs(lineContent[0], "burn") && lineContent.length === 2) {
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
			
			if (!this.tokenIs(lineContent[1], null, "integer")) {
				message.reply(`Parameter 1 has to be a number! `);
			} else if (lineContent[1].content < 0) {
				message.reply(`Parameter 1 cannot be less than 0! `);
			} else {
				if (this.tokenIs(lineContent[0], "print")) {
					this.store.transact(function (value) {
						message.reply(`You have printed ${lineContent[1].content} $D. `);
					}, message.createdTimestamp, lineContent[1].content, "0", "-1", message.author.id);
				} else if (this.tokenIs(lineContent[0], "burn")) {
					this.store.transact(function (value) {
						message.reply(`You have burnt ${lineContent[1].content} $D. `);
					}, message.createdTimestamp, lineContent[1].content, "-1", "0", message.author.id);
				}
			}
		} else if (this.tokenIs(lineContent[0], "dice") && lineContent.length === 3) {
			if (message.guild.id === listOfIds.rootServer) {
				let authorized = false;
				message.guild.roles.cache.get(listOfIds.fiscalAuthorizers.dungeonMaster).members.forEach(roleMember => {
					if (roleMember.user.id === message.author.id) authorized = true;
				});
				
				if (authorized === false) {
					message.reply(`Access denied! `);
				} else if (authorized === true) {
					if (!this.tokenIs(lineContent[1], null, "integer")) {
						message.reply(`Parameter 1 has to be a number! `);
					} else if (lineContent[1].content < 0) {
						message.reply(`Parameter 1 cannot be less than 0! `);
					} else if (lineContent[1].content > 100) {
						message.reply(`Parameter 1 cannot be more than 100! `);
					} else if (!this.tokenIs(lineContent[2], null)) {
						message.reply(`Parameter 2 has to be a string! `);
					} else if (Math.random() * 100 >= lineContent[1].content) {
						message.reply(`The attempt to ${lineContent[2].content} is unsuccessful. `);
					} else {
						message.reply(`The attempt to ${lineContent[2].content} is successful. `);
					}
				}
			} else {
				message.reply(`Server not recognized! `);
			}
		} else if (this.tokenIs(lineContent[0], "make", "command") && this.tokenIs(lineContent[1], "contract", "keyword") && lineContent.length === 4) {
			if (!this.tokenIs(lineContent[2], null)) {
				message.reply(`Parameter 2 has to be a string! `);
			} else {
				const abstractSyntaxTree = require(".\/evaluate.js")(message, lineContent);
				if (abstractSyntaxTree !== false) {
					const environment = this;
					environment.store.database.all(`SELECT * FROM contracts WHERE name = "${lineContent[2].content}"`, function (error, rows) {
						if (rows.length > 0) {
							message.reply(`A contract with the same name already exists! `);
						} else {
							environment.store.database.run(`INSERT INTO contracts VALUES (
								"${message.createdTimestamp}", 
								"${lineContent[2].content}", 
								"${message.author.id}", 
								"${message.content.split("\"").join("\"\"")}"
							)`);
							message.reply(`You made the contract successfully. `);
						}
					});
				}
			}
		} else if (this.tokenIs(lineContent[0], "view", "command") && this.tokenIs(lineContent[1], "contract", "keyword") && lineContent.length === 3) {
			if (!this.tokenIs(lineContent[2], null)) {
				message.reply(`Parameter 2 has to be a string! `);
			} else {
				this.store.database.all(`SELECT * FROM contracts WHERE name = "${lineContent[2].content}"`, function (error, rows) {
					if (rows.length <= 0) {
						message.reply(`A contract with this name could not be found! `);
					} else {
						const sourceCode = rows[0]["raw_source_code"];
						const parsedScript = require(".\/parse.js").parse(sourceCode).content[0];
						const abstractSyntaxTree = require(".\/evaluate.js")(message, parsedScript.content);
						message.reply(`Here is the contract's raw source code: \n\`\`\`${sourceCode}\`\`\``);
						console.log(rows[0]["author"], JSON.stringify(abstractSyntaxTree, "\t", 4));
					}
				});
			}
		} else if (this.tokenIs(lineContent[0], "destroy", "command") && this.tokenIs(lineContent[1], "contract", "keyword") && lineContent.length === 3) {
			if (!this.tokenIs(lineContent[2], null)) {
				message.reply(`Parameter 2 has to be a string! `);
			} else {
				const environment = this;
				environment.store.database.all(`SELECT * FROM contracts WHERE name = "${lineContent[2].content}"`, function (error, rows) {
					if (rows.length <= 0) {
						message.reply(`A contract with this name could not be found! `);
					} else {
						environment.store.database.run(`DELETE FROM contracts WHERE name = "${lineContent[2].content}"`);
						message.reply(`You destroyed the contract successfully. `);
					}
				});
			}
		} else if (this.tokenIs(lineContent[0], "sign", "command") && this.tokenIs(lineContent[1], "contract", "keyword") && this.tokenIs(lineContent[3], "as", "keyword") && lineContent.length === 5) {
			if (!this.tokenIs(lineContent[2], null)) {
				message.reply(`Parameter 2 has to be a string! `);
			} else if (!this.tokenIs(lineContent[4], null)) {
				message.reply(`Parameter 4 has to be a string! `);
			} else {
				const environment = this;
				environment.store.database.all(`SELECT * FROM contracts WHERE name = "${lineContent[2].content}"`, function (error, rows) {
					if (rows.length <= 0) {
						message.reply(`A contract with this name could not be found! `);
					} else {
						message.reply(`Command coming soon. `);
						const sourceCode = rows[0]["raw_source_code"];
						const parsedScript = require(".\/parse.js").parse(sourceCode).content[0];
						const abstractSyntaxTree = require(".\/evaluate.js")(message, parsedScript.content);
						
						const Contract = require(".\/contract.js");
						const contractInstance = new Contract(message, abstractSyntaxTree, sourceCode, listOfIds, rows[0]["author"], environment.store);
						
						if (contractInstance.setAs(message.author.id, lineContent[4].content) === true && 
							contractInstance.setConsent(message.author.id, lineContent[4].content) === true) {
								contractInstance.canSignContract().then(function (value) {
									let accountIdList = [];
									contractInstance.personList.forEach(person => {
										if (accountIdList.indexOf(`<@${person.accountId}>`) === -1) {
											accountIdList.push(`<@${person.accountId}>`);
										}
									});
									message.reply(`${accountIdList.join(" ")} Congratulations, the contract has been signed successfully. `);
								}, function (error) {
									if (error.type === undefined) {
										message.reply("Access denied. ");
									} else if (error.type === "error") {
										message.reply("Access denied. Output logs: \n```" + error + "```");
									}
								});
						} else {
							message.reply(`You cannot set yourself as this role in this contract. `);
						}
					}
				});
			}
		} else if (this.tokenIs(lineContent[0], "cancel", "command") && this.tokenIs(lineContent[1], "contract", "keyword") && this.tokenIs(lineContent[3], "as", "keyword") && lineContent.length === 5) {
			if (!this.tokenIs(lineContent[2], null)) {
				message.reply(`Parameter 2 has to be a string! `);
			} else if (!this.tokenIs(lineContent[4], null)) {
				message.reply(`Parameter 4 has to be a string! `);
			} else {
				this.store.database.all(`SELECT * FROM contracts WHERE name = "${lineContent[2].content}"`, function (error, rows) {
					if (rows.length <= 0) {
						message.reply(`A contract with this name could not be found! `);
					} else {
						message.reply(`Command coming soon. `);
					}
				});
			}
		} else {
			message.reply(`Command not recognized! `);
		}
	}
};