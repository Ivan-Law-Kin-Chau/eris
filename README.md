# The Erisal Bot

A Discord bot developed and maintained throughout the course of around 1.5 months for a Discord server that I started. The codebase for the bot was forked from the Eris bot repository. 

## Technologies Used

 - Node.js
 - extractjs
 - Sqlite3
 - node-cron

## Main Features

The main features of the bot are listed in the Discord server's promotional video that I animated: https://drive.google.com/file/d/1DEhRv22DIwZ5DrSfp6HsztKHSz6Z3Eor/view

## List of Commands

The users can send two commands, either at the #bots channel of the server or in the DM with the bot. 

**1. !e half "Ivan Law"** - Vote to half the amount of HDH that Ivan Law (or someone else) has. This only works for the 2/3 supermajority vote, not the unanimous vote. 

**2. !e gift "Ivan Law" 123** - Gift 123 HDH to Ivan Law (or someone else). Of course, they would only receive half of it, rounded down to the nearest integer. 

They have to use Discord usernames instead of nicknames in these commands. Also, if two or more accounts share the same username, they can add a # and their Discord discriminator behind their username to clarify who are they referring to. 

More staff-only commands are available for the purposes of recording various types of transactions. The bot will automatically recalculate the balances of all the users involved after these staff-only commands are sent. 