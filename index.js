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

const spotifyAccessToken = 'BQASw2lfTCAnwQgyMr75NQrC7D6qsKTPB5MCsqoXW1gzGJCGNJRLthPJhgzBPDCLkD8W6qoBadtA2BfkN1G6LL3oWGSLCfuv18xeZc5t3sNJNkl8J-JblB2bdC53W_p9181hl1SjvHTMYvc'

//Get artists from spotify
getArtistsFromSpotify = (artist) => $.ajax({
	url: 'https://api.spotify.com/v1/search',
	method: 'GET',
	dataType: 'json',
	data: {
		type: 'artist',
		q: artist,
		limit: 1
	},
	headers: {
        'Authorization': 'Bearer ' + spotifyAccessToken
    }
});

//Get top tracks for artist

getArtistsTracksFromSpotify = (id) => $.ajax({

	url: `https://api.spotify.com/v1/artists/${id}/top-tracks/`,
	method: 'GET',
	dataType: 'json',
	data: {
		country: 'US',
	},
	headers: {
		'Authorization': 'Bearer ' + spotifyAccessToken
	},
//	success: console.log('Top Tracks Received')

})



//Create playlist

//<iframe src="https://open.spotify.com/embed/track/5HF5PRNJ8KGtbzNPPc93tG" width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>

//Initiate Spotify app
function spotifyAppInitiate() {
	let spotifyArtists = artistList.map(getArtistsFromSpotify);
	let spotifyArtistsIDs = [];
	let spotifyArtistsTopTracks = [];
	let spotifyArtistsSingleTopTracks = [];

	$.when(...spotifyArtists)
		.then((...spotifyArtists) => {
			spotifyArtistsIDs = spotifyArtists.map(a => a[0].artists.items[0].id);
			console.log(spotifyArtists);
			console.log(spotifyArtistsIDs);
			$.when(...spotifyArtistsIDs)
				.then((...spotifyArtistsIDs) => {
					spotifyArtistsTopTracks = spotifyArtistsIDs.map(getArtistsTracksFromSpotify);
					console.log(spotifyArtistsTopTracks);
					$.when(...spotifyArtistsTopTracks)
						.then((...spotifyArtistsTopTracks) => {
							spotifyArtistsSingleTopTracks = spotifyArtistsTopTracks.map(b => b[0].tracks[0].id);
							console.log(spotifyArtistsSingleTopTracks);
						})
						
					
				})
		});

	
		

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