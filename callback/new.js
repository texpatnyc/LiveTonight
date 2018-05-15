var access_token;

function getParameterByName(name) {
  var match = RegExp('[#&]' + name + '=([^&]*)').exec(window.location.hash);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function getAccessToken() {
  return getParameterByName('access_token');
}

function ExtractAccessToken() {
	access_token = getAccessToken();
  	$('.accessToken').html(`Your access token is: ${access_token}`);
}

ExtractAccessToken();