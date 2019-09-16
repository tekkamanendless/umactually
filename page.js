var stats = {};
var filters = [];

function onPageLoaded() {
	fetch('data.json').then(response => {
		return response.json();
	}).then(data => {
		console.log("data:", data);
		stats = computeStats(data);
		console.log("stats:", stats);

		renderPage(stats, filters);

		renderCharts(stats);
	});
}

function renderPage(stats, filters) {
	// Fill out the clear filters button.
	{
		let button = document.getElementById("clearfilters");
		if( filters.length == 0 ) {
			button.disabled = true;
			button.innerHTML = "Clear filters";
		} else {
			button.disabled = false;
			if( filters.length == 1 ) {
				button.innerHTML = "Clear 1 filter";
			} else {
				button.innerHTML = "Clear " + filters.length + " filters";
			}
		}
	}

	// Fill out the seasons table.
	{
		let tbody = document.getElementById("seasons_tbody");
		while(tbody.firstChild) {
			tbody.removeChild(tbody.firstChild);
		}

		for( let i = 0; i < stats.seasons.length; i++ ) {
			let season = stats.seasons[i];
			if( ! seasonPassesFilter(season, filters) ) {
				continue;
			}

			let newRow = document.createElement("tr");
			let newColumn = null;

			newColumn = document.createElement("td");
			newColumn.appendChild(document.createTextNode(season.title));
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			if( season.episodes.length ) {
				newColumn.appendChild(document.createTextNode(season.episodes.length));
			}
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			if( season.hosts.length ) {
				newColumn.appendChild(document.createTextNode(season.hosts.length));
			}
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			if( season.players.length ) {
				newColumn.appendChild(document.createTextNode(season.players.length));
			}
			newRow.appendChild(newColumn);

			tbody.appendChild(newRow);
		}
	}

	// Fill out the episodes table.
	{
		let tbody = document.getElementById("episodes_tbody");
		while(tbody.firstChild) {
			tbody.removeChild(tbody.firstChild);
		}

		for( let i = 0; i < stats.episodes.length; i++ ) {
			let episode = stats.episodes[i];
			if( ! episodePassesFilter(episode, filters) ) {
				continue;
			}

			let newRow = document.createElement("tr");
			let newColumn = null;

			newColumn = document.createElement("td");
			{
				let link = document.createElement("a");
				link.href = episode.url;
				link.target = "_blank";
				let image = document.createElement("img");
				image.className = "episode-thumbnail";
				image.src = episode.thumbnail_landscape;
				//link.appendChild(document.createTextNode("🔗"));
				link.appendChild(image);
				newColumn.appendChild(link);
			}
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			newColumn.appendChild(createFilterLink(episode.season_and_number, {type: "episode", id: episode.dropouttv_productid, role: "*"}));
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			newColumn.appendChild(createFilterLink(episode.title, {type: "episode", id: episode.dropouttv_productid, role: "*"}));
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			newColumn.appendChild(document.createTextNode(computeDurationString(episode.duration)));
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			if( Array.isArray(episode.questions) ) {
				newColumn.appendChild(document.createTextNode(episode.questions.length));
			} else {
				newColumn.appendChild(document.createTextNode("TBD"));
			}
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			newColumn.className = "person host";
			newColumn.appendChild(createFilterLink(episode.host_name, {type: "person", id: episode.host, role: "host"}));
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			for( let p = 0; p < episode.players.length; p++ ) {
				let player = episode.players[p];
				let span = document.createElement("div");
				switch(player.place) {
					case 1:
						span.className = "person first";
						break;
					case 2:
						span.className = "person second";
						break;
					case 3:
						span.className = "person third";
						break;
				}
				let podium = document.createElement("span");
				podium.className = "podium " + player.color;
				span.appendChild(podium);
				span.appendChild(createFilterLink(player.name, {type: "person", id: player.id, role: "player"}));
				span.appendChild(document.createTextNode(" (" + player.score + ")"));
				if( player.notes ) {
					span.appendChild(document.createTextNode(" "));

					let abbr = document.createElement("abbr");
					abbr.setAttribute("title", player.notes);
					abbr.appendChild(document.createTextNode("*"));
					span.appendChild(abbr);
				}
				newColumn.appendChild(span);
			}
			newRow.appendChild(newColumn);

			tbody.appendChild(newRow);
		}
	}

	// Fill out the questions table.
	{
		let tbody = document.getElementById("questions_tbody");
		while(tbody.firstChild) {
			tbody.removeChild(tbody.firstChild);
		}

		for( let i = 0; i < stats.episodes.length; i++ ) {
			let episode = stats.episodes[i];
			if( ! episodePassesFilter(episode, filters) ) {
				continue;
			}

			for( let q = 0; q < episode.questions.length; q++ ) {
				let question = episode.questions[q];

				let topic = null;
				if( question.topic ) {
					topic = stats.questionTopics.find(item => item.id === question.topic);
				}
				if( ! topicPassesFilter(topic, filters.filter(item => item.type === "topic")) ) {
					continue;
				}

				let title = null;
				if( question.title ) {
					title = stats.questionTitles.find(item => item.name === question.title);
				}
				if( ! titlePassesFilter(title, filters.filter(item => item.type === "title")) ) {
					continue;
				}

				let playerFilters = filters.filter(item => item.type === "person");
				if( playerFilters.length > 0 ) {
					let somePlayerMatches = false;
					for( let p = 0; p < question.winners.length; p++ ) {
						let playerId = question.winners[p];
						let person = stats.people.find(item => item.id === playerId);

						if( personPassesFilter(person, playerFilters) ) {
							somePlayerMatches = true;
							break;
						}
					}
					if( ! somePlayerMatches ) {
						continue;
					}
				}

				let newRow = document.createElement("tr");
				let newColumn = null;

				newColumn = document.createElement("td");
				newColumn.appendChild(createFilterLink(episode.season_and_number, {type: "episode", id: episode.dropouttv_productid, role: "*"}));
				newRow.appendChild(newColumn);

				newColumn = document.createElement("td");
				newColumn.appendChild(document.createTextNode(question.number));
				newRow.appendChild(newColumn);

				newColumn = document.createElement("td");
				if( topic ) {
					newColumn.appendChild(createFilterLink(topic.name, {type: "topic", id: topic.id, role: "*"}));
				}
				newRow.appendChild(newColumn);

				newColumn = document.createElement("td");
				if( title ) {
					newColumn.appendChild(createFilterLink(title.name, {type: "title", id: title.name, role: "*"}));
				}
				newRow.appendChild(newColumn);

				newColumn = document.createElement("td");
				for( let p = 0; p < question.winners.length; p++ ) {
					let playerId = question.winners[p];
					let player = episode.players.find(item => item.id === playerId);

					let span = document.createElement("div");
					let podium = document.createElement("span");
					podium.className = "podium " + player.color;
					span.appendChild(podium);
					span.appendChild(createFilterLink(player.name, {type: "person", id: player.id, role: "player"}));
					newColumn.appendChild(span);
				}
				newRow.appendChild(newColumn);

				tbody.appendChild(newRow);
			}
		}
	}

	// Fill out the people table.
	{
		let tbody = document.getElementById("people_tbody");
		while(tbody.firstChild) {
			tbody.removeChild(tbody.firstChild);
		}

		for( let i = 0; i < stats.people.length; i++ ) {
			let person = stats.people[i];
			if( ! personPassesFilter(person, filters) ) {
				continue;
			}

			let newRow = document.createElement("tr");
			let newColumn = null;

			newColumn = document.createElement("td");
			{
				let link = document.createElement("a");
				link.href = person.url;
				link.target = "_blank";
				link.appendChild(document.createTextNode("🔗"));
				newColumn.appendChild(link);
			}
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			newColumn.className = "person";
			newColumn.appendChild(createFilterLink(person.name, {type: "person", id: person.id, role: "*"}));
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			if( person.appearances.length > 0 ) {
				newColumn.appendChild(createFilterLink(person.appearances.length, {type: "person", id: person.id, role: "*"}));
			}
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			if( person.times_hosted.length ) {
				newColumn.appendChild(createFilterLink(person.times_hosted.length, {type: "person", id: person.id, role: "host"}));
			}
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			if( person.times_first.length ) {
				newColumn.appendChild(createFilterLink(person.times_first.length, {type: "person", id: person.id, role: "first"}));
			}
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			if( person.times_second.length ) {
				newColumn.appendChild(createFilterLink(person.times_second.length, {type: "person", id: person.id, role: "second"}));
			}
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			if( person.times_third.length ) {
				newColumn.appendChild(createFilterLink(person.times_third.length, {type: "person", id: person.id, role: "third"}));
			}
			newRow.appendChild(newColumn);

			tbody.appendChild(newRow);
		}
	}

	// Fill out the topics table.
	{
		let tbody = document.getElementById("topics_tbody");
		while(tbody.firstChild) {
			tbody.removeChild(tbody.firstChild);
		}

		for( let i = 0; i < stats.questionTopics.length; i++ ) {
			let topic = stats.questionTopics[i];
			if( ! topicPassesFilter(topic, filters) ) {
				continue;
			}

			let newRow = document.createElement("tr");
			let newColumn = null;

			newColumn = document.createElement("td");
			newColumn.appendChild(createFilterLink(topic.name, {type: "topic", id: topic.id, role: "*"}));
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			if( topic.episodes.length ) {
				newColumn.appendChild(createFilterLink(topic.episodes.length, {type: "topic", id: topic.id, role: "*"}));
			}
			newRow.appendChild(newColumn);

			tbody.appendChild(newRow);
		}
	}

	// Fill out the titles table.
	{
		let tbody = document.getElementById("titles_tbody");
		while(tbody.firstChild) {
			tbody.removeChild(tbody.firstChild);
		}

		for( let i = 0; i < stats.questionTitles.length; i++ ) {
			let title = stats.questionTitles[i];
			if( ! titlePassesFilter(title, filters) ) {
				continue;
			}

			let newRow = document.createElement("tr");
			let newColumn = null;

			newColumn = document.createElement("td");
			newColumn.appendChild(createFilterLink(title.name, {type: "title", id: title.name, role: "*"}));
			newRow.appendChild(newColumn);

			newColumn = document.createElement("td");
			if( title.episodes.length ) {
				newColumn.appendChild(createFilterLink(title.episodes.length, {type: "title", id: title.name, role: "*"}));
			}
			newRow.appendChild(newColumn);

			tbody.appendChild(newRow);
		}
	}
}

