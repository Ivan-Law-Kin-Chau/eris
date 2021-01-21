module.exports = {
	fightObjects: [], 
	newFight: function (message, fighters = []) {
		fightObject = {};
		fightObject.notification = {
			"text": null, 
			"timer": 0
		};
		fightObject.inaction = {
			"detected": false, 
			"timer": 0
		};
		fightObject.index = module.exports.fightObjects.length;
		module.exports.fightObjects[module.exports.fightObjects.length] = fightObject;
		(async function () {
			fightObject.message = await message.channel.send("```Loading... ```Attack: ");
			fightObject.fighters = fighters;
			await fightObject.message.react(module.exports.getEmojiByNumber(1));
			await fightObject.message.react(module.exports.getEmojiByNumber(2));
			(module.exports.newEventLoop(fightObject))();
		})();
		return fightObject;
	}, 
	newEventLoop: function (fightObject = {}) {
		eventLoop = async function () {
			fightEnded = false;
			surviver = null;
			for (i = 0; i < fightObject.fighters.length; i++) {
				fightObject.fighters[i].hp = await module.exports.getHP(fightObject.fighters[i].id);
				if (fightObject.fighters[i].hp <= 0) {
					fightEnded = true;
				} else {
					surviver = fightObject.fighters[i].name;
				}
			}
			if (fightEnded === true && surviver !== null) {
				fightObject.message.edit("```The fight has ended and " + surviver + " has won the fight. ```Attack: ");
				module.exports.fightObjects.splice(fightObject.index, 1);
			} else if (fightObject.inaction.detected === true) {
				fightObject.message.edit("```The fight has timed out due to the inaction of everyone in the fight. ```Attack: ");
				module.exports.fightObjects.splice(fightObject.index, 1);
			} else {
				fightObject.message.edit(module.exports.getOutput(fightObject));
				setTimeout(eventLoop, 2000);
			}
		}
		return eventLoop;
	}, 
	trigger: function (index, number, sender) {
		module.exports.fightObjects[index] = fightObject;
		fightObject.inaction.timer = 0;
		senderFound = false;
		for (i = 0; i < fightObject.fighters.length; i++) {
			if (sender === fightObject.fighters[i].id) {
				fightObject.fighters[number - 1].hp -= 1;
				cacheFunctions.cacheHealth(fightObject.fighters[number - 1].id, fightObject.fighters[number - 1].hp, fightObject.message, {
					"type": "all_transaction", 
					"message": null, 
					"killed": true, 
					"from": fightObject.fighters[number - 1].id, 
					"to": sender
				});
				senderFound = true;
			}
		}
		if (senderFound === false) {
			fightObject.notification = {
				"text": "You are not in the fight. ", 
				"timer": 3
			};
		}
	}, 
	getOutput: function (fightObject) {
		output = "```";
		
		if (fightObject.notification.text !== null) {
			output += fightObject.notification.text + "\n\n";
		}
		
		tableMaxLengths = {
			"hp": 2, 
			"calories": 8, 
			"cooldown": 8
		};
		
		for (i = 0; i < fightObject.fighters.length; i++) {
			fightObject.fighters[i].calories = module.exports.getCalories(fightObject.fighters[i].id);
			fightObject.fighters[i].cooldown = module.exports.getCooldown(fightObject.fighters[i].id);
			
			for (property in tableMaxLengths) {
				if (tableMaxLengths[property] < fightObject.fighters[i][property].toString().length) {
					tableMaxLengths[property] = fightObject.fighters[i][property].toString().length;
				}
			}
		}
		
		tableMaxLength = tableMaxLengths.hp + tableMaxLengths.calories + tableMaxLengths.cooldown + 9;
		output += "   HP";
		for (j = 0; j < (tableMaxLengths.hp - 2); j++) output += " ";
		output += " | Calories";
		for (j = 0; j < (tableMaxLengths.calories - 8); j++) output += " ";
		output += " | Cooldown\n";
		for (j = 0; j < tableMaxLength; j++) output += "-";
		
		for (i = 0; i < fightObject.fighters.length; i++) {
			output += "\n[" + (i + 1).toString() + "] " + fightObject.fighters[i].name + "\n";
			for (j = 0; j < tableMaxLength; j++) output += "-";
			output += "\n   " + fightObject.fighters[i].hp;
			for (j = 0; j < (tableMaxLengths.hp - fightObject.fighters[i].hp.toString().length); j++) output += " ";
			output += " | " + fightObject.fighters[i].calories;
			for (j = 0; j < (tableMaxLengths.calories - fightObject.fighters[i].calories.toString().length); j++) output += " ";
			output += " | " + fightObject.fighters[i].cooldown + "\n";
			for (j = 0; j < tableMaxLength; j++) output += "-";
		}
		
		output += "```Attack: ";
		
		if (fightObject.notification.timer > 0) {
			fightObject.notification.timer -= 1;
		} else {
			fightObject.notification.text = null;
		}
		
		fightObject.inaction.timer++;
		if (fightObject.inaction.timer === 30) {
			fightObject.inaction.detected = true;
		}
		return output;
	}, 
	getEmojiByNumber: function (number) {
		return (["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"])[number - 1];
	}, 
	getNumberByEmoji: function (emoji) {
		emojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
		for (i = 0; i < emojis.length; i++) {
			if (emojis[i] === emoji) {
				return (i + 1);
			}
		}
	}, 
	getHP: async function (id) {
		healthCheck = {
			"then": function (resolve) {
				cacheFunctions.checkHealth(id, function (health) {
					resolve(health);
				});
			}
		};
		return await healthCheck;
	}, 
	getCalories: function (id) {
		cacheItem = itemFunctions.newItem({
			"amount": 1, 
			"data": {
				"item": "Energy", 
				"unit": "Calorie", 
				"type": "normal"
			}
		});
		
		currentStore = store.getState();
		for (j = 0; j < currentStore.accounts.length; j++) {
			if (currentStore.accounts[j].id === id) {
				for (k = 0; k < currentStore.accounts[j].inventory.length; k++) {
					compareResults = cacheItem.compare(currentStore.accounts[j].inventory[k].data);
					if (compareResults.identical === true) {
						return currentStore.accounts[j].inventory[k].amount;
					}
				}
			}
		}
		
		return 0;
	}, 
	getCooldown: function (id) {
		return 0;
	}
};