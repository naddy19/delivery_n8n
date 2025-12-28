const routeData = $json.routeData;
const apiKey = $env.GOOGLE_MAPS_API_KEY;

let totalCandidates = 0;
const allCandidates = [];

// Helper function to expand street abbreviations for better geocoding accuracy
function expandStreetName(streetName) {
  return streetName
    .replace(/\bPT\b/gi, 'Point')
    .replace(/\bST\b/gi, 'Street')
    .replace(/\bAVE?\b/gi, 'Avenue')
    .replace(/\bRD\b/gi, 'Road')
    .replace(/\bDR\b/gi, 'Drive')
    .replace(/\bBLVD\b/gi, 'Boulevard')
    .replace(/\bCR\b/gi, 'Crescent')
    .replace(/\bPL\b/gi, 'Place')
    .replace(/\bCT\b/gi, 'Court')
    .replace(/\bNW\b/gi, 'NW')  // Keep NW as-is
    .replace(/\bNE\b/gi, 'NE')
    .replace(/\bSW\b/gi, 'SW')
    .replace(/\bSE\b/gi, 'SE');
}

routeData.groups.forEach(group => {
  group.streets.forEach(street => {
    const fromHouseStr = street.fromHouse ? String(street.fromHouse).replace(/\D/g, '') : '';
    const toHouseStr = street.toHouse ? String(street.toHouse).replace(/\D/g, '') : '';
    
    const fromHouse = fromHouseStr ? parseInt(fromHouseStr) : null;
    const toHouse = toHouseStr ? parseInt(toHouseStr) : null;
    const numberOfHouses = street.numberOfHouses ? parseInt(street.numberOfHouses) : null;
    
    if (fromHouse && toHouse && !isNaN(fromHouse) && !isNaN(toHouse)) {
      // Determine if we're going ascending or descending
      const isAscending = fromHouse < toHouse;
      const start = fromHouse;
      const end = toHouse;
      const isEven = start % 2 === 0;
      
      // Generate addresses in the correct direction (ascending or descending)
      let count = 0;
      if (isAscending) {
        // Ascending: increment house numbers
        for (let i = start; i <= end; i += 2) {
          if ((i % 2 === 0) === isEven) {
            // If numberOfHouses is specified, only generate that many addresses
            if (numberOfHouses && count >= numberOfHouses) {
              break;
            }
            
            const expandedStreetName = expandStreetName(street.streetName);
            
            allCandidates.push({
              groupNumber: group.groupNumber,
              streetName: street.streetName,
              houseNumber: i,
              fullAddress: `${i} ${expandedStreetName}, Edmonton, AB, Canada`
            });
            totalCandidates++;
            count++;
          }
        }
      } else {
        // Descending: decrement house numbers
        for (let i = start; i >= end; i -= 2) {
          if ((i % 2 === 0) === isEven) {
            // If numberOfHouses is specified, only generate that many addresses
            if (numberOfHouses && count >= numberOfHouses) {
              break;
            }
            
            const expandedStreetName = expandStreetName(street.streetName);
            
            allCandidates.push({
              groupNumber: group.groupNumber,
              streetName: street.streetName,
              houseNumber: i,
              fullAddress: `${i} ${expandedStreetName}, Edmonton, AB, Canada`
            });
            totalCandidates++;
            count++;
          }
        }
      }
    } else if (fromHouse && !isNaN(fromHouse)) {
      const expandedStreetName = expandStreetName(street.streetName);
      
      allCandidates.push({
        groupNumber: group.groupNumber,
        streetName: street.streetName,
        houseNumber: fromHouse,
        fullAddress: `${fromHouse} ${expandedStreetName}, Edmonton, AB, Canada`
      });
      totalCandidates++;
    }
  });
});

console.log(`Generated ${totalCandidates} candidate addresses`);

return allCandidates.map(addr => ({
  json: {
    address: addr,
    apiKey: apiKey,
    routeData: routeData
  }
}));
