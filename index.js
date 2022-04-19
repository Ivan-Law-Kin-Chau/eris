const listOfIds = {
	erisID: "", 
	rootServer: "", 
	rewardChargeLogs: "", 
	fiscalAuthorizers: {
		judge: "", 
		president: "", 
		dungeonMaster: "", 
		banker: "", 
		policeOfficer: ""
	}
};

const Discord = require("discord.js");
const intents = new Discord.Intents(32767);
const client = new Discord.Client({ intents });
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
	});
	
	serverBackuper = require("discord-backup");
	serverBackuper.setStorageFolder(__dirname + "/backups/");
	serverBackuper.create(client.guilds.cache.get(listOfIds.rootServer)).then(function (serverBackup) {
		console.log("Server backup created: " + serverBackup.id);
	});
});

const Environment = require(".\/environment.js");
const runtimeEnvironment = new Environment(store);
runtimeEnvironment.loadContracts();

client.on("messageCreate", function (message) {
	if (message.content.startsWith("!e ")) {
		try {
			const parsedScript = require(".\/parse.js").parse(message.content);
			console.log(message.author.id, JSON.stringify(parsedScript, "\t", 4));
			parsedScript.content.forEach(function (line) {
				runtimeEnvironment.evaluate(client, message, line.content, message.content, listOfIds);
			});
		} catch (error) {
			console.log(error);
			message.reply("Syntax error! ");
		}
	}
});