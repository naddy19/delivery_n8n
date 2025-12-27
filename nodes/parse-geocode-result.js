// Process each geocode result and match it with the original address data
// Using $itemIndex to get the corresponding item from Generate Candidates
const geocodeResult = $json;
const itemIndex = $itemIndex;

// Get the corresponding address from Generate Candidates node using item index
const allCandidates = $('Generate Candidates').all();
const candidateItem = allCandidates[itemIndex];
const address = candidateItem?.json?.address || {};

let coordinates = null;
let status = 'not_found';
let exists = false;

if (geocodeResult.status === 'OK' && geocodeResult.results && geocodeResult.results.length > 0) {
  const location = geocodeResult.results[0].geometry.location;
  const locationType = geocodeResult.results[0].geometry.location_type;
  
  if (locationType === 'ROOFTOP' || locationType === 'RANGE_INTERPOLATED') {
    coordinates = {
      lat: location.lat,
      lng: location.lng
    };
    status = 'success';
    exists = true;
  } else {
    status = 'approximate';
  }
} else if (geocodeResult.status === 'ZERO_RESULTS') {
  status = 'not_found';
}

return {
  json: {
    groupNumber: address.groupNumber,
    streetName: address.streetName,
    houseNumber: address.houseNumber,
    fullAddress: address.fullAddress,
    coordinates: coordinates,
    geocodeStatus: status,
    exists: exists
  }
};
