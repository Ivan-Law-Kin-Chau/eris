const listOfIds = {
	erisID: "", 
	erisRoleID: "", 
	governmentRoleID: "", 
	rootServer: "", 
	transferLogs: "", 
	fiscalAuthorizers: {
		judge: "", 
		president: "", 
		dungeonMaster: "", 
		ministerOfFinance: "", 
		policeOfficer: ""
	}
};

const Discord = require("discord.js");
const intents = new Discord.Intents(32767);
const client = new Discord.Client({intents});
const store = require(".\/store.js");

client.login("");
client.on("ready", function () {
	console.log("The bot has been started. ");
	client.guilds.cache.get(listOfIds.rootServer).members.fetch().then(function (users) {
		userList = [];
		users.forEach(function (user) {
			userList.push({
				id: user.user.id, 
				bot: user.user.bot
			});
		});
		store.setUserList(userList);
		store.handler();
		
		userList.forEach(user => {
			if (user.bot === false) store.getBalance(user.id, balance => console.log(`<@${user.id}> - ${balance} DCP`));
		});
	});
	
	serverBackuper = require("discord-backup");
	serverBackuper.setStorageFolder(__dirname + "/backups/");
	serverBackuper.create(client.guilds.cache.get(listOfIds.rootServer)).then(function (serverBackup) {
		console.log("Server backup created: " + serverBackup.id);
	});
});

const Environment = require(".\/environment.js");
const runtimeEnvironment = new Environment(store);

client.on("messageCreate", function (message) {
	if (message.content.startsWith("!e ")) {
		try {
			const line = require(".\/parse.js").parse(message.content);
			console.log(message.author.id, JSON.stringify(line, "\t", 4));
			runtimeEnvironment.evaluate(client, message, line, listOfIds);
		} catch (error) {
			console.log(error);
			message.reply("Syntax error! ");
		}
	}
});