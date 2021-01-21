# The Eris Bot

A Discord bot developed and maintained throughout the course of a few months for a Discord server that I was in. 

## Technologies Used

 - Node.js
 - Redux
 - Sqlite3
 - node-cron

## Main Features

 - CRUD with items and a custom currency called DCP that can be traded between users
 - A time system, with a different speed than real world time, that keeps track of farms, health bars and other stuff that will be affected by time through cooldowns or decaying
 - Pseudo-real time duels between two users via reacting to a message, where the illusion of it being in pseudo-real time is maintained through constantly editing the same message
 - A cron job to keep the database's list of users in sync with that of the Discord server
 - The full list of commands are below: 

### List of Commands

**Basic Commands**
   - **!e help** - Display the list of commands
   - **!e help advanced** - Display the list of commands (advanced), which is for enterprise usage or for the Dungeon Master
   - **!e time** - Get the current time in Discordia
   - **!e health** - Check how many HP you have
   - **!e respawn** - Respawn if you died
   - **!e dia pesos** - Claim your Dia Pesos
   - **!e farm "Grant, New Mexico"** - Farm in a county where you have Exclusive Farming Rights to get grains

**Using the Items that You Already Have**
   - **!e inventory** - View your item inventory
   - **!e give <@388283764322729984> 123 [**number**]** - Give items to another citizen
   - **!e eat [**number**]** - Eat a food item to get more HP

### List of Commands (Advanced)

**Getting More Items and Getting Rid of Them**
   - **!e import [**DCP/item**]** - Import items from the overseas
   - **!e export [**DCP/item**]** - Export items to the overseas
   - **!e pack 100x3 [**DCP/item**]** - Pack 100 calories into a food item, times 3 times
   - **!e unpack 100x3 [**DCP/item**]** - Unpack 100 calories from a food item, times 3 times

**Syntax for [DCP/Items]**

The standard syntax has 3 arguments: **[**amount**]** **[**unit**]** **[**item**]**. For example... 
   - **1 Loaf Bread** - Item with unit
   - **1 Cake** - Item without unit
   - **123 Peso DCP** - DCP is treated like any other item
   - **1 Ton "Mongolian Iron"** - If an argument contains spaces, delimit it with brackets (for more complex delimitation than that, use standard JavaScript delimitation rules)

**Dungeon Master Only Commands**
   - **!e attempt 0.2 "assassinate the president"** - Determine whether or not an attempt to perform an action outside the limits of the constitution and laws is successful