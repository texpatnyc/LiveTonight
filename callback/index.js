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

function getMetroAreaIDFromSongKick(city) {
	const settings = {
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
	const date = formatDateForSongKick();
	const settings = {
		url: `http://api.songkick.com/api/3.0/metro_areas/${id}/calendar.json`,
		data: {
			apikey: 'TGXBOdEJdH8k5A5w',
			min_date: date,
			max_date: date,
		},
		dataType: 'json',
		type: 'GET',
		success: function(data) {
			let concerts = data.resultsPage.results.event;
			concerts.sort(function(a, b) {
				return b.popularity - a.popularity
			});
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
	return `${yyyy}-${mm}-${dd}`
}

//Build Concert Listings
function renderResult(result) {
	return `
		<div class='concertListing'>
			<a href="https://www.songkick.com/artists/${result.performance[0].artist.id}">
				<img src="https://images.sk-static.com/images/media/profile_images/artists/${result.performance[0].artist.id}/large_avatar" 
				class="artistImg" alt="${result.performance[0].artist.displayName}">
			</a>
			<a href="https://www.songkick.com/artists/${result.performance[0].artist.id}">
				<span class="artistName">${result.performance[0].artist.displayName}</span>
			</a><br>
			<span class="venue">${result.venue.displayName}, ${result.location.city}</span><br>
			<a href="http://www.songkick.com/concerts/${result.id}">
				<button class="buy-tickets">BUY TICKETS</button>
			</a>
		</div>`
};

//Display concert listings
function displayConcertListings(data) {
	$('.main-container').html(`<div class ="left" id="concert-listings"></div><div class ="right" id="playlist-window"></div>`)
	const results = data.map((item, index) => renderResult(item));
	$('#concert-listings').html(`<a href="http://www.songkick.com"><img id="powered-by-songkick-logo" src="../images/powered-by-songkick-pink.png" alt="Songkick Logo"></a></br>${results.join('')}`);
}

//Create array of artitsts from concert listings
function createArtistList(data) {
	let artistList = data.map(a => a.performance[0].artist.displayName);
	spotifyAppInitiate(artistList);
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

const accessToken = getAccessToken();

// const accessToken = 'BQDP0hg4WkRrpdaB3XkSL_v0D2-vRp6let43EffTsgUhqzyXiBv_aIo9a2sMt3oZwpST96qBA6TbQddRyYxdiiE2nUnFFO6CZKH9QsyzTUd73YiTZXUqNDnW2uloQoU9jngpzFS1NKHTKm1R3j7iUhwa1X3a733ALnSrj1Y5X-HA48vJJDK-_DBbwZ4AJuR3L6LhhvbtzwgRw2BaeNh_fG-vF8vR'

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
	const settings = {
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
	const settings = {
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
	const settings = {
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
		}  
	}
	$.ajax(settings);
}

// Display playlist in screen

function displaySpotifyPlaylist() {
	$('#playlist-window').html(`
		<iframe src="https://open.spotify.com/embed/user/${clientID}/playlist/${playlistID}" class="spotifyPlaylist" frameborder="0" allowtransparency="true" allow="encrypted-media" aria-label="Spotify Playlist"></iframe>
		</br>
		<button class="save-playlist">SAVE PLAYLIST</button>
		`);
	deletePlaylistFromSpotify();
}

// Unfollow Playlist in Spotify

function deletePlaylistFromSpotify() {
	const settings = {
		async: true,
		crossDomain: true,
		url: `https://api.spotify.com/v1/users/${clientID}/playlists/${playlistID}/followers`,
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		}
	}
	$.ajax(settings);
}

// Save Playlist in Spotify

function savePlaylistInSpotify() {
	const settings = {
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

function spotifyAppInitiate(artistList) {
	const spotifyArtists = artistList.map(getArtistsFromSpotify);
	Promise.all(spotifyArtists)
		.then(data => {
			const filteredData = data.filter(a => a.artists.items.length > 0);
			const spotifyArtistsIDs = filteredData.map(a => a.artists.items[0].id);
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


(function () {
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
})();












