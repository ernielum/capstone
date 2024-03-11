'use strict';

var map;

// Define an info window variable
var infoWindow = new google.maps.InfoWindow();

// Variable to store current tripId
var tripId;

// Variable to store experience from search
var experience;

// Initialize the map
function initMap() {
  // Specify the center coordinates for the map
  var centerCoordinates = { lat: 40.7128, lng: -74.0060 }; // Default to New York City
  var defaultZoom = 12; // Set default zoom level

  // Check if there are saved coordinates in local storage
  var savedCoordinates = localStorage.getItem('mapCoordinates');
  if (savedCoordinates) {
    centerCoordinates = JSON.parse(savedCoordinates);
  }

  // Check if there is saved zoom level in local storage
  var savedZoom = localStorage.getItem('mapZoom');
  if (savedZoom) {
    defaultZoom = JSON.parse(savedZoom);
  }

  // Create a new map instance and specify the map container
  map = new google.maps.Map(document.getElementById('map'), {
    center: centerCoordinates,
    zoom: defaultZoom
  })

  // Initialize the Places Autocomplete service
  var input = document.getElementById('place-search');
  var autocomplete = new google.maps.places.Autocomplete(input);

  // Bias the search results to the map's viewport
  autocomplete.bindTo('bounds', map);
}

// Function to handle place search
function searchPlaces() {
  var input = document.getElementById('place-search').value;

  var request = {
    query: input,
    fields: ['geometry', 'place_id', 'name', 'formatted_address']
  };

  var service = new google.maps.places.PlacesService(map);

  service.findPlaceFromQuery(request, function (results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length) {

      experience = results

      var location = results[0].geometry.location;
      map.setCenter(location);
      map.setZoom(16);

      // Content to be displayed in infowindow
      var content = '<strong>' + results[0].name + '</strong><br>';
      content += results[0].formatted_address + '<br>';

      // Open the info window at the found location
      infoWindow.setContent(content);
      infoWindow.setPosition(location);
      infoWindow.open(map);

      // Show pin button after search
      document.getElementById('pin-button').style.display = 'block';

    } else {
      console.error('Place search failed:', status);
    }
  });
}

function pinExperience() {
  // Save the new center coordinates to local storage
  var center = map.getCenter();
  localStorage.setItem('mapCoordinates', JSON.stringify({ lat: center.lat(), lng: center.lng() }));

  // Save the new zoom level to local storage
  var zoom = map.getZoom();
  localStorage.setItem('mapZoom', zoom.toString());

  if (experience && tripId) {
    fetch('/experience_pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tripId: tripId, experience: experience })
    })
      .then(response => {
        if (response.ok) {
          console.log('Experience pinned successfully');
          // Hide the pin button after successful pinning
          document.getElementById('pin-button').style.display = 'none';
          location.reload();
        } else {
          console.error('Failed to pin experience:', response.statusText);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
}


/**********************************************************
 * Center a pinned Experience on the map
 * 
 *********************************************************/
// Function to center a pinned Experience on the map
function findExperience(place_id) {
  var input = place_id;

  var request = {
    query: input,
    fields: ['geometry', 'place_id', 'name', 'formatted_address']
  };

  var service = new google.maps.places.PlacesService(map);

  service.findPlaceFromQuery(request, function (results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length) {

      experience = results

      var location = results[0].geometry.location;
      map.setCenter(location);
      map.setZoom(16);

      // Content to be displayed in infowindow
      var content = '<strong>' + results[0].name + '</strong><br>';
      content += results[0].formatted_address + '<br>';

      // Open the info window at the found location
      infoWindow.setContent(content);
      infoWindow.setPosition(location);
      infoWindow.open(map);

    } else {
      console.error('Place search failed:', status);
    }
  });
}


/**********************************************************
 * Display and Update Rating
 * Dynamic User Rating Script (includes hover effect)
 *********************************************************/
function ratings() {
  const stars = document.querySelectorAll('#user-rating .user-star');
  let ratingValue = document.getElementById('userRatingValue').value;
  const form = document.getElementById('rate-experience'); // Reference to the form

  const updateRatingDisplay = (rating) => {
    stars.forEach((star, index) => {
      star.classList.toggle('full-star', index < rating);
      star.classList.toggle('empty-star', index >= rating);
    });
  };

  stars.forEach((star, index) => {
    // Preview rating on hover
    star.addEventListener('mouseover', () => updateRatingDisplay(index + 1));

    // Set rating on click and submit form
    star.addEventListener('click', () => {
      const rating = index + 1;
      var user_rating = 0;
      // calculate rating from total star indices (modulus 5)
      user_rating = rating % 5;
      // account for ratings of 5, set to 5 rather than 0
      if (user_rating == 0) {
        user_rating = 5;
      }
      document.getElementById('userRatingValue').value = user_rating; // Update hidden input with the rating
      updateRatingDisplay(rating);

      // Get the parent form of the clicked star
      const parentForm = star.closest('.rate-form');
      // Get the experienceId associated with the parent form
      const experienceId = parentForm.querySelector('input[name="experienceId"]').value;
      // Update the hidden input with the experienceId
      form.querySelector('input[name="experienceId"]').value = experienceId;

      // Submit the form
      form.submit();

    });

    // Reset preview on mouse out to reflect actual selected rating
    star.addEventListener('mouseleave', () => updateRatingDisplay(ratingValue));
  });

  // Reset to actual rating when not hovering over the stars
  document.getElementById('user-rating').addEventListener('mouseleave', () => {
    updateRatingDisplay(ratingValue);
  });
}

// Call initMap when the page has loaded
document.addEventListener('DOMContentLoaded', function () {
  initMap();
  tripId = document.getElementById('tripId').value;
  ratings();
});