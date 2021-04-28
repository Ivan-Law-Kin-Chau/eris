module.exports = {
	database: new (require("sqlite3").verbose()).Database("database.db"), 
	handler: function (list) {
		module.exports.database.all("SELECT * FROM accounts", function(error, rows) {
			// Expect an array containing all current accounts, with each element being [account_id, username, discriminator]
			toBeRemoved = [];
			for (i = 0; i < rows.length; i++) {
				accountExists = false;
				for (j = 0; j < list.length; j++) {
					if (list[j][0] === rows[i].account_id) {
						accountExists = true;
					}
				}
				if (accountExists === false && rows[i].disabled === 0) {
					toBeRemoved[toBeRemoved.length] = rows[i];
					console.log(rows[i].username + "#" + rows[i].discriminator + " is going to be removed. ");
				}
			}
			
			for (i = 0; i < toBeRemoved.length; i++) {
				for (j = 0; j < rows.length; j++) {
					if (toBeRemoved[i].account_id === rows[j].account_id) {
						rows[j].disabled = 1;
						module.exports.database.run("UPDATE accounts SET disabled = 1 WHERE account_id = \"" + rows[j].account_id + "\"");
					}
				}
			}
			
			toBeAdded = [];
			for (i = 0 ; i < list.length; i++) {
				accountExists = false;
				for (j = 0; j < rows.length; j++) {
					if (rows[j].account_id === list[i][0]) {
						accountExists = true;
						if (rows[j].disabled === 1) {
							rows[j].disabled = 0;
							module.exports.database.run("UPDATE accounts SET disabled = 0 WHERE account_id = \"" + rows[j].account_id + "\"");
						}
					}
				}
				if (accountExists === false) {
					toBeAdded[toBeAdded.length] = list[i];
					console.log(list[i][1] + "#" + list[i][2] + " is going to be added. ");
				}
			}
			
			for (i = 0 ; i < toBeAdded.length; i++) {
				rows[rows.length] = {
					"account_id": toBeAdded[i][0], 
					"disabled": 0
				};
				module.exports.database.run("INSERT INTO accounts VALUES (\"" + rows[rows.length - 1].account_id + "\", 1)");
			}
		});
	}
};