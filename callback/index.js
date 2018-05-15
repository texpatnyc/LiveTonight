//Autocomplete functionality for search box
function activatePlacesSearch(){
    const input = document.getElementById('search-term');
    const options = {
    	types: ['(cities)']
    };
    let autocomplete = new google.maps.places.Autocomplete(input, options);
};

//Build Concert Listings
function renderResult(result) {
	return `
		<div class='concertListing'>
			<img src="${result.artistImage}" class="artistImg" alt="${result.artist}" width='74' height='74'>
			<span class='artistName'>${result.artist}</span><br>
			${result.venue}, ${result.city}<br>
			<a href="${result.ticketLink}">
				<span class=button buy-tickets>Buy Tickets</span>
			</a>
		</div>`
};

//Display concert listings
function displayConcertListings(data) {
	$('main').html(`<div id="concert-listings"></div>`)
	const results = data.map((item, index) => renderResult(item));
	$('#concert-listings').html(results);
}

//Create array of artitsts from concert listings
let artistList = []
function createArtistList(data) {
	artistList = data.map(a => a.artist);
	console.log(artistList);
}

//------------------------------------------------------------
//Spotify API
//------------------------------------------------------------

function getParameterByName(name) {
  var match = RegExp('[#&]' + name + '=([^&]*)').exec(window.location.hash);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function getAccessToken() {
  return getParameterByName('access_token');
}

const accessToken = 'BQClGcducTRYlNdK345oPYq1yDXKVOq_AnNZbRC_GxB1JBRTozvimVFuOdJsEuryJFOOiXEBXEThqM0wLLMU5qsMxre9vqm5cSGBLsZIMXHb-OoNiHW1zgQtK-S2zDuUoM7Yrf_ekFyx_CCivx9BWDtzljIvsHMRzAT4EHr8NE-Io5vxdnro9gTeI_eyO4fkF-6V34RYksRWEGFwXinU724fni35';

//Get artists from spotify
const getArtistsFromSpotify = (artist) => {
	return new Promise(function (resolve, reject) {
		$.ajax({
			url: 'https://api.spotify.com/v1/search',
			method: 'GET',
			dataType: 'json',
			data: {
				type: 'artist',
				q: artist,
				limit: 1
			},
			headers: {
		        'Authorization': 'Bearer ' + accessToken
		    },
		    success: resolve,
		    error: reject
		});
	})
}
	

//Get top tracks for artist

const getArtistsTracksFromSpotify = (id) => {
	return new Promise(function (resolve, reject) {
		$.ajax({
			url: `https://api.spotify.com/v1/artists/${id}/top-tracks/`,
			method: 'GET',
			dataType: 'json',
			data: {
				country: 'US',
			},
			headers: {
				'Authorization': 'Bearer ' + accessToken
			},
			success: resolve,
			error: reject
		});
	})
}


function todaysDate() {
	let day = new Date();
	let dd = day.getDate();
	let mm = day.getMonth();

	let yyyy = day.getFullYear();
	if(dd<10) {
		dd = '0' + dd;
	};
	if(mm<10) {
		mm = '0' + mm;
	}
	day = mm+'/'+dd+'/'+yyyy;
	return day;
}

let today = new Date().toLocaleString("en-US").split(',')[0];

function getClientInfoFromSpotify() {
	let settings = {
		url: 'https://api.spotify.com/v1/me',
		method: 'GET',
		dataType: 'json',
		headers: {
			'Authorization': 'Bearer ' + accessToken
		},
		success: function getClientID(data) {
			clientID = data.id;
			createPlaylist(clientID);
		}
	}
	$.ajax(settings);
}

let clientID;
// getClientInfoFromSpotify();


//Create playlist
let playlistID;
function createPlaylist(id) {
	let settings = {
		async: true,
		crossDomain: true,
		url: `https://api.spotify.com/v1/users/${id}/playlists`,
		method: 'POST',
		data: JSON.stringify({
				name: `LiveTonight - ${today}`,
				description: `Possible bands to see on ${today}`,
				public: false
			}),
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		},
		success: function(data) {
			playlistID = data.id;
			addTracksToPlaylist(spotifyArtistsSingleTopTracks);
		}
	}
	$.ajax(settings);
}

// function addTracksToPlaylist

function addTracksToPlaylist(array) {
	let settings = {
		async: true,
		crossDomain: true,
		url: `https://api.spotify.com/v1/users/${clientID}/playlists/${playlistID}/tracks`,
		method: 'POST',
		data: JSON.stringify({
			uris: array
		}),
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		},
		success: function() {
			console.log('you made a playlist motherfucker!')
		}  
	}
	$.ajax(settings);
}

let spotifyArtistsSingleTopTracks = [];

//Initiate Spotify app
function spotifyAppInitiate() {
	const spotifyArtists = artistList.map(getArtistsFromSpotify);
	let spotifyArtistsIDs = [];
	let spotifyArtistsTopTracks = [];
	Promise.all(spotifyArtists)
		.then(data => {
			// console.log(data);
			spotifyArtistsIDs = data.map(a => a.artists.items[0].id);
			// console.log(spotifyArtistsIDs);
			Promise.all(spotifyArtistsIDs.map(getArtistsTracksFromSpotify))
				.then(data => {
					spotifyArtistsSingleTopTracks = data.map(a => "spotify:track:" + a.tracks[0].id);
					console.log(spotifyArtistsSingleTopTracks)
					getClientInfoFromSpotify();
				})
		})

	// let spotifyArtistsIDs = [];
	// let spotifyArtistsTopTracks = [];
	// let spotifyArtistsSingleTopTracks = [];

	// $.when(...spotifyArtists)
	// 	.then((...spotifyArtists) => {
	// 		spotifyArtistsIDs = spotifyArtists.map(a => a[0].artists.items[0].id);
	// 		console.log(spotifyArtists);
	// 		console.log(spotifyArtistsIDs);
	// 		$.when(...spotifyArtistsIDs)
	// 			.then((...spotifyArtistsIDs) => {
	// 				spotifyArtistsTopTracks = spotifyArtistsIDs.map(getArtistsTracksFromSpotify);
	// 				console.log(spotifyArtistsTopTracks);
	// 				$.when(...spotifyArtistsTopTracks)
	// 					.then((...spotifyArtistsTopTracks) => {
	// 						spotifyArtistsSingleTopTracks = spotifyArtistsTopTracks.map(b => b[0].tracks[0].id);
	// 						console.log(spotifyArtistsSingleTopTracks);
	// 					})
						
					
	// 			})
	// 	});

	
		

};



function watchSubmit() {
	$('#search-form').submit(e => {
		e.preventDefault();
		displayConcertListings(concertList);
		createArtistList(concertList);
		spotifyAppInitiate();


	})
}

watchSubmit();












