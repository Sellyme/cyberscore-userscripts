// ==UserScript==
// @name		CS-ChartHighlighter
// @version		0.1.0
// @description	Highlights charts for certain games based on user-submitted heuristics (e.g., "ticking off" charts a user has maxed).
// @author		Sellyme
// @match		https://cyberscore.me.uk/game*/*
// @namespace	https://github.com/Sellyme/cyberscore-userscripts/
// @homepageURL	https://github.com/Sellyme/cyberscore-userscripts/
// @downloadURL	https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-ChartHighlighter.user.js
// @updateURL	https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-ChartHighlighter.user.js
// @grant		GM_addStyle
// ==/UserScript==
GM_addStyle(
`
#highlightDiv {
	float: right;
	margin-right: 5px;
}
`
);
(function(){
	const urlComponents = window.location.href.split("/")
	const gameNum = parseInt(urlComponents[urlComponents.length - 1])
	const basestyle = "tr.REPLACE_ME{background-color:rgb(17,81,17) !important;}";

	//define helper functions for changing the selected highlight preference
	function addStyle(style) {
		var headEl = document.getElementsByTagName("head")[0];
		var styleEl = document.createElement("style");
		styleEl.setAttribute("id", "chartHighlightRules");
		styleEl.type="text/css";
		styleEl.appendChild(document.createTextNode(style));
		headEl.appendChild(styleEl);
	}
	function saveHighlight(value) {
		const urlComponents = window.location.href.split("/")
		const gameNum = parseInt(urlComponents[urlComponents.length - 1])
		if(value == "none") { //for default
			window.localStorage.removeItem("highlight-"+gameNum);
		} else {
			window.localStorage.setItem("highlight-"+gameNum, value);
		}
	}
	function applyHighlight(save=true) { //pass in false to avoid saving this value for future use
		var value = document.getElementById('highlightSelect').value;
		var rules = document.getElementById('chartHighlightRules');
		if (rules) {
			rules.remove();
		}
		if(value != "none") {
			var style = basestyle;
			style = style.replace("REPLACE_ME",value);
			addStyle(style);
		}
		if(save) {
			saveHighlight(value);
		}
	}
	//helper function to add highlight options to DOM
	//value and desc are the attributes of the <option>, element is the <select>
	//and loadValue is the localStorage entry determining the saved/default selected value
	function addCustomHighlight(value, desc, loadValue, element) {
		let newOpt = document.createElement('option');
		newOpt.value = value;
		newOpt.innerText = desc;
		if(value == loadValue) {
			newOpt.selected = true;
		}
		if(!element) {
			element = document.getElementById('highlightSelect');
		}
		element.appendChild(newOpt);
	}

	//default highlights
	let highlights = [
		{"value": "none", "desc": "None"},
		{"value": "first", "desc": "Firsts"},
		{"value": "submitted", "desc": "Submitted"},
	]

	//build the highlight selector
	var div = document.createElement('div');
	div.id = "highlightDiv";
	var spanEl = document.createElement('span');
	spanEl.innerText = "Highlight:";
	div.appendChild(spanEl);
	var selectEl = document.createElement('select');
	selectEl.id = "highlightSelect";
	selectEl.classList.add('borderRadius');
	selectEl.onchange = applyHighlight;
	//load whatever preset highlight exists, if any
	let savedValue = window.localStorage.getItem("highlight-"+gameNum);
	let defaultValue = window.localStorage.getItem("highlight-default"); //currently unimplemented, be careful when implementing not to let default selections write game-specific ones unnecessarily
	let loadValue = savedValue || defaultValue || "none"; //default to "none"

	for(var i = 0; i < highlights.length; i++) {
		let highlight = highlights[i];
		let selected =
		addCustomHighlight(highlight.value, highlight.desc, loadValue, selectEl);
	}

	div.appendChild(selectEl);

	//insert the selector
	var pageleft = document.getElementById('pageleft');
	pageleft.insertBefore(div, pageleft.firstChild);

	//individual game configs
	function setupGame(gameNum, loadValue) {
		let tagFunction;
		switch(gameNum) {
			case 3225:
				tagFunction = tagMelvor;
				addCustomHighlight("melvor99", "Melvor 99s/120s", loadValue);
				break;
			case 3231:
				tagFunction = tagFinalBarLine;
				addCustomHighlight("maxed", "9,999,999s", loadValue);
				break;
			case 3279:
				tagFunction = tagPokeclicker;
				addCustomHighlight("resisted", "EV Resisted", loadValue)
				break;
			default:
				tagFunction = tagGeneric;
		}
		return tagFunction;
	}

	//this set of functions is called on any chart row if the user has a valid score on that chart
	//the exact behaviour of how to tag it varies by game
	//they receive the group name and chart row as arguments
	function tagMelvor(gname,crow,userScore,firstScore) {
		tagGeneric(gname,crow,userScore,firstScore);
		if(gname.includes(" XP")) {
			let target = 13034431; //Level 99 Mastery
			if(gname.includes("Skill")) {
				target = 104273167; //Level 120 Skill
			}
			userScore = parseInt(userScore);
			if(userScore > target) {
				crow.classList.add('melvor99');
			}
		}
	}
	function tagFinalBarLine(gname,crow,userScore,firstScore) {
		tagGeneric(gname,crow,userScore,firstScore);
		if(gname.includes("High Score")) {
			let target = 9999999;
			userScore = parseInt(userScore);
			if(userScore==target) {
				crow.classList.add('maxed');
			}
		}
	}
	function tagPokeclicker(gname,crow,userScore,firstScore) {
		tagGeneric(gname,crow,userScore,firstScore);
		if(gname.includes("EVs")) {
			let target = 50;
			userScore = parseInt(userScore);
			if(userScore >= target) {
				crow.classList.add('resisted');
			}
		}
	}
	function tagGeneric(gname,crow,userScore,firstScore) {
		crow.classList.add('submitted');
		if(userScore == firstScore) {
			crow.classList.add('first');
		}
	}

	//add in any game-specific highlights, set up the checking function to iterate, and apply the <style>
	let tagFunction = setupGame(gameNum, loadValue);
	applyHighlight(false); //we've just read the saved config out of localStorage, so no need to save it back

	let groups;
		//skip any enhancedTableLayout tables
	let masterTable = document.querySelectorAll('.gamelist:not(.enhancedTable)')[0];
	let tables = masterTable.getElementsByClassName('all'); //default, override as needed

	console.log("Iterating over tables");
	for(var t = 0; t < tables.length; t++) {
		let table = tables[t];
		//get group name
		let gname = table.firstElementChild.children[1].innerText.trim();

		//iterate over all row children of the table
		for(var r = 1; r < table.children.length; r++) {
			let crow = table.children[r];
			let scoreCell = crow.children[2];
			let scores = scoreCell.innerText.split(" /");
			let userScore = scores[0].trim().replaceAll(",","");
			let firstScore = scores[1].trim().replaceAll(",","");
			//check for missing scores
			if(userScore != "-") {
				//users has submitted a score, so add submitted class
				tagFunction(gname, crow, userScore, firstScore);
			}
		}
	}
})();
