// Parses a script (which can contain multiple commands) into an abstract syntax tree
module.exports = {
	secret: ";f'9nc8jl1@v;t[/hi", 
	parse: function (input = "") {
		// Remove comments
		input = input.split("\n");
		for (let i = 0; i < input.length; i++) {
			input[i] = input[i].split("\\#").join(module.exports.secret);
			input[i] = input[i].split("#")[0];
			input[i] = input[i].split(module.exports.secret).join("#");
		}
		input = input.join("\n");
		
		// Handle tabs
		input = input.split("\t").join(" ");
		
		// Remove the initial !e
		input = input.substring(3);
		
		// Lexer
		input += " ";
		let tokenized = [];
		let start = null; // The character within the input where the string the pointer is currently at began
		let delimit = false; // If the pointer is current at a " symbol and delimit is false, the string the pointer is at ends
		let inString = false; // Whether the point is currently within a string or not
		for (let i = 0; i < input.length; i++) {
			if (inString === false) {
				if ((input.charAt(i) === " " || input.charAt(i) === "\n") && start !== null) {
					const discernString = function (tokenized, string) {
						if (string === "{") {
							tokenized.push({type: "operator", content: "bracket_open"});
						} else if (string === "}") {
							tokenized.push({type: "operator", content: "bracket_closed"});
						} else if (string === "{}") {
							tokenized.push({type: "operator", content: "bracket_open"});
							tokenized.push({type: "operator", content: "null"});
							tokenized.push({type: "operator", content: "bracket_closed"});
						} else if ((string.split("{").length - 1) + (string.split("}").length - 1) === string.length) {
							// Dealing with weird strings such as "{{}" or "{}}". If a user deliberately wants to use these weird strings, they will have to enclose the weird string in double quotation marks to avoid this check
							throw "Bracket format not recognized! ";
						} else if (!isNaN(parseInt(string))) {
							// Again, if a user deliberately wants an integer to be interpreted as a string instead of an integer, they will have to enclose the string in double quotation marks to avoid this check
							tokenized.push({type: "integer", content: parseInt(string)});
						} else if (string === "if" || string === "not") {
							tokenized.push({type: "logic", content: string});
						} else if (string === "has" || string === "give" || string === "create") {
							tokenized.push({type: "action", content: string});
						} else if (string === "make" || string === "destroy" || string === "sign" || string === "cancel" || string === "view") {
							tokenized.push({type: "command", content: string});
						} else if (string === "contract" || string === "with" || string === "auto" || string === "as" || string === "everyone" || string === "government") {
							tokenized.push({type: "keyword", content: string});
						} else {
							tokenized.push({type: "string", content: string});
						}
					}
					
					if (input.substring(start, i).startsWith("<@&") && 
						input.substring(start, i).endsWith(">")) {
						let number = input.substring(start, i).substring(3, input.substring(start, i).length - 1);
						if (number.length === 18 && typeof parseInt(number) === "number" && !(isNaN(parseInt(number)))) {
							tokenized.push({type: "role_id", content: number});
						} else {
							discernString(tokenized, input.substring(start, i));
						}
					} else if (input.substring(start, i).startsWith("<@!") && 
						input.substring(start, i).endsWith(">")) {
						let number = input.substring(start, i).substring(3, input.substring(start, i).length - 1);
						if (number.length === 18 && typeof parseInt(number) === "number" && !(isNaN(parseInt(number)))) {
							tokenized.push({type: "account_id", content: number});
						} else {
							discernString(tokenized, input.substring(start, i));
						}
					} else if (input.substring(start, i).startsWith("<@") && 
						input.substring(start, i).endsWith(">")) {
						let number = input.substring(start, i).substring(2, input.substring(start, i).length - 1);
						if (number.length === 18 && typeof parseInt(number) === "number" && !(isNaN(parseInt(number)))) {
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
		
		// Remove all bracket tokens and add a bracket_depth property to each token instead
		let output = [];
		let bracketDepth = 0;
		let maximumBracketDepth = 0;
		for (let i = 0; i < tokenized.length; i++) {
			if (tokenized[i].type === "operator" && tokenized[i].content === "bracket_open") {
				bracketDepth++;
			} else if (tokenized[i].type === "operator" && tokenized[i].content === "bracket_closed") {
				bracketDepth--;
			} else {
				if (maximumBracketDepth < bracketDepth) maximumBracketDepth = bracketDepth;
				output.push({bracketDepth: bracketDepth, bracketContent: tokenized[i]});
			}
		}
		
		// Use the bracketDepth property to build the structure of the parse tree
		for (let currentDepth = maximumBracketDepth; currentDepth > 0; currentDepth--) {
			let outputReplacement = [];
			let atCurrentDepth = false;
			let currentDepthCacheReplaces = null;
			let currentDepthCache = null;
			
			for (let i = 0; i < output.length; i++) {
				if (output[i].bracketDepth >= currentDepth && atCurrentDepth === false) {
					atCurrentDepth = true;
					currentDepthCache = [];
				}
				
				if (output[i].bracketDepth < currentDepth && atCurrentDepth === true) {
					atCurrentDepth = false;
					outputReplacement.push({bracketDepth: currentDepth, bracketContent: currentDepthCache});
					currentDepthCacheReplaces = null;
					currentDepthCache = null;
				}
				
				if (atCurrentDepth === true) {
					currentDepthCache.push(output[i]);
				}
				
				if (atCurrentDepth === false) {
					outputReplacement.push(output[i]);
				}
			}
			
			if (currentDepthCache !== null) outputReplacement.push({bracketDepth: currentDepth, bracketContent: currentDepthCache});
			output = outputReplacement;
		}
		
		// Remove the bracketDepth properties and excessive new lines
		clearParseTree = function (input) {
			if (!Array.isArray(input)) throw "Input is not an array";
			
			for (let i = 0; i < input.length; i++) {
				if (Array.isArray(input[i].bracketContent)) {
					input[i] = clearParseTree(input[i].bracketContent);
				} else if (typeof input[i].bracketContent === "object") {
					if (input[i].bracketContent.type === "operator" && input[i].bracketContent.content === "new_line") {
						if (i === 0 || i === input.length - 1) {
							input.splice(i, 1); i--; continue;
						} else if (typeof input[i - 1] === "object" && input[i - 1].type === "operator" && input[i - 1].content === "new_line") {
							input.splice(i, 1); i--; continue;
						} else {
							input[i] = input[i].bracketContent;
						}
					} else {
						input[i] = input[i].bracketContent;
					}
				}
			}
			
			return {type: "bracket", content: input};
		}
		
		// Turn the contents of every bracket, including the entire script (which is now a bracket), into an array of lines
		convertIntoLines = function (input) {
			if (input.type !== "bracket") throw "Input is not a bracket";
			let output = {type: "bracket", content: []};
			let cache = [];
			
			for (let i = 0; i < input.content.length; i++) {
				if (input.content[i].type === "bracket") {
					cache.push(convertIntoLines(input.content[i]));
				} else {
					if (input.content[i].type === "operator" && input.content[i].content === "new_line") {
						output.content.push({type: "line", content: cache});
						cache = [];
					} else {
						cache.push(input.content[i]);
					}
				}
			}
			
			if (cache.length > 0) output.content.push({type: "line", content: cache});
			return output;
		}
		
		// Parser
		output = clearParseTree(output);
		output = convertIntoLines(output);
		
		return output;
	}
};