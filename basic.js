module.exports = {
	execute: function (message) {
		arguments = parseFunctions.parseCommand(message.content);
		if (arguments[0] === "!e") {
			if (module.exports[arguments[1]]) {
				if (arguments.length < module.exports[arguments[1]].minimumArguments) {
					message.channel.send("Error: Too few arguments");
				} else if (arguments.length > module.exports[arguments[1]].maximumArguments) {
					message.channel.send("Error: Too many arguments");
				} else if (arguments[1] === "execute") {
					message.channel.send("Error: Command not found");
				} else {
					try {
						errorManager = {
							errorCaught: false, 
							errorLogger: function (message, errorCaught) {
								if (errorCaught === false) {
									message.channel.send("Error: Fatal error");
								}
							}
						}, 
						module.exports[arguments[1]].execute(message, arguments, errorManager);
					} catch (error) {
						console.log(error);
						if (errorManager.errorCaught === false) {
							message.channel.send("Error: Fatal error");
						}
					}
				}
			} else {
				message.channel.send("Error: Command not found");
			}
		}
	}, 
	help: {
		minimumArguments: 2, 
		maximumArguments: 3, 
		execute: function (message, arguments, errorManager) {
			if (arguments.length === 2) {
				message.channel.send(new (require("discord.js")).MessageEmbed().setColor("#688ada").setTitle("List of Commands").setDescription("**Basic Commands**\n   - **!e help** - Display the list of commands\n   - **!e help advanced** - Display the list of commands (advanced), which is for enterprise usage or for the Dungeon Master\n   - **!e time** - Get the current time in Discordia\n   - **!e health** - Check how many HP you have\n   - **!e respawn** - Respawn if you died\n   - **!e dia pesos** - Claim your Dia Pesos\n   - **!e farm \"Grant, New Mexico\"** - Farm in a county where you have Exclusive Farming Rights to get grains\n\n**Using the Items that You Already Have**\n   - **!e inventory** - View your item inventory\n   - **!e give <@388283764322729984> 123 [**number**]** - Give items to another citizen\n   - **!e eat [**number**]** - Eat a food item to get more HP"));
			} else if (arguments[2] === "advanced") {
				message.channel.send(new (require("discord.js")).MessageEmbed().setColor("#688ada").setTitle("List of Commands (Advanced)").setDescription("**Getting More Items and Getting Rid of Them**\n   - **!e import [**DCP/item**]** - Import items from the overseas\n   - **!e export [**DCP/item**]** - Export items to the overseas\n   - **!e pack 100x3 [**DCP/item**]** - Pack 100 calories into a food item, times 3 times\n   - **!e unpack 100x3 [**DCP/item**]** - Unpack 100 calories from a food item, times 3 times\n\n**Syntax for [DCP/Items]**\nThe standard syntax has 3 arguments: **[**amount**]** **[**unit**]** **[**item**]**. For example... \n   - **1 Loaf Bread** - Item with unit\n   - **1 Cake** - Item without unit\n   - **123 Peso DCP** - DCP is treated like any other item\n   - **1 Ton \"Mongolian Iron\"** - If an argument contains spaces, delimit it with brackets (for more complex delimitation than that, use standard JavaScript delimitation rules)\n\n**Dungeon Master Only Commands**\n   - **!e attempt 0.2 \"assassinate the president\"** - Determine whether or not an attempt to perform an action outside the limits of the constitution and laws is successful"));
			}
		}
	}, 
	time: {
		minimumArguments: 2, 
		maximumArguments: 2, 
		execute: function (message, arguments, errorManager) {
			message.channel.send(new (require("discord.js")).MessageEmbed().setColor("#688ada").setDescription("The current time in Discordia is " + timeFunctions.getTime() + ". ").setFooter("Until an official time zone is set, all times are denoted in the Eastern Standard Time (EST). "));
		}
	}, 
	give: {
		minimumArguments: 5, 
		maximumArguments: 5, 
		execute: function (message, arguments, errorManager) {
			currentStore = store.getState();
			for (i = 0; i < currentStore.accounts.length; i++) {
				if (currentStore.accounts[i].id === message.author.id) {
					try {
						itemObject = currentStore.accounts[i].inventory[parseInt(arguments[4].substring(1, arguments[4].length - 1)) - 1];
						data = itemObject.data;
					} catch (error) {
						message.channel.send("Error: Item not found");
						errorManager.errorCaught = true;
					}
				}
			}
			store.dispatch({
				"type": "transaction", 
				"message": message, 
				"transaction": {
					"from": message.author.id, 
					"to": message.mentions.users.first().id, 
					"amount": parseInt(arguments[3]), 
					"data": data
				}
			});
		}
	}, 
	import: {
		minimumArguments: 4, 
		maximumArguments: 5, 
		execute: function (message, arguments, errorManager) {
			item = "DCP";
			unit = "Peso";
			if (arguments.length === 5) {
				item = arguments[4];
				unit = arguments[3];
			} else if (arguments.length === 4) {
				item = arguments[3];
				unit = null;
			}
			store.dispatch({
				"type": "transaction", 
				"message": message, 
				"transaction": {
					"from": "-1", 
					"to": message.author.id, 
					"amount": parseInt(arguments[2]), 
					"data": {
						"item": item, 
						"unit": unit
					}
				}
			});
		}
	}, 
	export: {
		minimumArguments: 4, 
		maximumArguments: 5, 
		execute: function (message, arguments, errorManager) {
			item = "DCP";
			unit = "Peso";
			if (arguments.length === 5) {
				item = arguments[4];
				unit = arguments[3];
			} else if (arguments.length === 4) {
				item = arguments[3];
				unit = null;
			}
			store.dispatch({
				"type": "transaction", 
				"message": message, 
				"transaction": {
					"from": message.author.id, 
					"to": "-1", 
					"amount": parseInt(arguments[2]), 
					"data": {
						"item": item, 
						"unit": unit
					}
				}
			});
		}
	}, 
	inventory: {
		minimumArguments: 2, 
		maximumArguments: 2, 
		execute: function (message, arguments, errorManager) {
			inventoryIsEmpty = true;
			report = "you have the following items in your inventory: ";
			currentStore = store.getState();
			for (i = 0; i < currentStore.accounts.length; i++) {
				if (currentStore.accounts[i].id === message.author.id) {
					for (j = 0; j < currentStore.accounts[i].inventory.length; j++) {
						report += "\n   **[" + (j + 1).toString() + "]** " + itemFunctions.stringify(currentStore.accounts[i].inventory[j]);
						inventoryIsEmpty = false;
					}
				}
			}
			report += "\nYou can now issue commands using the **[**number**]** from the list above. ";
			if (inventoryIsEmpty === true) {
				report = "you have nothing in your inventory. ";
			}
			message.reply(report);
		}
	}, 
	dia: {
		minimumArguments: 3, 
		maximumArguments: 3, 
		execute: function (message, arguments, errorManager) {
			if (arguments[2] === "pesos") {
				cacheFunctions.checkDiaPesos(message.author.id, function (allowed) {
					if (allowed === true) {
						cacheFunctions.cacheDiaPesos(message.author.id);
						store.dispatch({
							"type": "transaction", 
							"message": message, 
							"transaction": {
								"from": "0", 
								"to": message.author.id, 
								"amount": 10, 
								"data": {
									"item": "DCP", 
									"unit": "Peso"
								}, 
								"reply": "you received your Dia Pesos. "
							}
						});
					} else {
						message.reply("you have already received your Dia Pesos earlier today. ");
					}
				});
			}
		}
	}, 
	farm: {
		minimumArguments: 3, 
		maximumArguments: 3, 
		execute: function (message, arguments, errorManager) {
			exclusiveFarmingRights = false;
			currentStore = store.getState();
			for (i = 0; i < currentStore.accounts.length; i++) {
				if (currentStore.accounts[i].id === message.author.id) {
					for (j = 0; j < currentStore.accounts[i].inventory.length; j++) {
						if (currentStore.accounts[i].inventory[j].data.type === "farm") {
							if (currentStore.accounts[i].inventory[j].data.item === "Exclusive Farming Rights") {
								if (currentStore.accounts[i].inventory[j].data.county + ", " + currentStore.accounts[i].inventory[j].data.state === arguments[2]) {
									exclusiveFarmingRights = true;
								}
							}
						}
					}
				}
			}
			
			if (exclusiveFarmingRights === true) {
				county = arguments[2].split(", ")[0];
				state = arguments[2].split(", ")[1];
				cacheFunctions.checkFarm(state, county, function (allowed) {
					if (allowed === true) {
						foodFunctions.generateHarvest(state, county, function (yield) {
							if (yield !== null) {
								cacheFunctions.cacheFarm(state, county);
								store.dispatch({
									"type": "transaction", 
									"message": message, 
									"bypass": true, 
									"transaction": {
										"from": "-1", 
										"to": message.author.id, 
										"amount": yield.value, 
										"data": {
											"item": "Crop", 
											"unit": "Grain", 
											"type": "food", 
											"calorie": 1
										}, 
										"reply": "you made " + yield.name + " today. "
									}
								});
							} else {
								message.reply("this county does not have any fertile farmland. ");
							}
						});
					} else {
						message.reply("someone have already farmed in this county earlier today. ");
					}
				});
			} else {
				message.reply("you do not have the Exclusive Farming Rights to farm in this county. ");
			}
		}
	}, 
	fight: {
		minimumArguments: 3, 
		maximumArguments: 3, 
		execute: function (message, arguments, errorManager) {
			if (message.author.id !== message.mentions.users.first().id) {
				message.guild.members.fetch(message.mentions.users.first().id).then(function (users) {
					fightFunctions.newFight(message, [
						{
							"id": message.author.id, 
							"name": message.member.displayName
						}, 
						{
							"id": message.mentions.users.first().id, 
							"name": users.displayName
						}
					]);
				});
			} else {
				message.reply("you cannot fight yourself. ");
			}
		}
	}, 
	suicide: {
		minimumArguments: 2, 
		maximumArguments: 2, 
		execute: function (message, arguments, errorManager) {
			message.guild.members.fetch(message.author.id).then(function (users) {
				cacheFunctions.checkHealth(message.author.id, function (health) {
					if (health > 0) {
						suppressedRoles = users._roles;
						users.roles.add(deadRole);
						for (i = 0; i < suppressedRoles.length; i++) {
							users.roles.remove(suppressedRoles[i]);
						}
						cacheFunctions.cacheHealth(message.author.id, 0);
						cacheFunctions.cacheSuppressedRoles(message.author.id, suppressedRoles);
						client.channels.cache.get(deadChannel).send("**<@" + message.author.id + ">** has just suicided. ");
					} else {
						message.reply("you are not alive, so you cannot suicide. ");
					}
				});
			});
		}
	}, 
	respawn: {
		minimumArguments: 2, 
		maximumArguments: 2, 
		execute: function (message, arguments, errorManager) {
			message.guild.members.fetch(message.author.id).then(function (users) {
				cacheFunctions.checkHealth(message.author.id, function (health) {
					if (health <= 0) {
						cacheFunctions.checkSuppressedRoles(message.author.id, function (suppressedRoles) {
							for (i = 0; i < suppressedRoles.length; i++) {
								users.roles.add(suppressedRoles[i]);
							}
							users.roles.remove(deadRole);
							cacheFunctions.cacheHealth(message.author.id, 1);
							client.channels.cache.get(deadChannel).send("**<@" + message.author.id + ">** has just respawned. ");
						});
					} else {
						message.reply("you are not dead, so you cannot respawn. ");
					}
				});
			});
		}
	}, 
	health: {
		minimumArguments: 2, 
		maximumArguments: 2, 
		execute: function (message, arguments, errorManager) {
			cacheFunctions.checkHealth(message.author.id, function (health) {
				message.reply("your current health is " + health + " HP. ");
			});
		}
	}, 
	eat: {
		minimumArguments: 3, 
		maximumArguments: 3, 
		execute: function (message, arguments, errorManager) {
			currentStore = store.getState();
			for (i = 0; i < currentStore.accounts.length; i++) {
				if (currentStore.accounts[i].id === message.author.id) {
					try {
						itemObject = currentStore.accounts[i].inventory[parseInt(arguments[2].substring(1, arguments[2].length - 1)) - 1];
						data = itemObject.data;
					} catch (error) {
						message.channel.send("Error: Item not found");
						errorManager.errorCaught = true;
					}
				}
			}
			if (data.type === "food") {
				store.dispatch({
					"type": "transaction", 
					"message": message, 
					"bypass": true, 
					"transaction": {
						"from": message.author.id, 
						"to": "-1", 
						"amount": 1, 
						"data": data, 
						"reply": "you have eaten one of your " + itemFunctions.stringify(itemObject) + ". "
					}
				});
				cacheFunctions.checkHealth(message.author.id, function (health) {
					cacheFunctions.cacheHealth(message.author.id, parseInt(health) + data.calorie);
				});
			} else {
				message.channel.send("Error: Item is not food item");
			}
		}
	}, 
	pack: {
		minimumArguments: 4, 
		maximumArguments: 5, 
		execute: function (message, arguments, errorManager) {
			calorie = parseInt(arguments[2].split("x")[0]);
			if (calorie > 0) {
				if (arguments[2].split("x").length === 2) {
					amount = parseInt(arguments[2].split("x")[1]);
					if (arguments.length === 4) {
						data = {
							"item": arguments[3], 
							"unit": null, 
							"type": "food", 
							"calorie": calorie
						};
					} else if (arguments.length === 5) {
						data = {
							"item": arguments[4], 
							"unit": arguments[3], 
							"type": "food", 
							"calorie": calorie
						};
					}
					store.dispatch({
						"type": "multi_transaction", 
						"message": message, 
						"transactions": [
							{
								"type": "transaction", 
								"bypass": true, 
								"transaction": {
									"from": message.author.id, 
									"to": "-1", 
									"amount": calorie * amount, 
									"data": {
										"item": "Energy", 
										"unit": "Calorie"
									}, 
									"reply": null
								}
							}, 
							{
								"type": "transaction", 
								"bypass": true, 
								"transaction": {
									"from": "-1", 
									"to": message.author.id, 
									"amount": amount, 
									"data": data, 
									"reply": "you packed your food. "
								}
							}
						]
					});
				} else {
					message.channel.send("Error: Syntax error");
				}
			} else {
				message.channel.send("Error: Amount must be positive integer");
			}
		}
	}, 
	unpack: {
		minimumArguments: 4, 
		maximumArguments: 5, 
		execute: function (message, arguments, errorManager) {
			calorie = parseInt(arguments[2].split("x")[0]);
			if (arguments[2].split("x").length === 2) {
				amount = parseInt(arguments[2].split("x")[1]);
				if (arguments.length === 4) {
					data = {
						"item": arguments[3], 
						"unit": null, 
						"type": "food", 
						"calorie": calorie
					};
				} else if (arguments.length === 5) {
					data = {
						"item": arguments[4], 
						"unit": arguments[3], 
						"type": "food", 
						"calorie": calorie
					};
				}
				store.dispatch({
					"type": "multi_transaction", 
					"message": message, 
					"transactions": [
						{
							"type": "transaction", 
							"bypass": true, 
							"transaction": {
								"from": message.author.id, 
								"to": "-1", 
								"amount": amount, 
								"data": data, 
								"reply": null
							}
						}, 
						{
							"type": "transaction", 
							"bypass": true, 
							"transaction": {
								"from": "-1", 
								"to": message.author.id, 
								"amount": calorie * amount, 
								"data": {
									"item": "Energy", 
									"unit": "Calorie"
								}, 
								"reply": "you unpacked your food. "
							}
						}
					]
				});
			} else {
				message.channel.send("Error: Syntax error");
			}
		}
	}, 
	attempt: {
		minimumArguments: 4, 
		maximumArguments: 4, 
		execute: function (message, arguments, errorManager) {
			if (message.author.id === masterID) {
				probability = parseFloat(arguments[2]);
				if (probability > Math.random()) {
					message.channel.send("The attempt to " + arguments[3] + " is successful. ");
				} else {
					message.channel.send("The attempt to " + arguments[3] + " is not successful. ");
				}
			} else {
				message.channel.send("Error: Access denied");
			}
		}
	}
};