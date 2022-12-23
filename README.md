# What is the Vultr password? 
Check "secrets.json"

# Where is the SSLs install guide? 
https://www.ssls.com/knowledgebase/how-to-install-an-ssl-certificate-on-a-nginx-server/

# How to start the server? 
`nohup node index.js > /dev/null &`
`disown`

# How to kill the "nohup" process? 
`ps aux | grep [n]ode # Find the PID of the nohup process`
`kill PID # Kill the nohup process`

# How to fix various problems of the default configurations in a freshly installed Vultr server? 
`sudo ufw disable`
`sudo apt-get remove apache2`

# What to install in the freshly installed Vultr server? 
`sudo apt-get install nginx`
`sudo apt-get install unzip`
`sudo apt-get install nodejs`
`sudo apt-get install npm`

# What to do with the files in the "server" directory? 
1. The file within the "acme-challenge" directory has to be placed at "/root/.well-known/pki-validation"
2. The "important-files" directory has to be placed at "/etc/nginx"
3. The "default" file has to be placed at "/etc/nginx/sites-enabled", replacing the old "default" file