function computeDurationString(timeInSeconds) {
	timeInSeconds = parseInt(timeInSeconds);
	let hours = parseInt( timeInSeconds / 3600 );
	let remainder = timeInSeconds - hours * 3600;
	let minutes = parseInt( remainder / 60 );
	let seconds = remainder - minutes * 60;

	let durationString = "";
	if( hours > 0 ) {
		durationString += hours + "h";
	}
	durationString += minutes + "m" + seconds + "s";
	return durationString;
}

function clearFilters() {
	console.log("clearFilters: Clearing filters.");
	filters = [];
	renderPage(stats, filters);
}

function addFilter(newFilter) {
	console.log("addFilter: filters:", filters);
	console.log("addFilter: newFilter:", newFilter);

	let changed = false;
	for( let i = 0; i < filters.length; i++ ) {
		let filter = filters[i];
		if( filtersAreSimilar(filter,newFilter) ) {
			filters[i] = newFilter;
			changed = true;
			console.log("addFilter: Changed i:", i);
			break;
		}
	}
	if( ! changed ) {
		filters.push(newFilter);
		console.log("addFilter: Added.");
	}
	renderPage(stats, filters);
}

function filtersAreSimilar(a, b) {
	return ( a.type == b.type && a.id == b.id );
}

function filtersAreEqual(a, b) {
	return ( a.type == b.type && a.id == b.id && a.role == b.role );
}

