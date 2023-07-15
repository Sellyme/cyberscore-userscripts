// ==UserScript==
// @name		CS-EnhancedTableLayouter
// @version		1.0.7
// @description	Allow two dimensional score tables in Cyberscore games. Based on Kyu's CS-TableLayouter for Pokemon Snap
// @author		Sellyme
// @match		https://cyberscore.me.uk/game*/118
// @match		https://cyberscore.me.uk/game*/1419
// @match		https://cyberscore.me.uk/game*/1550
// @match		https://cyberscore.me.uk/game*/2006
// @match		https://cyberscore.me.uk/game*/2121
// @match		https://cyberscore.me.uk/game*/2123
// @match		https://cyberscore.me.uk/game*/2124
// @match		https://cyberscore.me.uk/game*/2125
// @match		https://cyberscore.me.uk/game*/1907
// @match		https://cyberscore.me.uk/game*/2363
// @match		https://cyberscore.me.uk/game*/2785
// @match		https://cyberscore.me.uk/game*/2911
// @match		https://cyberscore.me.uk/game*/3089
// @match		https://cyberscore.me.uk/game*/3228
// @match		https://cyberscore.me.uk/game*/3231
// @match		https://cyberscore.me.uk/game*/3279
// @match		https://cyberscore.me.uk/game*/3280
// @match		https://cyberscore.me.uk/game*/3283
// @match		https://cyberscore.me.uk/game*/3284
// @match		https://cyberscore.me.uk/game*/3288
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
	.enhancedTable tr:hover {
    	   background-color: #ccc;
	}
