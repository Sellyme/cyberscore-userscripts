// ==UserScript==
// @name		CS-ChartHighlighter
// @version		0.1.1
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
			case 1121: //Theatrhythm FF
			case 1509: //Curtain Call
			case 2779: //KH: Melody of Memory
			case 2893: //Dragon Quest
			case 3231: //Final Bar Line
				tagFunction = tagTheatrhythm;
				addCustomHighlight("maxed", "9,999,999s", loadValue);
				break;
			case 2836:
				tagFunction = tagDJMAX;
				addCustomHighlight("maxrate", "100% Rate", loadValue);
				break;
			case 2871: //osrs
				tagFunction = tagRuneScape;
				addCustomHighlight("rs99", "99 Skills", loadValue);
				addCustomHighlight("rs200", "200m Skills", loadValue);
				break;
			case 2885: //rs3
				tagFunction = tagRuneScape;
				addCustomHighlight("rs99", "99 Skills", loadValue);
				addCustomHighlight("rs200", "200m Skills", loadValue);
				break;
			case 3225:
				tagFunction = tagMelvor;
				addCustomHighlight("melvor99", "Melvor 99s/120s", loadValue);
				break;
			case 3279:
				tagFunction = tagPokeclicker;
				addCustomHighlight("completed", "Completed", loadValue);
				break;
			default:
				tagFunction = tagGeneric;
		}
		return tagFunction;
	}

	//this set of functions is called on any chart row if the user has a valid score on that chart
	//the exact behaviour of how to tag it varies by game
	//they receive the group name and chart row as arguments
	function tagDJMAX(gname,crow,userScore,firstScore) {
		tagGeneric(gname,crow,userScore,firstScore);
		if(gname.includes("Best Rate")) {
			let target = "100%";
			if(userScore == target) {
				crow.classList.add('maxrate');
			}
		}
	}
	function tagRuneScape(gname,crow,userScore,firstScore) {
		tagGeneric(gname,crow,userScore,firstScore);
		if(gname.includes("Skill experience")) {
			let target = 13034431;
			let target2 = 200000000
			userScore = parseInt(userScore);
			if(userScore >= target) {
				crow.classList.add('rs99');
				if(userScore >= target2) {
					crow.classList.add('rs200');
				}
			}
		}
	}
	function tagMelvor(gname,crow,userScore,firstScore) {
		tagGeneric(gname,crow,userScore,firstScore);
		if(gname.includes(" XP")) {
			let target = 13034431; //Level 99 Mastery
			if(gname.includes("Skill")) {
				target = 104273167; //Level 120 Skill
			}
			userScore = parseInt(userScore);
			if(userScore >= target) {
				crow.classList.add('melvor99');
			}
		}
	}
	function tagTheatrhythm(gname,crow,userScore,firstScore,gameNum) {
		tagGeneric(gname,crow,userScore,firstScore);
		if(
			((gameNum == 3231 || gameNum == 1121 || gameNum == 2779) && gname.includes("High Score")) || //Final Bar Line + Theatrhythm Final Fantasy + KH: Melody of Memory
			gameNum == 2893 || gameNum == 1509 //Dragon Quest + Curtain Call + KH: Melody of Memory
		) {
			let target = 9999999;
			if(gameNum = 2779 && gname.includes("Co-op")) {
			   target = 19999998;
			}
			userScore = parseInt(userScore);
			if(userScore==target) {
				crow.classList.add('maxed');
			}
		}
	}
	function tagPokeclicker(gname,crow,userScore,firstScore) {
		tagGeneric(gname,crow,userScore,firstScore);
		let target = false;
		if(gname.includes("EVs")) {
			target = 50;
		} else if(gname.includes("Routes")) {
			target = 10000;
		} else if(gname.includes("Gyms")) {
			target = 1000;
		} else if (gname.includes("Dungeons")) {
			target = 500;
		}
		if(target) {
			userScore = parseInt(userScore);
			if(userScore >= target) {
				crow.classList.add('completed');
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
			//if there's a "/" character in the chart suffix or it's a dual-sub chart, the primary submission will be the penultimate in the arrow
			//otherwise it will be at index 1
			let firstIdx = 1;
			if(scores.length > 2) {
				firstIdx = scores.length-2;
			}
			let firstScore = scores[firstIdx].trim().replaceAll(",","");
			//check for missing scores
			if(userScore != "-") {
				//users has submitted a score, so add submitted class
				tagFunction(gname, crow, userScore, firstScore, gameNum); //gameNum only parsed by multi-purpose functions
			}
		}
	}
})();