function removeFilter(newFilter) {
	console.log("removeFilter: filters:", filters);
	console.log("removeFilter: newFilter:", newFilter);
	for( let i = 0; i < filters.length; i++ ) {
		let filter = filters[i];

		if( filtersAreEqual(filter, newFilter) ) {
			filters.splice(i,1);
			console.log("removeFilter: Removed from i:", i);
			renderPage(stats, filters);
			return;
		}
	}
}

function hasFilter(newFilter) {
	for( let i = 0; i < filters.length; i++ ) {
		let filter = filters[i];

		if( filtersAreEqual(filter, newFilter) ) {
			return true;
		}
	}
	return false;
}

function createFilterLink(title, filter) {
	let newFilter = ! hasFilter(filter);

	let link = document.createElement("span");
	link.className = "link";
	if( newFilter ) {
		link.className += " filter-off";
	} else {
		link.className += " filter-on";
	}
	link.onclick = () => {
		if( newFilter ) {
			addFilter(filter);
		} else {
			removeFilter(filter);
		}
	}
	link.appendChild(document.createTextNode(title));
	return link;
}

function seasonPassesFilter(season, filters) {
	let match = true;

	for( let i = 0; i < filters.length; i++ ) {
		let filter = filters[i];
		switch(filter.type) {
			case "episode":
				if( ! season.episodes.includes(filter.id) ) {
					match = false;
				}
				break;
			case "topic":
				if( ! season.questionTopics.includes(filter.id) ) {
					match = false;
				}
				break;
			case "title":
				if( ! season.questionTitles.includes(filter.id) ) {
					match = false;
				}
				break;
			case "person":
				switch(filter.role) {
					case "host":
						if( ! season.hosts.includes(filter.id) ) {
							match = false;
						}
						break;
					case "player":
						if( ! season.players.includes(filter.id) ) {
							match = false;
						}
						break;
					case "*":
						if( ! season.hosts.includes(filter.id) && ! season.players.includes(filter.id) ) {
							match = false;
						}
						break;
					case "first":
						if( ! season.firstIds.includes(filter.id) ) {
							match = false;
						}
						break;
					case "second":
						if( ! season.secondIds.includes(filter.id) ) {
							match = false;
						}
						break;
					case "third":
						if( ! season.thirdIds.includes(filter.id) ) {
							match = false;
						}
						break;
					default:
						console.warn("seasonPassesFilter: Unhandled person role:", filter.role);
						match = false;
				}
				break;
			default:
				console.warn("seasonPassesFilter: Unhandled type:", filter.type);
				match = false;
		}
	}

	return match;
}

