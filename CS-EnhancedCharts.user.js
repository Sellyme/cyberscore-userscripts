// ==UserScript==
// @name		CS-Enhanced Charts
// @version		0.4.3
// @description	Add various extended functionality to Cyberscore chart pages
// @author		Sellyme
// @match		https://cyberscore.me.uk/chart/*
// @match		https://cyberscore.me.uk/charts/*
// @namespace	https://github.com/Sellyme/cyberscore-userscripts/
// @homepageURL	https://github.com/Sellyme/cyberscore-userscripts/
// @downloadURL	https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-EnhancedCharts.user.js
// @updateURL	https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-EnhancedCharts.user.js
// @require		https://cdn.jsdelivr.net/npm/chart.js@3.8.0/dist/chart.min.js
// @require		https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js
// ==/UserScript==
(function() {
	var chartData = {"users": {}};
	buildUI();

	var debug = false;
	var manualCorrections = {
		//type change -  display the update as having the value of fixedScore instead of what was submitted (for use correcting obvious typos)
		//type delete - completely ignore this record update (for use when "correct" score unknown")
		//type keep - even if this score gets caught by the autocorrection system, display it anyway (for use if the game changed and body of work scores got decreased)
		4059012: {"type": "change", "fixedScore": 3}, //One in a Trillion - Braxton Completion Marks (c:615383)
		4015113: {"type": "change", "fixedScore": 5253104}, //One in a Trillion - Taps (c:594040)
		4015114: {"type": "delete"}, //One in a Trillion - Taps + Gem Pops (c:594039)
		3994829: {"type": "change", "fixedScore": 13040}, //One in a Trillion - Total eggs found (c:594042)
		5453729: {"type": "delete"}, 5532688: {"type": "delete"}, 5457127: {"type": "delete"}, 5712707: {"type": "delete"}, 5455163: {"type": "delete"}, //Melvor Successful Cooks autosub errors (c:645533)
		5566817: {"type": "delete"}, 5625977: {"type": "delete"}, 5683630: {"type": "delete"}, 5701447: {"type": "delete"}, 5707609: {"type": "delete"}, //more Melvor Successful Cooks
		5468935: {"type": "delete"}, 5470780: {"type": "delete"}, 5463854: {"type": "delete"}, 5464635: {"type": "delete"}, 5590431: {"type": "delete"}, //yet more Melvor Successful Cooks

	};

	async function buildUI() {
		//first problem - we need to jam all of this crap into the header
		//to do this we allow the header flexbox to wrap, and add in a 0-height 100% width div to force a wrap
		//once we do that we have a shiny new line to print our buttons on
		var insertPoint = document.getElementsByClassName('charts-show-title-header')[0];
		insertPoint.style.flexWrap = "wrap";
		var flexBreak = document.createElement('div')
		flexBreak.classList.add("flexBreak");
		flexBreak.style.flexBasis = "100%";
		flexBreak.style.height = 0;
		insertPoint.appendChild(flexBreak);

		var ecMenu = document.createElement('div');
		ecMenu.id = "enhancedChartsMenu";
		var showGraphBtn = document.createElement('button');
		showGraphBtn.id = "showGraphBtn";
		showGraphBtn.innerText = "Show Graph";
		showGraphBtn.classList.add("btn-game--standard"); //hijack existing styling
		showGraphBtn.onclick = function() { displayChart(true); };
		ecMenu.appendChild(showGraphBtn)
		insertPoint.appendChild(ecMenu);

		//and let's also create and add the (hidden) chart element while we're here
		//chuck in another flexBreak to make life easier
		insertPoint.appendChild(flexBreak.cloneNode());
		var chartBox = document.createElement('div');
		chartBox.id = "chartBox";
		chartBox.style.display = "none";
		chartBox.style.height = "750px";
		chartBox.style.width = "100%";
		insertPoint.appendChild(chartBox);
	}

	async function displayChart(firstLoad) {
		var chartBox = document.getElementById('chartBox');
		if(firstLoad) {
			var chartEl = document.createElement('canvas');
			chartEl.id = "chartCanvas";
			chartEl.height = "750px";
			chartEl.width = "100%";
			chartBox.appendChild(chartEl);
			await getChartData();
			drawChart(chartData);
		}

		chartBox.style.display = "block";
		var showGraphBtn = document.getElementById('showGraphBtn');
		showGraphBtn.onclick = function() { hideChart(); };
		showGraphBtn.innerText = "Hide Graph";
	}

	async function getChartData() {
		//pull out the chart ID
		var pathElements = location.pathname.split("/");
		var chartID = pathElements[pathElements.length-1];
		//call the API
		var API_URL = "https://cyberscore.me.uk/chart-submission-history/" + chartID + ".json"
		var page = await fetch(API_URL);
		var json = await page.json();
		parseData(json);
	}

	function parseData(json) {
		//work out chart type (time or score)
		if(json.chart_type == 1){
			chartData.chartType = "time";
			chartData.chartDir = "low"
		} else if (json.chart_type == 2) {
			chartData.chartType = "time";
			chartData.chartDir = "high";
		} else if (json.chart_type == 3) {
			chartData.chartType = "score";
			chartData.chartDir = "low";
		} else if (json.chart_type == 4) {
			chartData.chartType = "score";
			chartData.chartDir = "high";
		} else if (json.chart_type == 5) {
			//this is "Rank", which we can treat exactly like lowest score
			chartData.chartType = "score";
			chartData.chartDir = "low";
		}
		var users = chartData.users;

		var subs = json.submissions;
		for(var i = 0; i < subs.length; i++) {
			var sub = subs[i];

			//we only want first submissions ("f"), updates ("u"), and staff edits ("e"), ignore all other entries
			if(sub.update_type !== "u" && sub.update_type !== "f" && sub.update_type !== "e") {
				continue;
			}

			var user_id = sub.user_id;
			if(!users.hasOwnProperty(user_id)) {
				var user_name = sub.username;
				users[user_id] = {"user": user_name, "scores": []};
			}
			//todo - right now we just ignore score2, since it's very rarely relevant

			var score = {"type": "update", "time": sub.update_date, "score": sub.submission, "score2": sub.submission2, "history_id": sub.history_id, "comment": sub.comment};
			//do any manual corrections that have been saved
			if(sub.history_id in manualCorrections) {
				var correction = manualCorrections[sub.history_id];
				if(correction.type == "delete") {
					//abandon the score object and move to next
					continue;
				} else if (correction.type == "keep") {
					score.keep = true;
				} else {
					score.score = correction.fixedScore;
				}
			}

			users[user_id].scores.push(score);
		}
		//and now for each user we want to sort scores[] to go from oldest to newest
		for(var key in users) {
			var userObj = users[key];
			userObj.scores.sort(function compare(a,b) {
				if(a.update_date > b.update_date) {
					return 1;
				} else if (a.update_date < b.update_date) {
					return -1;
				} else {
					return 0;
				}
			})
		}
	}

	function drawChart(chartData) {
		//most of this could be cut out and done at the downloading/parsing phase once it's finalised
		var users = chartData.users;

		//create the chart with all the desired formatting but no data yet
		var ctx = document.getElementById('chartCanvas').getContext('2d');
		var myChart = new Chart(ctx, {
			type: 'scatter',
			responsive: true,
			options: {
				backgroundColor: "#000",
				defaultColor: "#fff",
				defaultFontColor: "#808080",
				pointBackgroundColor: "#fff",
				stepped: "before",
				showLine: true,
				spanGaps: true,
				scales: {
					x: {
						type: "time",
						parser: false,
						position: "bottom",
						scaleLabel: {
							display: true,
							labelString: "Date",
						},
						ticks: {
							autoSkip: true,
							maxTicksLimit: 20,
						}
					},
					y: {
						scaleLabel: {
							display: true,
							labelString: "Score",
						},
						ticks: {
							//format ticks as times if necessary
							callback: function(value, index, ticks) {
								if(chartData.chartType == "time") {
									return formatAsHHMMSS(value);
								} else {
									return value;
								}
							},
							precision: 3,
						}
					}
				},
				plugins: {
					tooltip: {
						filter: function(tooltipitem) {
							//hide the tooltip for the first data item (since that's always the faked "0" element)
							return tooltipitem.dataIndex != 0;
						},
						itemSort: function(a, b) {
							if(chartData.chartDir = "high") {
								return a.raw - b.raw;
							} else {
								return b.raw - a.raw;
							}
						},
						callbacks: {
						/*title: function(context) {
							return context[0].dataset.label;
						},*/
							beforeLabel: function(tooltip) {
								if(debug) { console.log("beforeLabel"); console.log(tooltip); }
								//check to see if this entry is a "faked" one with the current datetime
								//that was used to extend the line to right of screen
								var dateLabel;
								if('realdatetime' in tooltip.dataset.data[tooltip.dataIndex]) {
									dateLabel = tooltip.dataset.data[tooltip.dataIndex].realdatetime;
								} else {
									dateLabel = tooltip.label;
								}
								return "Date: " + dateLabel;
							},
							label: function(tooltip) {
								if(debug) { console.log("Label:"); console.log(tooltip); }
								//for time-based scores we want to parse it first
								var score;
								if(chartData.chartType == "time") {
									score = formatAsHHMMSS(tooltip.formattedValue);
								} else {
									score = tooltip.formattedValue;
								}
								return "Score: " + score;
							},
							afterLabel: function(tooltip) {
								var author_str = "By: " + tooltip.dataset.label;
								if(debug) {
									console.log("afterLabel"); console.log(tooltip);
									author_str += " (id:" + tooltip.raw.history_id +")";
								}
								return author_str;
							}
						}
					}
				}
			}
		});

		var scoreData = [];
		var lowestValidScore = null;
		var highestValidScore = null;
		var currTime = new Date().getTime();
		var colour_idx = 0;
		for(var key in users) {
			var userObj = users[key];
			var userName = userObj.user;
			var scores = userObj.scores
			var formattedScores = [];

			//note that scores[] is in chronological order, so the 0th score is the oldest one
			for(var j = 0; j < scores.length; j++) {
				var score = scores[j];
				var date = new Date(score.time);
				//the API outputs all timestamps in server time. We ideally want to represent things in the user's local time
				//while there's no guarantee that the user's PC is set to the same timezone as their user account, we assume that it is
				//so for every timestamp we receive from the API, we need to find the user's current timezone offset from UTC
				var offset = date.getTimezoneOffset();
				//offset is the number of MINUTES you add to the user's current time in order to reach UTC. Someone in UTC-5 needs to add 300 minutes to their time
				//to get to UTC, so their offset is 300. Someone in UTC+1 needs to *subtract* 60 minutes, so their offset is -60
				//Since we're converting away from UTC to the user's timezone, we actually need the inverse of this, so we subtract the offset instead of adding it
				var utc_timestamp = date.getTime(); //creating a unix timestamp and doing maths on it is easier than actually modifying the date object
				var tz_corrected_date = new Date(utc_timestamp - (offset * 60 * 1000));
				var timestamp = tz_corrected_date.getTime();
				var scoreObj = {"x": timestamp, "y": score.score, "history_id": score.history_id};

				//before the oldest submission time, draw a line from that score to a 0 score at the same timestamp
				//(it's probably fine that we're doing this before the sanity checking step, but maybe shuffle it around if it generates any weird graphs)
				if(j == 0) {
					//note that in the case of "lowest wins" scores, we want to draw the line *up*, so check that
					if(chartData.chartDir == "high") {
						formattedScores.push({"x": timestamp-1, "y": 0});
					} else if (chartData.chartDir == "low") {
						formattedScores.push({"x": timestamp-1, "y": Number.MAX_SAFE_INTEGER});
					}
				}

				//basic sanity checking for historical scores
				//(if the score is marked as an explicit keep, don't sanity check)
				if(j < scores.length - 1 && !("keep" in scores[j])) {
					//we can just ignore any score that lasted less than 60 seconds - probably a typo and won't really be visible anyway
					var nextScore = scores[j+1];
					var nextScore_utc = new Date(nextScore.time).getTime();
					//timestamps are in milliseconds, so 60000 is 60 seconds
					//compare to the non-timezone-adjusted timestamp for this, to save having to convert the second timestamp as well
					if(nextScore_utc - utc_timestamp < 60 * 1000) {
						continue; //then skip the older score, as it was likely a typo that was immediately corrected
					} else if (nextScore_utc - utc_timestamp < 24 * 60 * 60 * 1000) { //24hr * 60 minutes * 60 seconds * 1000ms
						//we also want to skip scores that were replaced within a slightly larger time frame (1 day?) under some conditions
						//as these are almost certainly typos
						//(right now we assume that users never make two mistakes in a row... which might be an issue)
						//condition A - the score was replaced with a worse score
						//if the nextScore is higher and chartType is higher wins,  OR nextScore is lower and chartType is lower wins, ignore
						if((score.score > nextScore.score && chartData.chartDir == "high") || (score.score < nextScore.score && chartData.chartDir == "low")) {
							continue;
						}

						//condition B - it was a worse score than the user's previous one, and was replaced with a *better* score than the user's previous one
						//(only need to run if index > 0)
						if(j > 0) {
							var lastScore = scores[j-1];
							//logic on this one is very slightly more complicated so we run on each chartDir separately rather than in one statement
							if(chartData.chartDir == "high") {
								if(score.score < lastScore.score && nextScore.score > lastScore.score) {
									continue;
								}
							} else if (chartData.chartDir == "low") {
								if(score.score > lastScore.score && nextScore.score < lastScore.score) {
									continue;
								}
							}
						}
					}
				}

				//if this is the new worst or best score, adjust the chart y-axis
				if(lowestValidScore === null || score.score < lowestValidScore) {
					lowestValidScore = score.score;
				}
				if(highestValidScore === null || score.score > highestValidScore) {
					highestValidScore = score.score;
				}

				formattedScores.push(scoreObj);

				//if this is the final submission from the user, and it's quite old, draw a line from that submission to the edge of the graph
				//note - a better way of doing this is to store an array of integers for each user representing the point radius of the datapoint
				//for every nth data element, set the integer in array[n] to 3, and then for this specific fake element, set it to 0
				//then when constructing that chart, do e.g., for(ds in datasets){ ds.pointRadius = pointRadiusArrays[ds.userName];} (pseudocode)
				//this looks nicer, but does come with the downside of it being tricky to see a user's exact score if they haven't submitted recently
				if(j == scores.length - 1) {
					//24 * 60 * 60 * 1000 = 1 day worth of milliseconds
					if(currTime - timestamp > (24 * 60 * 60 * 1000)) {
						//absolutely disgusting parser hack that would have been 100x easier to just write myself
						var realdatetime = myChart.scales.x._adapter.format(timestamp, 'MMM d, yyy, h:mm:ss aaaa');
						formattedScores.push({"x": currTime, "y": score.score, "realdatetime": realdatetime});
					}
				}
			}

			var colour = getColour(colour_idx);
			colour_idx += 1;
			var finalUserObj = {"label": userName, "data": formattedScores, "borderColor": colour,
								"backgroundColor": colour, "pointBorderColor": colour,
								"pointBackgroundColor": colour, "pointHoverBackgroundColor": colour,};
			scoreData.push(finalUserObj);
		}

		//now that we have data generated, set up the chart data and limits
		myChart.data = {
			datasets: scoreData
		};
		myChart.options.scales.y.afterDataLimits = function(scale) {
			var padding = 0.05 * (highestValidScore - lowestValidScore);
			scale.max = highestValidScore + padding;
			scale.min = Math.max(0.00, lowestValidScore - padding);
		};
	}

	function hideChart() {
		document.getElementById('chartBox').style.display = "none";
		var showGraphBtn = document.getElementById('showGraphBtn');
		showGraphBtn.onclick = function() { displayChart(false); };
		showGraphBtn.innerText = "Show Graph";
	}

	//this function takes in a number of seconds and formats it as hh:mm:ss. Decimals should(?) be just left on the seconds component
	function formatAsHHMMSS(seconds) {
		var decimals = 0; //default
		if(typeof seconds == "string") {
			var decimalPos = seconds.indexOf(".");
			if(decimalPos) {
				decimals = seconds.length - seconds.indexOf(".") - 1;
			} else {
				decimals = 0;
			}
			seconds = parseFloat(seconds.replace(",","")); //for some reason this can have a comma in it!
		}
		var hours = Math.floor(seconds / 3600);
		seconds = seconds % 3600;
		var minutes = Math.floor(seconds / 60);
		seconds = seconds % 60;
		var fraction = seconds % 1;
		seconds = Math.floor(seconds);

		var output;
		//we only want to print hours if it's nonzero, but we always print minutes
		if(hours) {
			output = hours+":"+padDigits(minutes, 2)+":"+padDigits(seconds, 2);
		} else {
			output = minutes+":"+padDigits(seconds, 2);
		}
		//add decimal if needed
		if(decimals) {
			output += fraction.toFixed(decimals).substring(1); //round to whatever the string originally had, and strip the leading 0
		}
		return output;
	}

	function padDigits(n, totalDigits) {
		n = n.toString();
		var pd = '';
		if (totalDigits > n.length) {
			for (var i=0; i < (totalDigits-n.length); i++) {
				pd += '0';
			}
		}
		return pd + n.toString();
	}

	function getColour(n) {
		//returns a hex code of format "#123ABC"
		//intentionally spaces colours out to generate multiple successive visually distinct colours
		//colour distribution image can be found here https://i.stack.imgur.com/6W8H7.png (left-to-right, top-to-bottom)
		//I have swapped yellow (r1c2) and red (r1c10), as well as black (r1c1) and blue (r1c11) for slightly prettier defaults on small n
		var colours = [
			"#000000", "#BA0900", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6", "#A30059",
			"#FFDBE5", "#7A4900", "#0000A6", "#63FFAC", "#B79762", "#004D43", "#8FB0FF", "#997D87",
			"#5A0007", "#809693", "#FEFFE6", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80",
			"#61615A", "#FFFF00", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100",
			"#DDEFFF", "#000035", "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F",
			"#372101", "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09",
			"#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1", "#788D66",
			"#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648", "#0086ED", "#886F4C",

			"#34362D", "#B4A8BD", "#00A6AA", "#452C2C", "#636375", "#A3C8C9", "#FF913F", "#938A81",
			"#575329", "#00FECF", "#B05B6F", "#8CD0FF", "#3B9700", "#04F757", "#C8A1A1", "#1E6E00",
			"#7900D7", "#A77500", "#6367A9", "#A05837", "#6B002C", "#772600", "#D790FF", "#9B9700",
			"#549E79", "#FFF69F", "#201625", "#72418F", "#BC23FF", "#99ADC0", "#3A2465", "#922329",
			"#5B4534", "#FDE8DC", "#404E55", "#0089A3", "#CB7E98", "#A4E804", "#324E72", "#6A3A4C",
			"#83AB58", "#001C1E", "#D1F7CE", "#004B28", "#C8D0F6", "#A3A489", "#806C66", "#222800",
			"#BF5650", "#E83000", "#66796D", "#DA007C", "#FF1A59", "#8ADBB4", "#1E0200", "#5B4E51",
			"#C895C5", "#320033", "#FF6832", "#66E1D3", "#CFCDAC", "#D0AC94", "#7ED379", "#012C58"
		]
		return colours[n%128];
	}
})();