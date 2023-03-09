// ==UserScript==
// @name		CS-EnhancedTableLayouter
// @version		0.8.6
// @description	Allow two dimensional score tables in Cyberscore games. Based on Kyu's CS-TableLayouter for Pokemon Snap
// @author		Sellyme
// @match		https://cyberscore.me.uk/game*/118
// @match		https://cyberscore.me.uk/game*/1419
// @match		https://cyberscore.me.uk/game*/1550
// @match		https://cyberscore.me.uk/game*/2006
// @match		https://cyberscore.me.uk/game*/2785
// @match		https://cyberscore.me.uk/game*/2911
// @match		https://cyberscore.me.uk/game*/3089
// @match		https://cyberscore.me.uk/game*/3228
// @match		https://cyberscore.me.uk/game*/3231
// @namespace	https://github.com/Sellyme/cyberscore-userscripts/
// @homepageURL	https://github.com/Sellyme/cyberscore-userscripts/
// @downloadURL	https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-EnhancedTableLayouter.user.js
// @updateURL	https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-EnhancedTableLayouter.user.js
// @grant		GM_addStyle
// ==/UserScript==
GM_addStyle(
`
	.enhancedTable img {
		top: 3px;
		position: relative;
	}
`
);

(function(){
	//for games where there's chart groups outside of the ones that suit a 2D records table, we need special handling
	//to do this we identify the start idx, end idx, and group types we want
	//otherwise we default to "Standard" chart type, and use all of them
	const urlComponents = window.location.href.split("/")
	const gameNum = parseInt(urlComponents[urlComponents.length - 1])
	//groupStart - index of the first group that we want to use
	//groupEnd - 1 higher than the index of the final group we want to use
	//tables - list of all group <table> elements that match the target CSS
	//this setup requires all relevant groups be contiguous in the chosen list
	let groupStart, groupEnd, tables;
	switch(gameNum) {
		case 118: //Elastomania
			tables = document.getElementsByClassName("all");
			groupStart = 1;
			groupEnd = 6;
			break;
		case 1419: //Extreme Road Trip 2
			tables = document.getElementsByClassName("all");
			groupStart = 0;
			groupEnd = 12;
			break;
		case 1550: //Pokémon Rumble World
			tables = document.getElementsByClassName("all");
			groupStart = 1;
			groupEnd = tables.length;
			break;
		case 2006: //Pokémon Go
			tables = document.getElementsByClassName("all");
			groupStart = 3;
			groupEnd = 8;
			break;
		case 2785: //Pokémon Snap 2
			tables = document.getElementsByClassName("standard all");
			groupStart = 0;
			groupEnd = 5;
			break;
		case 2911: //HyperRogue
			tables = document.getElementsByClassName("all");
			groupStart = 2;
			groupEnd = 7;
			break;
		case 3089: //Dustforce / Dustforce DX
			tables = document.getElementsByClassName("all");
			groupStart = 0;
			groupEnd = tables.length;
			break;
		case 3228: //Hades
			tables = document.getElementsByClassName("all");
			groupStart = 6;
			groupEnd = 10;
			break;
		case 3231: //Theatrhythm Final Bar Line
			tables = document.getElementsByClassName("all");
			headerText = "Standard Mode";
			groupStart = 2;
			groupEnd = 36;
			break;
		default:
			tables = document.getElementsByClassName("standard all");
			headerText = "Collapse";
			groupStart = 0;
			groupEnd = tables.length;
	}
	const chartCount = tables[groupStart].getElementsByClassName("chart").length;

	let table = document.createElement("table");
	table.classList.add("gamelist","enhancedTable");
	table.style = "margin-bottom: 5px;";
	let thead = document.createElement("thead");
	let tbody = document.createElement("tbody");
	thead.classList.add("standard", "all");
	tbody.classList.add("standard", "all");
	table.appendChild(thead);
	table.appendChild(tbody);
	for(let i = 0; i < chartCount; i++){
		let row = document.createElement("tr");
		row.classList.add("chart");
		tbody.appendChild(row);
	}

	let groupNames = [];
	let chartNames = [];
	for(let i = groupStart; i < groupEnd; i++){
		let groupName = tables[i].children[0].children[1].innerText;
		//for games with long/redundant group names, shorten them
		if(gameNum==2911) { //HyperRogue
			groupName = groupName.replace("Treasure Collected by Land (","").replace(")","");
		} else if (gameNum==3089) { //Dustforce
			groupName = groupName.replace("Fastest Time ","Time ").replace("SS Rank","SS");
		} else if (gameNum==3228) { //Hades
			groupName = groupName.replace("Permanent Record – ","");
		} else if(gameNum==3231) { //Theatrhythm Final Bar Line
			//Standard seems to be the main gamemode people use
			//and until I implement multi-tables, we can't fit all of them on screen
			//so for now we just won't render Simple or Pair groups
			if(!groupName.includes("Standard")) {
				continue;
			}
			groupName = groupName.replace("Score ","").replace("High ","").replace("Max ","").replace("Times ","");
			groupName = groupName.replace("Basic","BA").replace("Expert","EX").replace("Ultimate","UL").replace("Supreme","SU");
			//when implementing multi-tables, we need to move this into the table-wide header!
			groupName = groupName.replace(" – Standard","");
		}
		groupNames.push(groupName)

		//c represents the current chart count of THIS group, so that we can skip an chart from the main group and stay synced
		let charts = tables[i].getElementsByClassName("chart");
		//charts is the array of existing charts for the selected group
		//c indexes our current position in this array
		//we're about to iterate over chartCount, which is the total number of charts in the parent group
		//and j indicates the index for that array
		//when we want to skip a chart from the main group (because it's not in the current group) we should be incrementing j, but not c
		//and we should keep going until j exceeds chartCount
		console.log("GENERATING CHARTS FOR GROUP " + groupName);
		console.log("Expecting up to " + chartCount + " charts, found " + charts.length);
		for(let j = 0, c = 0; j < chartCount; j++){
			//if we've run out of charts in this group, just print out an empty cell for all remaining charts in the main group
			let td = document.createElement("td");
			if(c >= charts.length) {
				tbody.children[j].appendChild(td);
				c++;
				continue;
			}

			//otherwise, get chart data
			let chart = charts[c];
			let rank = chart.children[0];
			let link = chart.children[1];
			let score = chart.children[2];
			let chartName = link.innerText.trim();
			//DLC charts have way too much whitespace around them, so handle that
			if(chartName.substring(0,5) == "[DLC]") {
				chartName = "[DLC] " + chartName.substring(5).trim();
			}
			//and Final Bar Line charts say "Final Fantasy" way too much
			if(gameNum==3231) {
				chartName = chartName.replace("Theatrhythm Final Fantasy","TFF").replace("Final Fantasy","FF").replace("Crystal Chronicles Remastered Edition","CCRE");
			}

			//we want to colour the hyperlink to the chart (which in this format is the score) according to the chart type
			//to do this we look at the existing hyperlink and just yoink its styling
			let linkColor = getComputedStyle(link.firstElementChild).color;

			if(i == groupStart){
				//only set the chartName on the first group
				chartNames[j] = chartName;
				let nameNode = document.createElement("td");
				if(chartName.length > 50) {
					nameNode.appendChild(document.createTextNode(chartName.substring(0,50)+"…"));
					nameNode.title = chartName;
				} else {
					nameNode.appendChild(document.createTextNode(chartName));
				}
				tbody.children[j].appendChild(nameNode);
			}

			//we need some special handling for Extreme Road Trip 2
			if(gameNum==1419) {
				//for most groups the chart for your best score independent of vehicle is named "Overall"
				//however in Best 2K, Best 5K, and Best 10K the chart is named "Any Vehicle"
				//so we just force those two strings to match each other
				//(we can do this after setting chartNames[] since the first occurence is at i=8)
				if(chartName == "Any Vehicle") {
					chartName = "Overall";
				}
			}

			//if we don't match the chart name from the primary group, leave this cell blank
			//note that this means every single chart in any group MUST be in the groupStart group, in order
			if(chartName != chartNames[j]) {
				//console.log("Skipping chart '" + chartNames[j] + "' as it doesn't match next chart '" + chartName + "'");
				tbody.children[j].appendChild(td);
			} else {
				let small = document.createElement("small");
				td.appendChild(small);
				//copy in the medal icon if applicable
				if(rank.children.length > 0) {
					for(let k = 0; k < rank.children.length; k++){
						small.appendChild(rank.children[k].cloneNode(true));
					}
				} else if (rank.innerText) { //otherwise just take positional text
					small.innerText = rank.innerText.trim();
				}
				let newLink = link.getElementsByTagName("a")[0].cloneNode(true);
				newLink.innerText = " " + score.innerText.trim().replace(/\n/g, "");
				newLink.style.color = linkColor;
				td.appendChild(newLink);
				tbody.children[j].appendChild(td);
				c++; //no, this is JavaScript
			}
		}
	}

	//build the header row
	let headerRow = document.createElement("tr");
	headerRow.classList.add("group");
	headerRow.classList.add("standard");
	//add a collapse button
	let collapseCell = document.createElement("th");
	let collapseLink = document.createElement("a");
	collapseLink.innerText = headerText;
	collapseLink.href = "#";
	collapseLink.onclick = function() {return toggleGroup(tbody)}; //part of CS's standard JS suite
	collapseCell.appendChild(collapseLink);
	//to stick the header row to the top of the table when scrolling we need some custom CSS, which we apply to each <th> cell
	//(it'd be better to just inject a class CSS rule but this is fairly simple for now so it's probably okay)
	collapseCell.style.backgroundColor = "var(--color-standard)"; //this colour name is part of the CS global libs
	collapseCell.style.position = "sticky";
	collapseCell.style.top = 0;
	headerRow.appendChild(collapseCell);
	//and then add the group names
	for(let i = 0; i < groupNames.length; i++){
		let th = document.createElement("th");
		//more sticky header CSS
		th.style.backgroundColor = "var(--color-standard)";
		th.style.position = "sticky";
		th.style.top = 0;
		th.appendChild(document.createTextNode(groupNames[i]));
		headerRow.appendChild(th);
	}
	thead.appendChild(headerRow);

	let pageleft = document.getElementById("pageleft");
	pageleft.insertBefore(table, pageleft.children[pageleft.children.length-1]);
})();
