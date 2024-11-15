// ==UserScript==
// @name		CS-StaffTools
// @version		0.0.1
// @description	Extends the functionality of moderation tools on Cyberscore. If you are not CS staff, this script is of no use to you
// @author		Sellyme
// @match		https://cyberscore.me.uk/game-entity-locks/*
// @namespace	https://github.com/Sellyme/cyberscore-userscripts/
// @homepageURL	https://github.com/Sellyme/cyberscore-userscripts/
// @downloadURL	https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-StaffTools.user.js
// @updateURL	https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-StaffTools.user.js
// @grant		GM_addStyle
// ==/UserScript==
(function(){
	function autoPick() {
		var content = document.getElementById("contentcontainer")
		var selects = content.getElementsByTagName("select");
		var name = selects[1].selectedOptions[0].innerText.trim();
		var charts = selects[0].getElementsByTagName("option");
		for (var chart of charts) {
			if(chart.innerText.trim() == name) {
				chart.selected = "selected"
			}
		}
		content.getElementsByTagName("form")[0].submit()
	}

	var submitBtn = document.getElementById("contentcontainer").getElementsByTagName("input")[0]
	var newBtn = document.createElement("button");
	newBtn.innerText = "Auto-pick";
	submitBtn.parentElement.insertBefore(newBtn, submitBtn.previousElementSibling);
})();
