// Process each geocode result
// Address data is passed through from Generate Candidates node
// Try to get geocode response from either geocodeResponse property or root $json
const geocodeResult = $json.geocodeResponse || $json;

// Address fields should be available directly in $json (if passed through HTTP Request)
// Otherwise fall back to using itemIndex
let address;
if ($json.address) {
  address = {
    groupNumber: $json.address?.groupNumber,
    streetName: $json.address?.streetName,
    houseNumber: $json.address?.houseNumber,
    fullAddress: $json.address?.fullAddress
  };
} else {
  // Fallback: use itemIndex to look back at Generate Candidates
  const allCandidates = $('Generate Candidates').all();
  const candidateItem = allCandidates[$itemIndex];
  address = candidateItem?.json?.address || {};
}

let coordinates = null;
let status = 'not_found';
let exists = false;

if (geocodeResult && geocodeResult.status === 'OK' && geocodeResult.results && geocodeResult.results.length > 0) {
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
