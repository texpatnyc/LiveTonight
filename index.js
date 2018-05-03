function activatePlacesSearch(){
    const input = document.getElementById('search-term');
    const options = {
    	types: ['(cities)']
    };
    let autocomplete = new google.maps.places.Autocomplete(input, options);
};

function renderResult(result) {
	return `
		<div class='concertListing'>
			<img src="${result.artistImage}" class="artistImg" alt="${result.artist}" width="74" height="74">
			<span class='artistName'>${result.artist}</span><br>
			${result.venue}, ${result.city}<br>
			<a href="${result.ticketLink}">
				<span class=button buy-tickets>Buy Tickets</span>
			</a>
		</div>`
};

function displayConcertListings(data) {
	const results = data.map((item, index) => renderResult(item));
	$('#concert-listings').html(results);
}

function watchSubmit() {
	$('#search-form').submit(e => {
		e.preventDefault();
		displayConcertListings(concertList);
	})
}

$(watchSubmit);