`
);

/*
A group object looks like the following:
var group = {
 'tables': document.getElementsByClassName("class descriptor"), //list of all group <table> elements that match the target CSS
 'groupStart': 0, //int describing start index of first group we want to use
 'groupEnd': 8, //1 higher than the index of the final group we want to use
 'tableID': 1, //unique identifier for this group WITHIN THIS GAME, allowing multiple groups to be created and reordered while preserving identifiers
 'tableName': "Name", //OPTIONAL name for the group in games where a distinction may be useful, if unfilled the group header just says "Collapse" as it is also the toggle button
}
This setup requires all relevant groups be contiguous in the chosen list
The reason for the unique identifiers is so that the collapse state of each table can be saved in local storage and remembered for future visits.
We use hardcoded IDs instead of just index within the page so that the addition of new table or other changes will not reset all of a user's settings.
*/


(function(){
	//for games where there's chart groups outside of the ones that suit a 2D records table, we need special handling
	//to do this we identify the start idx, end idx, and group types we want
	//otherwise we default to "Standard" chart type, and use all of them
	const urlComponents = window.location.href.split("/")
	const gameNum = parseInt(urlComponents[urlComponents.length - 1])
	//groupStart - index of the first group that we want to use
	//groupEnd - 1 higher than the index of the final group we want to use
	//tables - list of all group <table> elements that match the target CSS
	let groups;
	let masterTable = document.getElementsByClassName('gamelist')[0];
	let tables = masterTable.getElementsByClassName('all'); //default, override as needed
	switch(gameNum) {
		case 118: //Elastomania
			groups = [{
				tables: tables,
				groupStart: 1,
				groupEnd: 6,
				tableID: 1,
			}]
			break;
		case 1419: //Extreme Road Trip 2
			groups = [{
				tables: tables,
				groupStart: 0,
				groupEnd: 12,
				tableID: 1,
			}]
			break;
		case 1550: //Pokémon Rumble World
			groups = [{
				tables: tables,
				groupStart: 1,
				groupEnd: tables.length,
				tableID: 1,
			}]
			break;
		case 2006: //Pokémon Go
			groups = [
				{
					tables: tables,
					groupStart: 3,
					groupEnd: 8,
					tableID: 1,
					tableName: "Pokédex",
				},
				{
					tables: tables,
					groupStart: 8,
					groupEnd: 11,
					tableID: 2,
					tableName: "Mega Pokédex",
				},
				{
					tables: tables,
					groupStart: 12,
					groupEnd: 16,
					tableID: 3,
					tableName: "Sizes",
				},
			]
			break;
		case 2363: //Arcaea
			groups = [
				{
					tables: tables,
					groupStart: 0,
					groupEnd: 4,
					tableID: 1,
					tableName: "Scores",
				},
				{
					tables: tables,
					groupStart: 5,
					groupEnd: 9,
					tableID: 2,
					tableName: "Song Packs",
				}
			]
			break;
		case 2785: //Pokémon Snap 2
			tables = document.getElementsByClassName('standard all');
			groups = [{
				tables: tables,
				groupStart: 0,
				groupEnd: 5,
				tableID: 1,
			}]
			break;
		case 2911: //HyperRogue
			groups = [{
				tables: tables,
				groupStart: 2,
				groupEnd: 7,
				tableID: 1,
			}]
			break;
		case 3089: //Dustforce / Dustforce DX
			groups = [{
				tables: tables,
				groupStart: 0,
				groupEnd: tables.length,
				tableID: 1,
			}]
			break;
		case 3228: //Hades
			groups = [{
				tables: tables,
				groupStart: 6,
				groupEnd: 10,
				tableID: 1,
			}]
			break;
		case 3231: //Theatrhythm Final Bar Line
			//FBL has non-contiguous groups, so we have to pull in all of them and filter them based on name in the main loop body
			//but note that some logic depends on groupStart actually being the first group, so that still has to be correctly set for each table
			groups = [
				{
					tables: tables,
					groupStart: 2,
					groupEnd: 36,
					tableID: 1,
					tableName: "Standard Mode",
				},
				{
					tables: tables,
					groupStart: 3,
					groupEnd: 36,
					tableID: 2,
					tableName: "Pair Mode",
				},
				{
					tables: tables,
					groupStart: 4,
					groupEnd: 36,
					tableID: 3,
					tableName: "Simple Mode",
				}
			]
			break;
		case 3279: //Pokéclicker
			groups = [{
				tables: tables,
				groupStart: 1,
				groupEnd: 6,
				tableID: 1,
			}]
			break;
		case 3280: //ChainBeeT
			groups = [
				{
					tables: tables,
					groupStart: 0,
					groupEnd: 5,
					tableID: 1,
					tableName: "Songs",
				},
				{
					tables: tables,
					groupStart: 8,
					groupEnd: tables.length,
					tableID: 2,
					tableName: "Courses",
				}
			];
			break;
		case 3284: //Can't Live Without Electricity
			groups = [{
				tables: tables,
				groupStart: 0,
				groupEnd: 2,
				tableID: 1,
				tableName: "Square Grid",
			},
			{
				tables: tables,
				groupStart: 2,
				groupEnd: 4,
				tableID: 2,
				tableName: "Hexagon Grid"
			}];
			break;
		default:
			groups = [{
				tables: tables,
				groupStart: 0,
				groupEnd: tables.length,
				tableID: 1,
			}];
	}

	for (var t = 0; t < groups.length; t++) {
		//pull out all of the variables for this table
		let tables = groups[t].tables;
		let groupStart = groups[t].groupStart;
		let groupEnd = groups[t].groupEnd;
		let tableID = "eTL-" + gameNum + "-" + groups[t].tableID;
		let tableName = "tableName" in groups[t] ? groups[t].tableName : "Collapse";

		//PokeClicker's primary table (# Defeated) is the third in its list, so we need to reorder things to get it to work
		if(gameNum==3279) {
			tables = Array.prototype.slice.call(tables);
			var primarytable = tables[3]
			tables.splice(3, 1);
			tables.splice(1, 0, primarytable);
		}

		const chartCount = tables[groupStart].getElementsByClassName("chart").length;

		let table = document.createElement("table");
		table.classList.add("gamelist","enhancedTable");
		table.style = "margin-bottom: 5px;";
		let thead = document.createElement("thead");
		let tbody = document.createElement("tbody");
		thead.classList.add("standard", "all");
		tbody.setAttribute("data-groupid", tableID); //also add a custom groupID so the collapse remembering will work
		tbody.classList.add("standard", "all", "collapsed"); //start collapsed by default, uncollapse based on localStorage
		loadState(tbody); //calls native CS function to uncollapse if needed
		table.appendChild(thead);
		//and start building the body
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
			if (gameNum==2363) { //Arcaea
				groupName = groupName.replace("Song Packs – ","");
			} else if(gameNum==2911) { //HyperRogue
				groupName = groupName.replace("Treasure Collected by Land (","").replace(")","");
			} else if (gameNum==3089) { //Dustforce
				groupName = groupName.replace("Fastest Time ","Time ").replace("SS Rank","SS");
			} else if (gameNum==3228) { //Hades
				groupName = groupName.replace("Permanent Record – ","");
			} else if(gameNum==3231) { //Theatrhythm Final Bar Line
				//Standard seems to be the main gamemode people use
				//and until I implement multi-tables, we can't fit all of them on screen
				//so for now we just won't render Simple or Pair groups
				if(!groupName.includes(tableName.split(" ")[0])) {
					continue;
				}
				groupName = groupName.replace("Score ","").replace("High ","").replace("Max ","").replace("Times ","");
				groupName = groupName.replace("Basic","BA").replace("Expert","EX").replace("Ultimate","UL").replace("Supreme","SU");
				//when implementing multi-tables, we need to move this into the table-wide header!
				groupName = groupName.replace(" – Standard","").replace(" – Pair","").replace(" – Simple","");
			} else if(gameNum==3283) {
				groupName = groupName.replace("Time Trial – ","");
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
				//DLC and MP charts have way too much whitespace around them, so handle that
				//a chart can have both tags, in which case MP comes first. So strip that one first.
				//note that the multiplayer handling only supports charts with 2-9 players
				//if we ever need to support a game with a 10P+ chart, this will need to be replaced with regex
				if(chartName[0] == "[" && chartName.substring(2,4) == "P]") {
					//we don't care about including the multiplayer designation at all in the table layout
					chartName = chartName.substring(5).trim();
				}
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
		//to stick the header row to the top of the table when scrolling we need some custom CSS, which we apply to each <th> cell
		//(it'd be better to just inject a class CSS rule but this is fairly simple for now so it's probably okay)
		headerRow.style.position = "sticky";
		headerRow.style.top = 0;
		headerRow.style.zIndex = 1;
		//add a collapse button
		let collapseCell = document.createElement("th");
		let collapseLink = document.createElement("a");
		collapseLink.innerText = tableName;
		collapseLink.href = "#";
		collapseLink.onclick = function() {return toggleGroup(tbody)}; //part of CS's standard JS suite
		collapseCell.appendChild(collapseLink);
		collapseCell.style.backgroundColor = "var(--color-standard)"; //this colour name is part of the CS global libs
		headerRow.appendChild(collapseCell);
		//and then add the group names
		for(let i = 0; i < groupNames.length; i++){
			let th = document.createElement("th");
			//more sticky header CSS
			th.style.backgroundColor = "var(--color-standard)";
			th.appendChild(document.createTextNode(groupNames[i]));
			headerRow.appendChild(th);
		}
		thead.appendChild(headerRow);

		let pageleft = document.getElementById("pageleft");
		pageleft.insertBefore(table, pageleft.children[pageleft.children.length-1]);
	}
})();
