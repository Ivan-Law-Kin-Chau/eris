# The Eris Bot

A Discord bot developed and maintained throughout the course of a few months for a Discord server that I was in. It has been rewritten to be used in a different Discord server than before. You can still access the repository for the older version [here](https://github.com/Ivan-Law-Kin-Chau/eris-old). 

## Technologies Used

 - Node.js
 - Sqlite3

## Main Features

This Discord bot has an advanced parser that can generate an abstract syntax tree from user input. This is because I had an ambitious vision during the early stages of developing this Discord bot. I planned to create a domain specific programming language for rights using the Hohfeldian analysis of rights model. The Hohfeldian analysis of rights is a way to conceptualize rights into different parts. A programming language that implements this model can then be used to simulate anything from a shop to a system of giving people degrees to a way to allow bankers to tax other people within the Discord server, as in the following examples: 

```
# A shop
make contract shop {
	auto as seller {
		if has 1 bread
		give 1 bread
	} with as bread_buyer {
		if has 5 dollar
		give 5 dollar
	}
}
```

```
# A system of giving people degrees
make contract "Bachelor of Political Science" {
	auto government {
		create 1 "Bachelor of Political Science"
	} with as recipient
}
```

```
# A way to allow bankers to tax other people within the Discord server
make contract tax {
	auto government {
		create 1 "right to tax"
	} with auto as banker
	
	auto everyone {
		not create 1 "right to tax"
	} with auto everyone
	
	auto as banker {
		not give 1 "right to tax"
	} with auto everyone
	
	as banker {
		if has 1 "right to tax"
	} with auto as citizen {
		give 100 dollar
	}
}
```

Other people in the Discord server could then make commands using this programming language to set up rights without me having to get involved every time. However, I did not have the time to create this programming language in its entirety and eventually abandoned this bot in the middle of developing it. That is why this bot has a far more advanced parser than the features that this bot currently exposes to its users would necessitate. Anyhow, here are the list of commands for this bot: 

### List of Commands

Here is the list of available commands: 

**!e help** - See this message. 

**!e time** - See the current time in Discordia. 

**!e balance** - See your current balance. 

**!e budget** - See the government's current balance. 

**!e give {person} {number}** - Send your $D to someone. 

**!e reward {person/role} {number} "{reason (optional)}"** - Send the government's $D to people\*. 

**!e charge {person/role} {number} "{reason (optional)}"** - Send people's $D to the government\*. 

**!e print {number}** - Print new $D for the government\*. 

**!e burn {number}** - Burn depreciated $D held by the government\*. 

**!e dice {probability of success (from 0 to 100 percent)} "{action}"** - Let fate decide whether an extrajudicial action is successful or not\*\*. 

\* Only for Presidents, Judges, Bankers, Police Officers and Dungeon Masters. 

\*\* Only for Dungeon Masters. 