const secrets = JSON.parse(require("fs").readFileSync(".\/secrets.json", "utf8"));
const listOfIds = secrets.listOfIds;

const Discord = require("discord.js");
const intents = new Discord.Intents(32767);
const client = new Discord.Client({intents});
const store = require(".\/store.js");

client.login(secrets.token);
client.on("ready", async function () {
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
		
		require("node-cron").schedule("* * * * * *", () => {
			store.automaticallyTransact(client, listOfIds);
		});
	});
	
	serverBackuper = require("discord-backup");
	serverBackuper.setStorageFolder(__dirname + "/backups/");
	serverBackuper.create(client.guilds.cache.get(listOfIds.rootServer), {
		maxMessagesPerChannel: 100000, 
		jsonSave: true, 
		jsonBeautify: true, 
		saveImages: "base64"
	}).then(function (serverBackup) {
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