function episodePassesFilter(episode, filters) {
	let match = true;

	for( let i = 0; i < filters.length; i++ ) {
		let filter = filters[i];
		switch(filter.type) {
			case "episode":
				if( episode.dropouttv_productid != filter.id ) {
					match = false;
				}
				break;
			case "topic":
				if( ! episode.questionTopics.includes(filter.id) ) {
					match = false;
				}
				break;
			case "title":
				if( ! episode.questionTitles.includes(filter.id) ) {
					match = false;
				}
				break;
			case "person":
				switch(filter.role) {
					case "host":
						if( episode.host != filter.id ) {
							match = false;
						}
						break;
					case "player":
						if( ! episode.playerIds.includes(filter.id) ) {
							match = false;
						}
						break;
					case "*":
						if( episode.host != filter.id && ! episode.playerIds.includes(filter.id) ) {
							match = false;
						}
						break;
					case "first":
						if( ! episode.firstIds.includes(filter.id) ) {
							match = false;
						}
						break;
					case "second":
						if( ! episode.secondIds.includes(filter.id) ) {
							match = false;
						}
						break;
					case "third":
						if( ! episode.thirdIds.includes(filter.id) ) {
							match = false;
						}
						break;
					default:
						console.warn("episodePassesFilter: Unhandled person role:", filter.role);
						match = false;
				}
				break;
			default:
				console.warn("episodePassesFilter: Unhandled type:", filter.type);
				match = false;
		}
	}

	return match;
}

