//------------------------------------------------------------
//GoogleMaps API
//------------------------------------------------------------

function activatePlacesSearch(){
    const input = document.getElementById('search-term');
    const options = {
    	types: ['(cities)']
    };
    let autocomplete = new google.maps.places.Autocomplete(input, options);
};

//------------------------------------------------------------
//Songkick API
//------------------------------------------------------------

let songKickDate;

function getMetroAreaIDFromSongKick(city) {
	settings = {
		url: 'http://api.songkick.com/api/3.0/search/locations.json',
		data: {
			query: city,
			apikey: 'TGXBOdEJdH8k5A5w'
		},
		dataType: 'json',
		type: 'GET',
		success: function(data) {
			const metroAreaID = data.resultsPage.results.location[0].metroArea.id;
			getConcertListingsFromSongKick(metroAreaID);
		}
	}
	$.ajax(settings);
}

function getConcertListingsFromSongKick(id) {
	formatDateForSongKick();
	settings = {
		url: `http://api.songkick.com/api/3.0/metro_areas/${id}/calendar.json`,
		data: {
			apikey: 'TGXBOdEJdH8k5A5w',
			min_date: songKickDate,
			max_date: songKickDate,
		},
		dataType: 'json',
		type: 'GET',
		success: function(data) {
			let concerts = data.resultsPage.results.event;
			createArtistList(concerts);
			displayConcertListings(concerts);
		}
	}
	$.ajax(settings);
}

function formatDateForSongKick() {
	let today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; 
	var yyyy = today.getFullYear();
	if(dd<10) {
    	dd='0'+dd;
	} 
	if(mm<10) {
    	mm='0'+mm;
	}
	songKickDate = `${yyyy}-${mm}-${dd}`
}

//Build Concert Listings
function renderResult(result) {
	return `
		<div class='concertListing'>
			<img src="https://images.sk-static.com/images/media/profile_images/artists/${result.performance[0].artist.id}/large_avatar" class="artistImg" alt="${result.performance[0].artist.displayName}" width='74' height='74'>
			<a href="https://www.songkick.com/artists/${result.performance[0].artist.id}">
				<span class='artistName'>${result.performance[0].artist.displayName}</span>
			</a><br>
			${result.venue.displayName}, ${result.venue.metroArea.displayName}, ${result.venue.metroArea.state.displayName}<br>
			<a href="http://www.songkick.com/concerts/${result.id}">
				<span class=button buy-tickets>Buy Tickets</span>
			</a>
		</div>`
};

//Display concert listings
function displayConcertListings(data) {
	$('.main-container').html(`<div class ="left" id="concert-listings"></div><div class ="right" id="playlist-window"></div>`)
	const results = data.map((item, index) => renderResult(item));
	$('#concert-listings').html(`<a href="http://www.songkick.com"><img id="powered-by-songkick-logo" src="../images/powered-by-songkick-pink.png"></a></br>${results}`);
}

//Create array of artitsts from concert listings
let artistList = []
function createArtistList(data) {
	artistList = data.map(a => a.performance[0].artist.displayName);
	spotifyAppInitiate();
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

const accessToken = 'BQC7amGXEYFzJ6tYtsE4nyYA3bQdyn1UZCqp_7ZmtN_wX8NcIVNum8FRJSz2CY4kAJhk44ZYricne8Gba27btltdcJAJizGJBKxzYNYw95lBtOU3pa4N1srW9azlZPBeNL-Ost6dsV5PH4AZW2v1eFmS2rz1bvGh_feeaoivQLSyZ2XZqG9nLE9JHFCHrxKDK96Lf7trUFxzfORZ0a5erSaHJ9p5';

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


let clientID;

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


//Create playlist

let today = new Date().toLocaleString("en-US").split(',')[0];
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
			displaySpotifyPlaylist();
			console.log('you made a playlist motherfucker!')
		}  
	}
	$.ajax(settings);
}

// Display playlist in screen

function displaySpotifyPlaylist() {
	$('#playlist-window').html(`
		<iframe src="https://open.spotify.com/embed/user/${clientID}/playlist/${playlistID}" width="300" height="380" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
		</br>
		<button class="save-playlist">Save Playlist</button>
		`);
	deletePlaylistFromSpotify();
}

// Unfollow Playlist in Spotify

function deletePlaylistFromSpotify() {
	let settings = {
		async: true,
		crossDomain: true,
		url: `https://api.spotify.com/v1/users/${clientID}/playlists/${playlistID}/followers`,
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		},
		success: function() {
			console.log('Playlist deleted!')
		}
	}
	$.ajax(settings);
}

// Save Playlist in Spotify

function savePlaylistInSpotify() {
	let settings = {
		async: true,
		crossDomain: true,
		url: `https://api.spotify.com/v1/users/${clientID}/playlists/${playlistID}/followers`,
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		},
		success: function() {
			console.log('Playlist saved!')
		}
	}
	$.ajax(settings);
}


//Initiate Spotify app
let spotifyArtistsSingleTopTracks = [];

function spotifyAppInitiate() {
	const spotifyArtists = artistList.map(getArtistsFromSpotify);
	let spotifyArtistsIDs = [];
	let spotifyArtistsTopTracks = [];
	Promise.all(spotifyArtists)
		.then(data => {
			const filteredData = data.filter(a => a.artists.items.length > 0);
			spotifyArtistsIDs = filteredData.map(a => a.artists.items[0].id);
			Promise.all(spotifyArtistsIDs.map(getArtistsTracksFromSpotify))
				.then(data => {
					const filteredTracks = data.filter(a => a.tracks.length > 0);
					spotifyArtistsSingleTopTracks = filteredTracks.map(a => "spotify:track:" + a.tracks[0].id);
					getClientInfoFromSpotify();
				})
		})
};


//------------------------------------------------------------
//Putting it all together
//------------------------------------------------------------


function watchSubmit() {
	$('#search-form').submit(e => {
		e.preventDefault();
		const queryTarget = $(e.currentTarget).find('#search-term');
		const query = queryTarget.val();
		getMetroAreaIDFromSongKick(query);
	})	
	$('.main-container').on('click', '.save-playlist', function(e) {
		e.preventDefault();
		savePlaylistInSpotify();
	})
}

watchSubmit();












