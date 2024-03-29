module.exports = {
	database: new (require("sqlite3").verbose()).Database("database.db"), 
	userList: null, 
	setUserList: function (userList = null) {
		module.exports.userList = userList;
	}, 
	getBalance: function (userId, callback, name = "DCP") {
		module.exports.database.all(`SELECT * FROM transactions WHERE name = "${name}" AND (agent = "${userId}" OR receiver = "${userId}")`, function (error, rows) {
			let balance = 0;
			for (let i = 0; i < rows.length; i++) {
				if (rows[i]["agent"] === userId) balance -= rows[i]["amount"];
				if (rows[i]["receiver"] === userId) balance += rows[i]["amount"];
			}
			callback(balance);
		});
	}, 
	automaticallyTransact: function (client, listOfIds) {
		const currentTime = Math.floor((new Date()).getTime());
		const convertToText = id => {
			if (id === "-1") return `<@&${listOfIds.governmentID}>`;
			if (id === "0") return `<@${listOfIds.erisID}>`;
			return `<@${id}>`;
		};
		
		module.exports.database.all(`SELECT * FROM schedules ORDER BY last_updated DESC`, function (error, rows) {
			for (let i = 0; i < rows.length; i++) {
				const recordTime = parseInt(rows[i]["minimum_time_stamp"]) + (parseInt(rows[i]["cycle_length"]) * rows[i]["current_x"]);
				let requiredIterations = Math.floor((currentTime - recordTime) / parseInt(rows[i]["cycle_length"]));
				let totalIterations = Math.floor((parseInt(rows[i]["maximum_time_stamp"]) - parseInt(rows[i]["minimum_time_stamp"])) / parseInt(rows[i]["cycle_length"]));
				if (rows[i]["current_x"] + requiredIterations > totalIterations) {
					requiredIterations -= (rows[i]["current_x"] + requiredIterations) - totalIterations;
				}
				
				if (requiredIterations > 0) {
					let x = rows[i]["current_x"];
					let totalAmount = 0;
					for (let j = 0; j < requiredIterations; j++) {
						totalAmount += parseInt(eval(rows[i]["amount"]));
						x++;
					}
					
					module.exports.database.all(`UPDATE schedules SET current_x = ${x}, last_updated = "${currentTime}" WHERE minimum_time_stamp = "${rows[i]["minimum_time_stamp"]}" AND maximum_time_stamp = "${rows[i]["maximum_time_stamp"]}" AND cycle_length = "${rows[i]["cycle_length"]}"`, function (error) {
						if (error === null) module.exports.transact(function (value) {
							if (value === true) {
								client.channels.cache.get(listOfIds.transferLogs).send(`${convertToText(rows[i]["agent"])} has just transferred ${rows[i]["amount"]} DCP to ${convertToText(rows[i]["receiver"])}, for ${requiredIterations} time${requiredIterations > 1 ? "s" : ""}, due to an automated schedule. `);
								client.channels.cache.get(listOfIds.transferLogs).send(`**Reason provided: **${rows[i]["reason"]}`);
							}
						}, currentTime.toString(), totalAmount, rows[i]["agent"], rows[i]["receiver"], rows[i]["authorizer"], rows[i]["name"], true);
					});
					
					break;
				}
			}
		});
	}, 
	transact: function (callback, timeStamp, amount, agent, receiver, authorizer = null, name = "DCP", isAutomated = false) {
		for (let i = 0; i < module.exports.userList.length; i++) {
			if ((module.exports.userList[i].id === agent && module.exports.userList[i].bot === true) || (module.exports.userList[i].id === receiver && module.exports.userList[i].bot === true)) {
				callback(false);
				return;
			}
		}
		
		authorizer = (authorizer === null) ? `NULL` : `"${authorizer}"`;
		module.exports.database.all(`INSERT INTO transactions VALUES ("${timeStamp}", ${amount}, "${name}", "${agent}", "${receiver}", ${authorizer}, ${Number(isAutomated)})`, function (error, rows) {
			if (error) {
				callback(null);
			} else {
				callback(true);
			}
		});
	}, 
	handler: function () {
		module.exports.database.all(`SELECT * FROM accounts WHERE account_id != "-1"`, function (error, rows) {
			let toBeRemoved = [];
			for (let i = 0; i < rows.length; i++) {
				let accountExists = false;
				for (let j = 0; j < module.exports.userList.length; j++) {
					if (module.exports.userList[j].id === rows[i].account_id && module.exports.userList[j].bot === false) {
						accountExists = true;
					}
				}
				
				if (accountExists === false && rows[i].disabled === 0) {
					toBeRemoved.push(rows[i]);
					console.log(`Account ID ${rows[i].account_id} is going to be removed. `);
				}
			}
			
			for (let i = 0; i < toBeRemoved.length; i++) {
				for (let j = 0; j < rows.length; j++) {
					if (toBeRemoved[i].account_id === rows[j].account_id) {
						rows[j].disabled = 1;
						module.exports.database.run(`UPDATE accounts SET disabled = 1 WHERE account_id = "${rows[j].account_id}"`);
					}
				}
			}
			
			let toBeAdded = [];
			for (let i = 0 ; i < module.exports.userList.length; i++) {
				let accountExists = false;
				for (let j = 0; j < rows.length; j++) {
					if (rows[j].account_id === module.exports.userList[i].id && module.exports.userList[i].bot === false) {
						accountExists = true;
						if (rows[j].disabled === 1) {
							rows[j].disabled = 0;
							module.exports.database.run(`UPDATE accounts SET disabled = 0 WHERE account_id = "${rows[j].account_id}"`);
						}
					}
				}
				
				if (accountExists === false && module.exports.userList[i].bot === false) {
					toBeAdded.push(module.exports.userList[i]);
					console.log(`Account ID ${rows[i].account_id} is going to be added. `);
				}
			}
			
			for (let i = 0 ; i < toBeAdded.length; i++) {
				rows.push({
					"account_id": toBeAdded[i].id, 
					"disabled": 0
				});
				module.exports.database.run(`INSERT INTO accounts VALUES ("${rows[rows.length - 1].account_id}", 1)`);
			}
		});
	}
};