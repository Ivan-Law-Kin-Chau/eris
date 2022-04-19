// Generate an instance of a contract from the abstract syntax tree
module.exports = class Contract {
	constructor (message, abstractSyntaxTree, sourceCode, listOfIds, authorId, store) {
		this.abstractSyntaxTree = abstractSyntaxTree;
		this.sourceCode = sourceCode;
		this.store = store;
		this.id = "";
		for (let i = 0; i < 8; i++) {
			this.id += "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36));
		}
		
		this.personList = [];
		for (let i = 0; i < abstractSyntaxTree.articles.length; i++) {
			for (let j = 0; j < abstractSyntaxTree.articles[i].sides.length; j++) {
				let found = false;
				for (let k = 0; k < this.personList.length; k++) {
					if (JSON.stringify(this.personList[k].identity) === JSON.stringify(abstractSyntaxTree.articles[i].sides[j].person)) {
						found = true;
					}
				}
				
				if (found === false) this.personList.push({
					consented: false, 
					accountId: authorId, 
					identity: abstractSyntaxTree.articles[i].sides[j].person
				});
			}
		}
	}
	
	getAs (asWho) {
		for (let i = 0; i < this.personList.length; i++) {
			if (this.personList[i].identity.content === asWho) {
				return this.personList[i].accountId;
			}
		}
	}
	
	setAs (person, asWho) {
		for (let i = 0; i < this.personList.length; i++) {
			if (this.personList[i].identity.content === asWho) {
				this.personList[i].accountId = person;
				return true;
			}
		}
		return false;
	}
	
	getConsent (person, asWho) {
		for (let i = 0; i < this.personList.length; i++) {
			if (this.personList[i].accountId === person && this.personList[i].identity.content === asWho) {
				return this.personList[i].consented;
			}
		}
	}
	
	setConsent (person, asWho, consent = true) {
		for (let i = 0; i < this.personList.length; i++) {
			if (this.personList[i].accountId === person && this.personList[i].identity.content === asWho) {
				this.personList[i].consented = consent;
				return true;
			}
		}
		return false;
	}
	
	canSignContract () {
		return new Promise((function (resolve, reject) {
			// Reject if there is a person involved that is neither auto or consenting
			for (let i = 0; i < this.abstractSyntaxTree.articles.length; i++) {
				for (let j = 0; j < this.abstractSyntaxTree.articles[i].sides.length; j++) {
					if (this.abstractSyntaxTree.articles[i].sides[j].auto === false) {
						if (this.abstractSyntaxTree.articles[i].sides[j].person.content) {
							let asWho = this.abstractSyntaxTree.articles[i].sides[j].person.content;
							let person = this.getAs(asWho);
							
							if (this.getConsent(person, asWho) === false) {
								reject({type: "error", content: `CONSENT_REQUIRED(<@${person}>, <@${asWho}>)`});
							}
						}
					}
				}
			}
			
			// Reject if there is a IF_HAS or IF_NOT_HAS requirement that is not fulfilled
			for (let i = 0; i < this.abstractSyntaxTree.articles.length; i++) {
				for (let j = 0; j < this.abstractSyntaxTree.articles[i].sides.length; j++) {
					let asWho = this.abstractSyntaxTree.articles[i].sides[j].person.content;
					let person = this.getAs(asWho);
					
					for (let k = 0; k < this.abstractSyntaxTree.articles[i].sides[j].content.length; k++) {
						let order = this.abstractSyntaxTree.articles[i].sides[j].content[k];
						if (order.opcode !== "IF_HAS" && order.opcode !== "IF_NOT_HAS") continue;
						this.store.getBalance(person, function (balance) {
							if (order.opcode === "IF_HAS" && balance < order.amount) {
								reject({type: "error", content: `IF_HAS_REQUIREMENT_FAILED`});
							} else if (order.opcode === "IF_NOT_HAS" && balance >= order.amount) {
								reject({type: "error", content: `IF_NOT_HAS_REQUIREMENT_FAILED`});
							}
						}, order.name);
					}
				}
			}
			
			// Or else, resolve
			resolve(true);
		}).bind(this));
	}
	
	signContract (personList) {
		
	}
};