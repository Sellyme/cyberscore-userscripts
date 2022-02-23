// ==UserScript==
// @name         CS-EnhancedTableLayouter
// @version      0.1
// @description  Allow two dimensional score tables in Cyberscore games. Based on Kyu's CS-TableLayouter for Pokemon Snap
// @author       Sellyme
// @include      https://cyberscore.me.uk/game/1550
// @include      https://cyberscore.me.uk/game/2785
// @namespace    https://github.com/Sellyme/cyberscore-userscripts/
// @homepageURL  https://github.com/Sellyme/cyberscore-userscripts/
// @downloadURL  https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-EnhancedTableLayouter.user.js
// @updateURL    https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-EnhancedTableLayouter.user.js
// ==/UserScript==
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
        case 1550:
            tables = document.getElementsByClassName("all");
            groupStart = 1;
            groupEnd = tables.length;
            break;
        case 2785:
            tables = document.getElementsByClassName("standard all");
            groupStart = 0;
            groupEnd = 4;
            break;
        default:
            tables = document.getElementsByClassName("standard all");
            groupStart = 0;
            groupEnd = tables.length;
    }
    const chartCount = tables[groupStart].getElementsByClassName("chart").length;

    let table = document.createElement("table");
    table.classList.add("gamelist");
    let tbody = document.createElement("tbody");
    table.appendChild(tbody);
    for(let i = 0; i < chartCount; i++){
        let row = document.createElement("tr");
        row.classList.add("chart");
        tbody.appendChild(row);
    }

    let groupNames = []
    for(let i = groupStart; i < groupEnd; i++){
        groupNames.push(tables[i].children[0].children[1].innerText)
        let charts = tables[i].getElementsByClassName("chart");
        for(let j = 0; j < charts.length; j++){
            let chart = charts[j];
            let rank = chart.children[0];
            let link = chart.children[1];
            let score = chart.children[2];

            if(i == groupStart){
                let chartName = document.createElement("td");
                chartName.appendChild(document.createTextNode(link.innerText.replaceAll(/\s/g,"")));
                tbody.children[j].appendChild(chartName);
            }

            let td = document.createElement("td");
            let small = document.createElement("small");
            td.appendChild(small);
            for(let k = 0; k < rank.children.length; k++){
                small.appendChild(rank.children[k].cloneNode(true));
            }
            let newLink = link.getElementsByTagName("a")[0].cloneNode(true);
            newLink.innerText = score.innerText.replace(/\n/g, "");
            td.appendChild(newLink);
            tbody.children[j].appendChild(td);
        }
    }

    let row = document.createElement("tr");
    row.classList.add("group");
    row.classList.add("standard");
    row.appendChild(document.createElement("td"));
    for(let i = groupStart; i < groupEnd; i++){
        let td = document.createElement("td");
        td.appendChild(document.createTextNode(groupNames[i-groupStart]));
        row.appendChild(td);
    }
    tbody.insertBefore(row, tbody.firstChild);

    let pageleft = document.getElementById("pageleft");
    pageleft.insertBefore(table, pageleft.children[4]);
})();