function topicPassesFilter(topic, filters) {
	let match = false;

	if( filters.length == 0 ) {
		return true;
	}

	if( ! topic ) {
		return false;
	}

	for( let i = 0; i < filters.length; i++ ) {
		let filter = filters[i];
		switch(filter.type) {
			case "episode":
				if( topic.episodes.includes(filter.id) ) {
					match = true;
				}
				break;
			case "topic":
				if( topic.id == filter.id ) {
					match = true;
				}
				break;
			case "title":
				// TODO
				break;
			case "person":
				if( topic.players.includes(filter.id) ) {
					match = true;
				}
				break;
			default:
				console.warn("topicPassesFilter: Unhandled type:", filter.type);
				match = false;
		}
	}

	return match;
}

function titlePassesFilter(title, filters) {
	let match = false;

	if( filters.length == 0 ) {
		return true;
	}

	if( ! title ) {
		return false;
	}

	for( let i = 0; i < filters.length; i++ ) {
		let filter = filters[i];
		switch(filter.type) {
			case "episode":
				if( title.episodes.includes(filter.id) ) {
					match = true;
				}
				break;
			case "topic":
				// TODO
				break;
			case "title":
				if( title.name == filter.id ) {
					match = true;
				}
				break;
			case "person":
				if( title.players.includes(filter.id) ) {
					match = true;
				}
				break;
			default:
				console.warn("titlePassesFilter: Unhandled type:", filter.type);
				match = false;
		}
	}

	return match;
}

function personPassesFilter(person, filters) {
	let match = false;

	if( filters.length == 0 ) {
		return true;
	}

	if( ! person ) {
		return false;
	}

	for( let i = 0; i < filters.length; i++ ) {
		let filter = filters[i];
		switch(filter.type) {
			case "episode":
				if( person.appearances.includes(filter.id) ) {
					match = true;
				}
				break;
			case "topic":
				if( person.topics.includes(filter.id) ) {
					match = true;
				}
				break;
			case "title":
				if( person.titles.includes(filter.id) ) {
					match = true;
				}
				break;
			case "person":
				if( person.id == filter.id ) {
					match = true;
				}
				break;
			default:
				console.warn("personPassesFilter: Unhandled type:", filter.type);
				match = false;
		}
	}

	return match;
}

