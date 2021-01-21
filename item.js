module.exports = {
	newItem: function (oldItem) {
		itemObject = {};
		itemObject.amount = oldItem.amount;
		itemObject.data = oldItem.data;
		itemObject.compareReference = {
			"normal": [], 
			"food": ["calorie"], 
			"farm": ["state", "county"], 
			"weapon": ["use_cost", "effect", "cooldown", "last_use"]
		};
		itemObject.compare = function (anotherItem) {
			if (itemObject.data.item !== anotherItem.item) return {
				"identical": false, 
				"reason": "item"
			};
			
			if (itemObject.data.unit !== anotherItem.unit) return {
				"identical": false, 
				"reason": "unit"
			};
			
			if (itemObject.data.type !== anotherItem.type) return {
				"identical": false, 
				"reason": "special"
			};
			
			// The "compared" variable is the type-specific properties for the type of the item involved
			compared = itemObject.compareReference[itemObject.data.type];
			
			if (!(compared)) return {
				"identical": false, 
				"reason": "special"
			};
			
			for (compareReferenceIndex = 0; compareReferenceIndex < compared.length; compareReferenceIndex++) {
				if (itemObject.data[compared[compareReferenceIndex]] !== anotherItem[compared[compareReferenceIndex]]) return {
					"identical": false, 
					"reason": "special"
				};
			}
			
			return {
				"identical": true
			};
		}
		return itemObject;
	}, 
	stringify: function (itemObject) {
		if (itemObject.data.type === "normal") {
			if (itemObject.data.unit === null) {
				return itemObject.amount + " " + itemObject.data.item + "(s)";
			} else {
				return itemObject.amount + " " + itemObject.data.unit + "(s) of " + itemObject.data.item;
			}
		} else if (itemObject.data.type === "farm") {
			return "The " + itemObject.data.item + " of " + itemObject.data.county + ", " + itemObject.data.state;
		} else if (itemObject.data.type === "food") {
			if (itemObject.data.unit === null) {
				return itemObject.amount + " " + itemObject.data.item + "(s), each packed with " + itemObject.data.calorie + " Calorie(s)";
			} else {
				return itemObject.amount + " " + itemObject.data.unit + "(s) of " + itemObject.data.item + ", each packed with " + itemObject.data.calorie + " Calorie(s)";
			}
		}
	}
};