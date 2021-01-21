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
					output[output.length] = input.substring(start, i);
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
						output[output.length] = input.substring(start, i);
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