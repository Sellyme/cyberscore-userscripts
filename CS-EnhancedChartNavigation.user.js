// ==UserScript==
// @name         CS-EnhancedChartNavigation
// @version      1.0
// @description  Extends navigation between charts beyond just "Next"/"Previous"
// @author       Sellyme
// @namespace    https://github.com/Sellyme/cyberscore-userscripts/
// @homepageURL  https://github.com/Sellyme/cyberscore-userscripts/
// @downloadURL  https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-EnhancedChartNavigation.user.js
// @updateURL    https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-EnhancedChartNavigation.user.js
// ==/UserScript==
(function(){
	//get all the required variables
	var navRow = document.getElementsByClassName('charts-show-navigation')[0].children[0];
	var URLComponents = window.location.href.split("/");
	var currChart = parseInt(URLComponents[URLComponents.length - 1]);
	var prevLink = navRow.children[0].href;
	var nextLink = navRow.children[1].href;

	//clear out the existing navigation
	navRow.innerHTML = "";
	navRow.style.display = "block";
	navRow.style.justifyContent = "";

	//build the left-hand side of navigation
	var prevDiv = document.createElement('div');
	prevDiv.style.display = "flex";
	prevDiv.style.justifyContent = "space-around"
	prevDiv.style.width = "50%"
	prevDiv.style.float = "left";

	//automatically create the desired previous navigation options
	var navsToCreate = [-5, -4, -3, -2]; //adjust these if you'd like different nav options
	for(var i = 0; i < navsToCreate.length; i++) {
		var offset = navsToCreate[i]
		var newNav = document.createElement('a');
		newNav.innerText = navsToCreate[i];
		newNav.href = "/chart/" + (currChart+offset)
		prevDiv.appendChild(newNav);
	}
	//and also append the "Prev" to the end
	var prevNav = document.createElement('a');
	prevNav.innerText = "Prev";
	if(prevLink == undefined) {
		//if the link is undefined (outside of the selected group), overwrite it with a -1
		prevNav.href = "/chart/" + (currChart - 1)
	} else {
		prevNav.href = prevLink;
	}
	prevDiv.appendChild(prevNav)

	//build the right-hand side of navigation
	var nextDiv = document.createElement('div');
	nextDiv.style.display = "flex";
	nextDiv.style.justifyContent = "space-around"
	nextDiv.style.width = "50%"
	nextDiv.style.float = "right";

	//for this one we need to append the "Next" first
	var nextNav = document.createElement('a');
	nextNav.innerText = "Next";
	if(nextLink == undefined) {
		//if the link is undefined (outside of the selected group), overwrite it with a +1
		nextNav.href = "/chart/" + (currChart + 1)
	} else {
		nextNav.href = nextLink;
	}
	nextDiv.appendChild(nextNav);
	//and then automatically create the next navigation options
	var navsToCreate = [2, 3, 4, 5]; //adjust these if you'd like different nav options
	for(var i = 0; i < navsToCreate.length; i++) {
		var offset = navsToCreate[i]
		var newNav = document.createElement('a');
		newNav.innerText = "+"+navsToCreate[i];
		newNav.href = "/chart/" + (currChart+offset)
		nextDiv.appendChild(newNav);
	}

	//and chuck them into the DOM
	navRow.appendChild(prevDiv);
	navRow.appendChild(nextDiv);
})();
