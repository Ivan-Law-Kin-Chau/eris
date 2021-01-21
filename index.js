erisID = "";
masterID = "";
centralServer = "";
broadcastChannel = "";
deadChannel = "";
deadRole = "";

basicFunctions = require(".\/basic.js");
parseFunctions = require(".\/parse.js");
timeFunctions = require(".\/time.js");
foodFunctions = require(".\/food.js");
cacheFunctions = require(".\/cache.js");
itemFunctions = require(".\/item.js");
storeFunctions = require(".\/store.js");
fightFunctions = require(".\/fight.js");

createStore = require("redux").createStore;
store = createStore(storeFunctions.handler);
store.dispatch({
	"type": "initialize"
});

client = new (require("discord.js")).Client();
client.login("");
client.on("ready", function () {
	console.log("The bot has been started. ");
});

mode = "deadTesting";
specialEvent = require(".\/event.js");
cron = require("node-cron");

cron.schedule("0 * * * * *", function () {
	client.guilds.cache.get(centralServer).members.fetch().then(function (users) {
		list = [];
		users.forEach(function (user) {
			if (user.user.bot === false) {
				list[list.length] = [user.user.id, user.user.username, user.user.discriminator];
			}
		});
		store.dispatch({
			"type": "update", 
			"current": list
		});
	});
});

client.on("messageReactionAdd", function (reaction, user) {
	for (index = 0; index < fightFunctions.fightObjects.length; index++) {
		if (fightFunctions.fightObjects[index].message.id === reaction.message.id) {
			for ([key, value] of reaction.users.cache) {
				sender = key;
			}
			
			if (sender !== erisID) {
				number = fightFunctions.getNumberByEmoji(reaction.emoji.name);
				fightFunctions.trigger(index, number, sender);
				fightFunctions.fightObjects[index].message.reactions.resolve(reaction.emoji.name).users.remove(sender);
			}
		}
	}
});

client.on("message", function (message) {
	if (message.content.charAt(0) !== "!") return;
	if (!(message.channel.id !== deadChannel || message.content === "!e respawn" || message.author.id === masterID || mode === "deadTesting")) return;
	if (message.guild.id === specialEvent.serverID && mode === "event") {
		specialEvent.execute(message);
	} else {
		basicFunctions.execute(message);
	}
});