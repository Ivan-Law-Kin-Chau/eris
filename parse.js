module.exports = {
	parse: function (input = "") {
		// Remove the initial !e
		input = input.substring(3);
		
		// Lexer
		input += " ";
		let tokenized = [];
		let start = null; // The character within the input where the string the pointer is currently at began
		let delimit = false; // If the pointer is currently at a " symbol and delimit is false, the string the pointer is at ends
		let inString = false; // Whether the point is currently within a string or not
		for (let i = 0; i < input.length; i++) {
			if (inString === false) {
				if ((input.charAt(i) === " " || input.charAt(i) === "\n") && start !== null) {
					const discernString = function (tokenized, string) {
						const discernItem = function (string) {
							try {
								let name = `${string}`;
								name = name.split("x");
								delete name[name.length - 1];
								name = name.join("x");
								console.log(name);
								if (!isNaN(parseInt(name))) return [false];
								
								let amount = `${string}`;
								amount = amount.split("x");
								amount = amount[amount.length - 1];
								console.log(amount);
								if (isNaN(parseInt(amount))) return [false];
								
								return [true, amount, name];
							} catch (error) {
								return [false];
							}
						}
						
						if (discernItem(string)[0] === true) {
							tokenized.push({type: "item", content: {
								amount: discernItem(string)[1], 
								name: discernItem(string)[2]
							}});
						} else if (!isNaN(parseInt(string))) {
							// If a user deliberately wants an integer to be interpreted as a string instead of an integer, they will have to enclose the string in double quotation marks to avoid this check
							tokenized.push({type: "integer", content: parseInt(string)});
						} else {
							tokenized.push({type: "string", content: string});
						}
					}
					
					const isNumber = number => {
						return (number.length === 18 || number.length === 19) && typeof parseInt(number) === "number" && !(isNaN(parseInt(number)));
					}
					
					if (input.substring(start, i).startsWith("<@&") && 
						input.substring(start, i).endsWith(">")) {
						let number = input.substring(start, i).substring(3, input.substring(start, i).length - 1);
						if (isNumber(number)) {
							tokenized.push({type: "role_id", content: number});
						} else {
							discernString(tokenized, input.substring(start, i));
						}
					} else if (input.substring(start, i).startsWith("<@!") && 
						input.substring(start, i).endsWith(">")) {
						let number = input.substring(start, i).substring(3, input.substring(start, i).length - 1);
						if (isNumber(number)) {
							tokenized.push({type: "account_id", content: number});
						} else {
							discernString(tokenized, input.substring(start, i));
						}
					} else if (input.substring(start, i).startsWith("<@") && 
						input.substring(start, i).endsWith(">")) {
						let number = input.substring(start, i).substring(2, input.substring(start, i).length - 1);
						if (isNumber(number)) {
							tokenized.push({type: "account_id", content: number});
						} else {
							discernString(tokenized, input.substring(start, i));
						}
					} else {
						discernString(tokenized, input.substring(start, i));
					}
					
					if (input.charAt(i) === "\n") tokenized.push({type: "operator", content: "new_line"});
					start = null;
					continue;
				}
				
				if (input.charAt(i) === "\n" && start === null) {
					tokenized.push({type: "operator", content: "new_line"});
					continue;
				}
				
				if (input.charAt(i) === "\"" && start === null) {
					inString = true;
					continue;
				}
				
				if (input.charAt(i) !== " " && start === null) start = i;
			} else if (inString === true) {
				if (input.charAt(i) === "\\") {
					delimit = !(delimit);
					continue;
				}
				
				if (input.charAt(i) === "\"") {
					if (delimit === false) {
						tokenized.push({type: "string", content: input.substring(start, i)});
						delimit = false;
						inString = false;
						start = null;
					}
					continue;
				}
				
				delimit = false;
				if (input.charAt(i) !== " " && start === null) start = i;
			}
		}
		
		return tokenized;
	}
};