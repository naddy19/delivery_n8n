const routeData = $json.routeData;
const apiKey = $env.GOOGLE_MAPS_API_KEY;

let totalCandidates = 0;
const allCandidates = [];

routeData.groups.forEach(group => {
  group.streets.forEach(street => {
    const fromHouseStr = street.fromHouse ? String(street.fromHouse).replace(/\D/g, '') : '';
    const toHouseStr = street.toHouse ? String(street.toHouse).replace(/\D/g, '') : '';
    
    const fromHouse = fromHouseStr ? parseInt(fromHouseStr) : null;
    const toHouse = toHouseStr ? parseInt(toHouseStr) : null;
    
    if (fromHouse && toHouse && !isNaN(fromHouse) && !isNaN(toHouse)) {
      const start = Math.min(fromHouse, toHouse);
      const end = Math.max(fromHouse, toHouse);
      const isEven = start % 2 === 0;
      
      for (let i = start; i <= end; i += 2) {
        if ((i % 2 === 0) === isEven) {
          allCandidates.push({
            groupNumber: group.groupNumber,
            streetName: street.streetName,
            houseNumber: i,
            fullAddress: `${i} ${street.streetName}, Edmonton, AB, Canada`
          });
          totalCandidates++;
        }
      }
    } else if (fromHouse && !isNaN(fromHouse)) {
      allCandidates.push({
        groupNumber: group.groupNumber,
        streetName: street.streetName,
        houseNumber: fromHouse,
        fullAddress: `${fromHouse} ${street.streetName}, Edmonton, AB, Canada`
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
