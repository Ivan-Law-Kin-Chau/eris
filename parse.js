module.exports = {
	parseCommand: function (input = "") {
		input += " ";
		output = [];
		start = null;
		delimit = false;
		inString = false;
		
		for (i = 0; i < input.length; i++) {
			if (inString === false) {
				if (input.charAt(i) === " " && start !== null) {
					if (input.substring(start, i).startsWith("<@!") && 
						input.substring(start, i).endsWith(">")) {
						let number = input.substring(start, i).substring(3, input.substring(start, i).length - 1);
						if (number.length === 18 && typeof parseInt(number) === "number" && !(isNaN(parseInt(number)))) {
							output[output.length] = JSON.stringify(["account_id", number]);
						} else {
							output[output.length] = JSON.stringify(["string", input.substring(start, i)]);
						}
					} else {
						output[output.length] = JSON.stringify(["string", input.substring(start, i)]);
					}
					start = null;
				} else if (input.charAt(i) === "\"" && start === null) {
					inString = true;
				} else if (input.charAt(i) !== " " && start === null) {
					start = i;
				}
			} else if (inString === true) {
				if (input.charAt(i) === "\\") {
					delimit = !(delimit);
				} else if (input.charAt(i) === "\"") {
					if (delimit === false) {
						output[output.length] = JSON.stringify(["string", input.substring(start, i)]);
						delimit = false;
						inString = false;
						start = null;
					}
				} else {
					delimit = false;
					if (input.charAt(i) !== " " && start === null) {
						start = i;
					}
				}
			}
		}
		
		return output;
	}
};