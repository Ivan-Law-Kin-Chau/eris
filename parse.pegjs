command = "!e " parameters:parameters {
	return parameters;
}

parameters = parameters:(parameter / whiteSpace / newLine)+ {
	return parameters.filter(parameter => parameter !== " ");
}

// An explicitString is a string that starts and ends with double quotation marks
// An implicitString is a string that does not start with a double quotation mark
// The !implicitStringCharacter checks make sure that parameters can only be matched if they are not followed by one or more implicitStringCharacters, in order to prevent bugs such as "1a" being parsed as an integer immediately followed by an implicitString
parameter = parameter:((explicitString !implicitStringCharacter) / (roleID !implicitStringCharacter) / (accountID !implicitStringCharacter) / (item !implicitStringCharacter) / (integer !implicitStringCharacter) / (implicitString !implicitStringCharacter)) {
	return parameter[0];
}

whiteSpace = [ ]

newLine = [\n] {
	return {type: "operator", content: "new_line"};
}

explicitString = explicitString:("\"" explicitStringCharacters "\"") {
	return {type: "string", content: explicitString[1]};
}

// Remove all backslashes, but if a backslash was delimiting a character, then add the character afterwards
explicitStringCharacters = explicitStringCharacters:(delimitedEnd / delimitedBackslash / backslash / [^\"])* {
	return explicitStringCharacters.join("");
}

delimitedEnd = "\\\"" {
	return "\"";
}

delimitedBackslash = "\\\\" {
	return "\\";
}

backslash = "\\" {
	return undefined;
}

// explicitString will fail to match if there is no ending double quotation mark
// The &[^"] prevents such a failed explicitString from being matched as an implicitString instead
implicitString = &[^"] implicitStringCharacters:implicitStringCharacter+ {
	const string = implicitStringCharacters.join("");
	return {type: "string", content: string};
}

implicitStringCharacter = [^ \n]

// If a user deliberately wants an integer to be interpreted as a string instead of an integer, they will have to enclose the string in double quotation marks to avoid this check
integer = integerCharacters:integerCharacter+ {
	const integer = integerCharacters.join("");
	return {type: "integer", content: parseInt(integer)};
}

integerCharacter = [0-9]

item = name:name "x" amount:amount {
	return {type: "item", content: {amount: amount, name: name}};
}

amount = amount:integer {
	return amount.content;
}

// This will match successfully as long as there is still an "x" followed by an amount ahead
hasXAndAmountAhead = . (!("x" amount) .)* ("x" amount)

// Add characters into a name as long as there is still an "x" followed by an amount ahead, which means that for a string like "ax1x1", the first "x1" will also be added into the name because there is still a second "x1" ahead
name = name:(&hasXAndAmountAhead .)+ {
	return name.map(nameCharacter => nameCharacter[1]).join("");
}

roleID = "<@&" number:number ">" {
	return {type: "role_id", content: number};
}

accountID = ("<@!" / "<@") number:number ">" {
	return {type: "account_id", content: number};
}

// A number is an integer lengthed 18 or 19
number = numbers:(integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter integerCharacter?) {
	// If the number is lengthed 18, then the last integerCharacter will return null, so filter that away
	return numbers.filter(number => number !== null).join("");
}