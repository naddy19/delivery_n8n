const items = $input.all();

const existingAddresses = items.filter(item => item.json.exists).map(item => item.json);
const notFoundCount = items.length - existingAddresses.length;

console.log(`Found ${existingAddresses.length} existing addresses out of ${items.length} candidates`);

// Function to calculate distance between two coordinates in meters (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Function to check if an address is within walking distance of any address in the group
function isWithinWalkingDistance(address, groupAddresses, maxDistance = 500) {
  if (!address.coordinates || !address.coordinates.lat || !address.coordinates.lng) {
    return false;
  }
  
  // If this is the only address in the group, it's valid
  if (groupAddresses.length === 0) {
    return true;
  }
  
  // Check if this address is within maxDistance meters of at least one other address in the group
  for (const otherAddr of groupAddresses) {
    if (!otherAddr.coordinates || !otherAddr.coordinates.lat || !otherAddr.coordinates.lng) {
      continue;
    }
    
    const distance = calculateDistance(
      address.coordinates.lat,
      address.coordinates.lng,
      otherAddr.coordinates.lat,
      otherAddr.coordinates.lng
    );
    
    if (distance <= maxDistance) {
      return true;
    }
  }
  
  return false;
}

// Group addresses by group number
const groups = {};
existingAddresses.forEach(addr => {
  if (!groups[addr.groupNumber]) {
    groups[addr.groupNumber] = [];
  }
  groups[addr.groupNumber].push(addr);
});

// Filter addresses by proximity within each group
const filteredGroups = {};
let totalDiscarded = 0;

Object.keys(groups).forEach(groupNum => {
  const groupAddresses = groups[groupNum];
  filteredGroups[groupNum] = [];
  
  // Add addresses one by one, checking if they're within walking distance
  groupAddresses.forEach(addr => {
    if (isWithinWalkingDistance(addr, filteredGroups[groupNum], 500)) {
      filteredGroups[groupNum].push(addr);
    } else {
      totalDiscarded++;
      console.log(`Discarded ${addr.fullAddress} from group ${groupNum} - not within walking distance`);
    }
  });
});

console.log(`Discarded ${totalDiscarded} addresses due to proximity constraints`);

const groupedData = Object.keys(filteredGroups).sort((a, b) => parseInt(a) - parseInt(b)).map(groupNum => {
  const addresses = filteredGroups[groupNum];
  const streetMap = {};
  
  addresses.forEach(addr => {
    if (!streetMap[addr.streetName]) {
      streetMap[addr.streetName] = [];
    }
    streetMap[addr.streetName].push(addr);
  });
  
  return {
    groupNumber: parseInt(groupNum),
    streets: Object.keys(streetMap).map(streetName => ({
      streetName: streetName,
      addresses: streetMap[streetName]
    })),
    totalHouses: addresses.length
  };
});

const totalValidHouses = Object.values(filteredGroups).reduce((sum, arr) => sum + arr.length, 0);
const successfulGeocodes = Object.values(filteredGroups).flat().filter(a => a.coordinates !== null).length;
const rooftopCount = Object.values(filteredGroups).flat().filter(a => a.geocodeStatus === 'rooftop').length;
const interpolatedCount = Object.values(filteredGroups).flat().filter(a => a.geocodeStatus === 'interpolated').length;

console.log(`Summary: ${rooftopCount} ROOFTOP (confirmed), ${interpolatedCount} INTERPOLATED (verify)`);

return {
  json: {
    groups: groupedData,
    summary: {
      totalGroups: groupedData.length,
      totalCandidates: items.length,
      totalHouses: totalValidHouses,
      geocodedHouses: successfulGeocodes,
      rooftopAddresses: rooftopCount,
      interpolatedAddresses: interpolatedCount,
      notFound: notFoundCount,
      discardedDueToProximity: totalDiscarded
    }
  }
};
