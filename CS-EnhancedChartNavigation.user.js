// ==UserScript==
// @name         CS-EnhancedChartNavigation
// @version      0.3
// @description  Extends navigation between charts beyond just "Next"/"Previous"
// @author       Sellyme
// @namespace    https://github.com/Sellyme/cyberscore-userscripts/
// @downloadURL  https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-EnhancedChartNavigation.user.js
// @homepageURL  https://github.com/Sellyme/cyberscore-userscripts/
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
	var navPrev = document.createElement('div');
	navPrev.style.display = "flex";
	navPrev.style.justifyContent = "space-around"
	navPrev.style.width = "50%"
	navPrev.style.float = "left";

	//automatically create the desired previous navigation options
	var navsToCreate = [-5, -4, -3, -2]; //adjust these if you'd like different nav options
	for(var i = 0; i < navsToCreate.length; i++) {
		var offset = navsToCreate[i]
		var newNav = document.createElement('a');
		newNav.innerText = navsToCreate[i];
		newNav.href = "/chart/" + (currChart+offset)
		navPrev.appendChild(newNav);
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
	navPrev.appendChild(prevNav) //don't @ me about these naming conventions

	//build the right-hand side of navigation
	var navNext = document.createElement('div');
	navNext.style.display = "flex";
	navNext.style.justifyContent = "space-around"
	navNext.style.width = "50%"
	navNext.style.float = "right";

	//for this one we need to append the "Next" first
	var nextNav = document.createElement('a');
	nextNav.innerText = "Next";
	if(nextLink == undefined) {
		//if the link is undefined (outside of the selected group), overwrite it with a +1
		nextNav.href = "/chart/" + (currChart + 1)
	} else {
		nextNav.href = nextLink;
	}
	navNext.appendChild(nextNav);
	//and then automatically create the next navigation options
	var navsToCreate = [2, 3, 4, 5]; //adjust these if you'd like different nav options
	for(var i = 0; i < navsToCreate.length; i++) {
		var offset = navsToCreate[i]
		var newNav = document.createElement('a');
		newNav.innerText = "+"+navsToCreate[i];
		newNav.href = "/chart/" + (currChart+offset)
		navNext.appendChild(newNav);
	}

	//and chuck them into the DOM
	navRow.appendChild(navPrev);
	navRow.appendChild(navNext);
})();