function computeStats(data) {
	let stats = {
		"seasons": [],
		"episodes": [],
		"people": [],
		"questionTopics": [],
		"questionTitles": [],
	};

	let seasonMap = {};
	for( let i = 0; i < data.seasons.length; i++ ) {
		let season = JSON.parse(JSON.stringify(data.seasons[i]));
		season.episodes = [];
		season.hostMap = {};
		season.playerMap = {};
		season.firstMap = {};
		season.secondMap = {};
		season.thirdMap = {};
		season.questionTopics = [];
		season.questionTitles = [];
		seasonMap[season.number] = season;
	}

	let peopleMap = {};
	for( let i = 0; i < data.people.length; i++ ) {
		let person = JSON.parse(JSON.stringify(data.people[i]));
		person.times_hosted = [];
		person.times_played = [];
		person.times_first = [];
		person.times_second = [];
		person.times_third = [];
		person.appearances = [];
		person.topics = [];
		person.titles = [];
		peopleMap[person.id] = person;
	}

	let questionTopicMap = {};
	for( let i = 0; i < data.topics.length; i++ ) {
		let topic = JSON.parse(JSON.stringify(data.topics[i]));
		topic.episodes = [];
		topic.players = [];
		questionTopicMap[topic.id] = topic;
	}

	let questionTitleMap = {};
	for( let i = 0; i < data.titles.length; i++ ) {
		let title = JSON.parse(JSON.stringify(data.titles[i]));
		title.episodes = [];
		title.players = [];
		questionTitleMap[title.name] = title;
	}

	for( let i = 0; i < data.episodes.length; i++ ) {
		let episode = JSON.parse(JSON.stringify(data.episodes[i]));
		{
			episode.season_and_number = "S";
			let n = Number.parseInt(episode.season_number);
			if( n < 10 ) {
				episode.season_and_number += "0";
			}
			episode.season_and_number += n;
			episode.season_and_number += "E";
			n = Number.parseInt(episode.number);
			if( n < 10 ) {
				episode.season_and_number += "0";
			}
			episode.season_and_number += n;
		}

		seasonMap[episode.season_number].episodes.push(episode.dropouttv_productid);

		let hostId = episode.host;
		episode.host_name = peopleMap[hostId].name;

		peopleMap[hostId].times_hosted.push(episode.dropouttv_productid);
		peopleMap[hostId].appearances.push(episode.dropouttv_productid);
		seasonMap[episode.season_number].hostMap[hostId] = true;

		let scores = [];
		for( let p = 0; p < episode.players.length; p++ ) {
			let player = episode.players[p];
			if( ! scores.includes(player.score) ) {
				scores.push(player.score);
			}
		}
		scores.sort((a,b) => b-a);

		let scoreMap = {};
		for( let s = 0; s < scores.length; s++ ) {
			scoreMap["score="+scores[s]] = s + 1;
		}

		episode.playerIds = [];
		episode.firstIds = [];
		episode.secondIds = [];
		episode.thirdIds = [];
		for( let p = 0; p < episode.players.length; p++ ) {
			let player = episode.players[p];
			episode.playerIds.push(player.id);
			peopleMap[player.id].appearances.push(episode.dropouttv_productid);
			seasonMap[episode.season_number].playerMap[player.id] = true;

			let place = scoreMap["score="+player.score];
			switch(place) {
				case 1:
					episode.firstIds.push(player.id);
					peopleMap[player.id].times_first.push(episode.dropouttv_productid);
					seasonMap[episode.season_number].firstMap[player.id] = true;
					break;
				case 2:
					episode.secondIds.push(player.id);
					peopleMap[player.id].times_second.push(episode.dropouttv_productid);
					seasonMap[episode.season_number].secondMap[player.id] = true;
					break;
				case 3:
					episode.thirdIds.push(player.id);
					peopleMap[player.id].times_third.push(episode.dropouttv_productid);
					seasonMap[episode.season_number].thirdMap[player.id] = true;
					break;
			}

			episode.players[p].name = peopleMap[player.id].name;
			episode.players[p].place = place;
		}

		episode.questionTopicMap = {};
		episode.questionTitleMap = {};
		if( Array.isArray(episode.questions) ) {
			for( let q = 0; q < episode.questions.length; q++ ) {
				let question = episode.questions[q];
				if( question.topic ) {
					episode.questionTopicMap[question.topic] = true;
					if( ! questionTopicMap[question.topic] ) {
						console.warn("undefined topic:", question.topic);
					}
					if( ! questionTopicMap[question.topic].episodes.includes(episode.dropouttv_productid) ) {
						questionTopicMap[question.topic].episodes.push(episode.dropouttv_productid);
					}
					if( ! seasonMap[episode.season_number].questionTopics.includes(question.topic) ) {
						seasonMap[episode.season_number].questionTopics.push(question.topic);
					}
					for( let playerId of episode.playerIds ) {
						if( ! peopleMap[playerId].topics.includes(question.topic) ) {
							peopleMap[playerId].topics.push(question.topic);
						}
						if( ! questionTopicMap[question.topic].players.includes(playerId) ) {
							questionTopicMap[question.topic].players.push(playerId);
						}
					}
				}
				if( question.title ) {
					episode.questionTitleMap[question.title] = true;
					if( ! questionTitleMap[question.title] ) {
						console.warn("undefined title:", question.title);
					}

					if( ! questionTitleMap[question.title].episodes.includes(episode.dropouttv_productid) ) {
						questionTitleMap[question.title].episodes.push(episode.dropouttv_productid);
					}
					if( ! seasonMap[episode.season_number].questionTitles.includes(question.title) ) {
						seasonMap[episode.season_number].questionTitles.push(question.title);
					}
					for( let playerId of episode.playerIds ) {
						if( ! peopleMap[playerId].titles.includes(question.title) ) {
							peopleMap[playerId].titles.push(question.title);
						}
						if( ! questionTitleMap[question.title].players.includes(playerId) ) {
							questionTitleMap[question.title].players.push(playerId);
						}
					}
				}
			}
		}

		episode.questionTopics = [];
		for( let key in episode.questionTopicMap ) {
			episode.questionTopics.push(key);
		}
		delete episode.questionTopicMap;

		episode.questionTitles = [];
		for( let key in episode.questionTitleMap ) {
			episode.questionTitles.push(key);
		}
		delete episode.questionTitleMap;

		stats.episodes.push(episode);
	}

	for( key in peopleMap ) {
		stats.people.push(peopleMap[key]);
	}
	stats.people.sort((a,b) => a.name.localeCompare(b.name));

	for( key in seasonMap ) {
		let season = seasonMap[key];

		season.hosts = [];
		for( let key in season.hostMap ) {
			season.hosts.push(key);
		}
		delete season.hostMap;

		season.players = [];
		for( let key in season.playerMap ) {
			season.players.push(key);
		}
		delete season.playerMap;

		season.firstIds = [];
		for( let key in season.firstMap ) {
			season.firstIds.push(key);
		}
		delete season.firstMap;

		season.secondIds = [];
		for( let key in season.secondMap ) {
			season.secondIds.push(key);
		}
		delete season.secondMap;

		season.thirdIds = [];
		for( let key in season.thirdMap ) {
			season.thirdIds.push(key);
		}
		delete season.thirdMap;

		stats.seasons.push(seasonMap[key]);
	}

	for( key in questionTopicMap ) {
		stats.questionTopics.push(questionTopicMap[key]);
	}
	stats.questionTopics.sort((a,b) => a.name.localeCompare(b.name));

	for( key in questionTitleMap ) {
		stats.questionTitles.push(questionTitleMap[key]);
	}
	stats.questionTitles.sort((a,b) => a.name.localeCompare(b.name));

	return stats;
}

