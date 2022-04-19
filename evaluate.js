const Environment = require(".\/environment.js");
const tokenIs = (new Environment()).tokenIs;

function evaluateArticle (line, report) {
	// Split the line at with
	let lineSides = null;
	for (let i = 0; i < line.content.length; i++) {
		if (tokenIs(line.content[i], "with", "keyword")) {
			lineSides = [line.content.slice(0, i), line.content.slice(i + 1, line.length)];
		}
	}
	
	if (lineSides === null) {
		report("WITH_NOT_FOUND");
	} else {
		return {
			type: "article", 
			sides: [
				evaluateSide(lineSides[0], report), 
				evaluateSide(lineSides[1], report)
			]
		};
	}
}

function evaluateSide (lineContent, report) {
	let lineObject = {type: "side", auto: false};
	let pointer = 0;
	
	if (tokenIs(lineContent[0], "auto", "keyword")) {
		lineObject.auto = true;
		pointer++;
	}
	
	if (tokenIs(lineContent[pointer], "as", "keyword") && tokenIs(lineContent[pointer + 1])) {
		lineObject.person = {type: "as", content: lineContent[pointer + 1].content};
		pointer += 2;
	} else if (tokenIs(lineContent[pointer], "everyone", "keyword")) {
		lineObject.person = {type: "everyone"};
		pointer++;
	} else if (tokenIs(lineContent[pointer], "government", "keyword")) {
		lineObject.person = {type: "government"};
		pointer++;
	} else {
		report("TOO_FEW_PARAMETERS_IN_SIDE");
	}
	
	if (lineContent.length > pointer + 1) {
		report("TOO_MANY_PARAMETERS_IN_SIDE");
	} else {
		lineObject.content = [];
		if (tokenIs(lineContent[pointer], null, "bracket")) {
			for (let i = 0; i < lineContent[pointer].content.length; i++) {
				evaluateOrder(lineObject, lineContent[pointer].content[i], report);
			}
		}
	}
	
	return lineObject;
}

function evaluateOrder (lineObject, line, report) {
	if (tokenIs(line.content[0], "if", "logic")) {
		if (tokenIs(line.content[1], "not", "logic") && tokenIs(line.content[2], "has", "action")) {
			evaluateItem(lineObject, {type: "order", opcode: "IF_NOT_HAS", content: line.content.slice(3)}, report);
		} else if (tokenIs(line.content[1], "has", "action")) {
			evaluateItem(lineObject, {type: "order", opcode: "IF_HAS", content: line.content.slice(2)}, report);
		} else {
			report("ACTION_NOT_FOUND");
		}
	} else if (tokenIs(line.content[0], "not", "logic") && lineObject.auto === true) {
		if (tokenIs(line.content[1], "give", "action")) {
			evaluateItem(lineObject, {type: "order", opcode: "NOT_GIVE", content: line.content.slice(2)}, report);
		} else if (tokenIs(line.content[1], "create", "action")) {
			evaluateItem(lineObject, {type: "order", opcode: "NOT_CREATE", content: line.content.slice(2)}, report);
		} else if (!tokenIs(line.content[0], "if", "logic")) {
			report("ACTION_NOT_FOUND");
		}
	} else {
		if (tokenIs(line.content[0], "give", "action")) {
			evaluateItem(lineObject, {type: "order", opcode: "GIVE", content: line.content.slice(1)}, report);
		} else if (tokenIs(line.content[0], "create", "action")) {
			evaluateItem(lineObject, {type: "order", opcode: "CREATE", content: line.content.slice(1)}, report);
		} else {
			report("ACTION_NOT_FOUND");
		}
	}
}

function evaluateItem (lineObject, orderObject, report) {
	if (orderObject.content.length < 2) {
		report("TOO_FEW_PARAMETERS_IN_ITEM");
	} else if (orderObject.content.length > 2) {
		report("TOO_MANY_PARAMETERS_IN_ITEM");
	} else if (!tokenIs(orderObject.content[0], null, "integer")) {
		report("ITEM_AMOUNT_NOT_FOUND");
	} else if (!tokenIs(orderObject.content[1])) {
		report("ITEM_NAME_NOT_FOUND");
	} else {
		orderObject.amount = orderObject.content[0].content;
		orderObject.name = orderObject.content[1].content;
		delete orderObject.content;
		lineObject.content.push(orderObject);
	}
}

function reportErrorFactory () {
	let errorObject = {error: false, outputLogs:[]};
	errorObject.report = function (content) {
		errorObject.error = true;
		errorObject.outputLogs.push(content);
	}
	
	return errorObject;
}

// Generate the abstract syntax tree of a contract from the parse tree
module.exports = function evaluate (message, lineContent) {
	let errorObject = reportErrorFactory();
	let lineObject = {type: "contract", articles: []};
	lineContent[3].content.forEach(line => {
		lineObject.articles.push(evaluateArticle(line, errorObject.report));
	});
	
	if (errorObject.error === false) {
		return lineObject;
	} else if (errorObject.error === true) {
		if (message !== null) message.reply("AST generation failure. Output logs: \n```" + errorObject.outputLogs.join("\n") + "```");
		return false;
	}
}