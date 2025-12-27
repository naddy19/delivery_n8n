const items = $input.all();

const existingAddresses = items.filter(item => item.json.exists).map(item => item.json);
const notFoundCount = items.length - existingAddresses.length;

console.log(`Found ${existingAddresses.length} existing addresses out of ${items.length} candidates`);

const groups = {};
existingAddresses.forEach(addr => {
  if (!groups[addr.groupNumber]) {
    groups[addr.groupNumber] = [];
  }
  groups[addr.groupNumber].push(addr);
});

const groupedData = Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b)).map(groupNum => {
  const addresses = groups[groupNum];
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

const totalValidHouses = existingAddresses.length;
const successfulGeocodes = existingAddresses.filter(a => a.coordinates !== null).length;

return {
  json: {
    groups: groupedData,
    summary: {
      totalGroups: groupedData.length,
      totalCandidates: items.length,
      totalHouses: totalValidHouses,
      geocodedHouses: successfulGeocodes,
      notFound: notFoundCount
    }
  }
};
