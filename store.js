module.exports = {
	transfer: function (state = {}, action) {
		if (!(action.message)) {
			action.message = false;
		}
		
		if (!(action.transaction.time)) {
			action.transaction.time = null;
		}
		
		if (!(action.transaction.data.type)) {
			action.transaction.data.type = "normal";
		}
		
		cacheItem = itemFunctions.newItem({
			"amount": action.transaction.amount, 
			"data": action.transaction.data
		});
		
		state.accounts[0].inventory[0] = {
			"amount": action.transaction.amount, 
			"data": action.transaction.data
		};
		
		fromIndex = null;
		fromItemUnitIndex = null;
		fromHasAmount = false;
		toIndex = null;
		toItemUnitIndex = null;
		
		for (account = 0; account < state.accounts.length; account++) {
			if (action.transaction.from === state.accounts[account].id && state.accounts[account].disabled === false) {
				fromIndex = account;
				for (i = 0; i < state.accounts[account].inventory.length; i++) {
					compareResults = cacheItem.compare(state.accounts[account].inventory[i].data);
					if (compareResults.identical === true) {
						fromItemUnitIndex = i;
						if (state.accounts[account].inventory[i].amount >= action.transaction.amount) {
							fromHasAmount = true;
						}
						break;
					}
				}
			}
		}
		
		for (account = 0; account < state.accounts.length; account++) {
			if (action.transaction.to === state.accounts[account].id && state.accounts[account].disabled === false) {
				toIndex = account;
				for (i = 0; i < state.accounts[account].inventory.length; i++) {
					compareResults = cacheItem.compare(state.accounts[account].inventory[i].data);
					if (compareResults.identical === true) {
						toItemUnitIndex = i;
						break;
					}
				}
			}
		}
		
		if ((action.transaction.from === "-1" || action.transaction.to === "-1") && ((action.transaction.data.type !== "normal" || action.transaction.data.item === "DCP" || action.transaction.data.item === "Energy") && !(action.bypass === true))) {
			isSuccessful = false;
			returnMessage = "Error: Access denied";
			return [state, isSuccessful, returnMessage];
		} else if (!(action.transaction.amount > 0)) {
			isSuccessful = false;
			returnMessage = "Error: Amount must be positive integer";
			return [state, isSuccessful, returnMessage];
		}
		
		if (toIndex !== null && toItemUnitIndex === null) {
			toItemUnitIndex = state.accounts[toIndex].inventory.length;
			state.accounts[toIndex].inventory[toItemUnitIndex] = {
				"amount": 0, 
				"data": action.transaction.data
			};
		}
		
		if (fromIndex !== null && fromItemUnitIndex !== null && fromHasAmount === true && toIndex !== null && toItemUnitIndex !== null) {
			state.accounts[fromIndex].inventory[fromItemUnitIndex].amount -= action.transaction.amount;
			state.accounts[toIndex].inventory[toItemUnitIndex].amount += action.transaction.amount;
			if (state.accounts[fromIndex].inventory[fromItemUnitIndex].amount === 0) {
				state.accounts[fromIndex].inventory.splice(fromItemUnitIndex, 1);
			}
			
			if (action.transaction.time === null) {
				action.transaction.time = timeFunctions.getTime("JSON");
			}
			
			state.transactions[state.transactions.length] = {
				"time": action.transaction.time, 
				"from": action.transaction.from, 
				"to": action.transaction.to, 
				"amount": action.transaction.amount, 
				"data": action.transaction.data
			}
			
			state.accounts[0].inventory = [];
			require("fs").writeFileSync(".\/database.json", JSON.stringify(state, null, "\t"));
			
			isSuccessful = true;
			if (action.transaction.reply) {
				returnMessage = action.transaction.reply;
			} else if (action.transaction.reply !== null) {
				returnMessage = "your transaction is completed successfully. ";
			} else {
				returnMessage = null;
			}
			
			// Callback to add health after taking out the food from an account that has eaten, or other functions
			if (action.callback) {
				action.callback(action);
			}
		} else {
			isSuccessful = false;
			if (fromIndex === null) {
				returnMessage = "Error: Sender not found";
			} else if (fromItemUnitIndex === null) {
				returnMessage = "Error: Sender does not have item with specific unit";
			} else if (fromHasAmount === false) {
				returnMessage = "Error: Amount exceeded sender balance";
			} else if (toIndex === null) {
				returnMessage = "Error: Receiver not found";
			} else if (toItemUnitIndex === null) {
				returnMessage = "Error: Receiver does not have item with specific unit";
			} else {
				returnMessage = "Error: Unknown error";
			}
		}
		
		state.accounts[0].inventory = [];
		return [state, isSuccessful, returnMessage];
	}, 
	transferAll: function (state = {}, fromStateAccountsIndex, toStateAccountsIndex, killed) {
		originalLength = state.accounts[fromStateAccountsIndex].inventory.length;
		for (originalStateIndex = 0; originalStateIndex < originalLength; originalStateIndex++) {
			// If you died from a fight, all your weapons will be destroyed, which provides a way from weapons to leave the market, preventing people from hoarding weapons endlessly and saturating the market with weapons, which will drive its price too low
			if (state.accounts[fromStateAccountsIndex].inventory[0].data.type === "weapon") {
				toIndex = "-1";
			} else {
				toIndex = state.accounts[toStateAccountsIndex].id;
			}
			state = module.exports.transfer(state, {
				"type": "transaction", 
				"bypass": true, 
				"transaction": {
					"from": state.accounts[fromStateAccountsIndex].id, 
					"to": toIndex, 
					"amount": state.accounts[fromStateAccountsIndex].inventory[0].amount, 
					"data": state.accounts[fromStateAccountsIndex].inventory[0].data
				}
			})[0];
		}
		return state;
	}, 
	handler: function (state = {}, action) {
		if (!(action.message)) {
			action.message = false;
		}
		
		if (action.type === "initialize") {
			state = require(".\/database.json");
			return state;
		} else if (action.type === "update") {
			previousStateSnapshot = JSON.stringify(state, null, "\t");
			
			// Expect an array containing all current accounts in Discordia, with each element being [id, username, discriminator]
			toBeRemoved = [];
			for (i = 0; i < state.accounts.length; i++) {
				accountExists = false;
				for (j = 0; j < action.current.length; j++) {
					if (action.current[j][0] === state.accounts[i].id) {
						accountExists = true;
					}
				}
				if (accountExists === false && state.accounts[i].id !== "0" && state.accounts[i].id !== "-1" && state.accounts[i].disabled === false) {
					toBeRemoved[toBeRemoved.length] = state.accounts[i];
					console.log(state.accounts[i].username + "#" + state.accounts[i].discriminator + " is going to be removed. ");
				}
			}
			
			for (i = 0; i < toBeRemoved.length; i++) {
				for (j = 0; j < state.accounts.length; j++) {
					if (toBeRemoved[i].id === state.accounts[j].id) {
						// Transfer the inventory to the government
						state = module.exports.transferAll(state, j, 1);
						state.accounts[j].disabled = true;
					}
				}
			}
			
			toBeAdded = [];
			for (i = 0 ; i < action.current.length; i++) {
				accountExists = false;
				for (j = 0; j < state.accounts.length; j++) {
					if (state.accounts[j].id === action.current[i][0]) {
						accountExists = true;
						if (state.accounts[j].disabled === true) {
							state.accounts[j].disabled = false;
						}
					}
				}
				if (accountExists === false) {
					toBeAdded[toBeAdded.length] = action.current[i];
					console.log(action.current[i][1] + "#" + action.current[i][2] + " is going to be added. ");
				}
			}
			
			for (i = 0 ; i < toBeAdded.length; i++) {
				state.accounts[state.accounts.length] = {
					"id": toBeAdded[i][0], 
					"username": toBeAdded[i][1], 
					"discriminator": toBeAdded[i][2], 
					"inventory": [], 
					"disabled": false
				};
			}
			
			currentStateSnapshot = JSON.stringify(state, null, "\t");
			if (previousStateSnapshot !== currentStateSnapshot) {
				require("fs").writeFileSync(".\/database.json", currentStateSnapshot);
			}
			
			return state;
		} else if (action.type === "transaction") {
			results = module.exports.transfer(state, action);
			if (results[2] !== null) {
				if (results[1] === true) {
					action.message.reply(results[2]);
				} else if (results[1] === false) {
					action.message.channel.send(results[2]);
				}
			}
			state = results[0];
			return state;
		} else if (action.type === "multi_transaction") {
			isSuccessful = false;
			returnMessage = null;
			for (i = 0; i < action.transactions.length; i++) {
				results = module.exports.transfer(state, action.transactions[i]);
				if (results[2] !== null) {
					returnMessage = results[2];
				}
				if (results[1] === true) {
					isSuccessful = true;
					state = results[0];
				} else if (results[1] === false) {
					isSuccessful = false;
					break;
				}
			}
			if (isSuccessful === true) {
				action.message.reply(returnMessage);
			} else if (isSuccessful === false) {
				action.message.channel.send(returnMessage);
			}
			return state;
		} else if (action.type === "all_transaction") {
			if (action.killed !== true) {
				action.killed = false;
			}
			fromIndex = null;
			toIndex = null;
			for (i = 0; i < state.accounts.length; i++) {
				if (action.from === state.accounts[i].id) {
					fromIndex = i;
				}
				if (action.to === state.accounts[i].id) {
					toIndex = i;
				}
			}
			if (fromIndex !== null) {
				if (toIndex !== null) {
					state = module.exports.transferAll(state, fromIndex, toIndex, action.killed);
					return state;
				} else if (action.message !== null) {
					action.message.channel.send("Error: Receiver not found");
					return state;
				}
			} else if (action.message !== null) {
				action.message.channel.send("Error: Sender not found");
				return state;
			}
		}
	}
};