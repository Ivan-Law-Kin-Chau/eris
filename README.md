# Frequently Asked Questions

Note: This commit will be the last commit to ever be made as Discordia got deleted when the Eris bot from this commit is being used. 

## What is the Vultr password? 
Check "secrets.json". 

## Where is the SSLs install guide? 
Check "https://www.ssls.com/knowledgebase/how-to-install-an-ssl-certificate-on-a-nginx-server/". 

## How to start the server? 
1. `nohup node --max_old_space_size=8192 index.js > /root/bot/log.txt &`
2. `disown`

## How to kill the "nohup" process? 
1. `ps aux | grep [n]ode # Find the PID of the nohup process`
2. `kill PID # Kill the nohup process`

## How to fix various problems of the default configurations in a freshly installed Vultr server? 
1. `sudo ufw disable`
2. `sudo apt-get remove apache2`

## What to install in the freshly installed Vultr server? 
1. `sudo apt-get install nginx`
2. `sudo apt-get install unzip`
3. `sudo apt-get install nodejs`
4. `sudo apt-get install npm`

## What to do with the files in the "server" directory? 
1. The file within the "acme-challenge" directory has to be placed at "/root/.well-known/pki-validation". 
2. The "important-files" directory has to be placed at "/etc/nginx". 
3. The "default" file has to be placed at "/etc/nginx/sites-enabled", replacing the old "default" file. 