function renderCharts(stats) {
	renderChartRuntimes(document.getElementById('chart-runtimes').getContext('2d'));
	renderChartTotalPoints(document.getElementById('chart-points').getContext('2d'));
}

function renderChartRuntimes(ctx) {
	let xValues = [];
	let yValues = [];
	let yValuesRaw = [];

	stats.episodes.forEach(episode => {
		xValues.push(episode.season_and_number);
		yValues.push(episode.duration/60);
		yValuesRaw.push(episode.duration);
	});

	let chart = new Chart(ctx, {
	    // The type of chart we want to create
	    type: 'line',
	    // The data for our dataset
	    data: {
	        labels: xValues,
	        datasets: [{
	            label: 'Episode Runtimes',
	            data: yValues,
	        }]
	    },
	    // Configuration options go here
	    options: {
				animation: {
					duration: 0,
				},
				maintainAspectRatio: false,
				tooltips: {
					callbacks: {
						// Render the runtime as ""##m##s".
						label: function(tooltipItem, data) {
							let v = yValuesRaw[tooltipItem.index];

							let minutes = parseInt(v/60);
							let seconds = v%60;

							let minutesString = "" + minutes;
							if( minutesString.length < 2 ) {
								minutesString = "0" + minutesString;
							}
							let secondsString = "" + seconds;
							if( secondsString.length < 2 ) {
								secondsString = "0" + secondsString;
							}

							return minutesString + "m" + secondsString + "s";
						},
					}
				},
			},
	});
}

function renderChartTotalPoints(ctx) {
	let xValues = [];
	let yValues = [];

	stats.episodes.forEach(episode => {
		xValues.push(episode.season_and_number);
		yValues.push(episode.players.reduce((accumulator, player) => accumulator + player.score, 0));
	});

	let chart = new Chart(ctx, {
	    // The type of chart we want to create
	    type: 'line',
	    // The data for our dataset
	    data: {
	        labels: xValues,
	        datasets: [{
	            label: 'Episode Point Totals',
	            data: yValues,
	        }]
	    },
	    // Configuration options go here
	    options: {
				animation: {
					duration: 0,
				},
				maintainAspectRatio: false,
			},
	});
}
