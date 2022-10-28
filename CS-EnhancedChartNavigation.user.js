// ==UserScript==
// @name         CS-EnhancedChartNavigation
// @version      1.0.4
// @description  Extends navigation between charts beyond just "Next"/"Previous"
// @author       Sellyme
// @include      https://cyberscore.me.uk/chart/*
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

	//build the right-hand side of navigation
	var nextDiv = document.createElement('div');
	nextDiv.style.display = "flex";
	nextDiv.style.justifyContent = "space-around"
	nextDiv.style.width = "50%"
	nextDiv.style.float = "right";

    //find the existing Select element and build the <options> list
    var sel = document.getElementsByName("id")[0];
    var opts = sel.getElementsByTagName("option");
    var optIdx = sel.selectedIndex; //this is the chart we're currently looking at

	//automatically create the desired previous navigation options
	var navsToCreate = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]; //adjust these if you'd like different nav options
	for(var i = 0; i < navsToCreate.length; i++) {
		var newNav = document.createElement('a');
		var chartPos = optIdx + navsToCreate[i];
        //only fill in nav link if the chart is within range
        if(chartPos >= 0 && chartPos < opts.length) {
            //use "Prev" and "Next" for differences of ±1, otherwise print the difference
            if(navsToCreate[i] == 1) {
                newNav.innerText = "Next";
            } else if(navsToCreate[i] == -1) {
                newNav.innerText = "Prev";
            } else if (navsToCreate[i] > 1) {
                newNav.innerText = "+"+navsToCreate[i];
            } else {
                newNav.innerText = navsToCreate[i];
            }
            newNav.href = opts[chartPos].value;
        }
        //and append to either prevDiv or newDiv depending on polarity of number
        //we do this outside the range checking block so that near the edges of the range the remaining links don't take up too much horizontal space
        if(navsToCreate[i] < 0) {
            prevDiv.appendChild(newNav);
        } else if (navsToCreate[i] > 0) {
            nextDiv.appendChild(newNav);
        } else {
            console.warn("CS-EnhancedChartNavigation Warning: Your navsToCreate configuration includes an invalid setting. Please use only non-zero integers.");
        }
	}

	//and chuck the fully-formed navs into the DOM
	navRow.appendChild(prevDiv);
	navRow.appendChild(nextDiv);
})();
