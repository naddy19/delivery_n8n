const claudeResult = $json;

if (!claudeResult.success || !claudeResult.groups || claudeResult.groups.length === 0) {
  return {
    json: {
      routeData: {
        totalGroups: 0,
        groups: []
      },
      summary: {
        totalGroups: 0,
        totalStreets: 0,
        totalHouses: 0
      }
    }
  };
}

const groupsArray = claudeResult.groups.map(group => ({
  groupNumber: group.groupNumber,
  streets: (group.streets || []).map(street => ({
    streetName: street.streetName,
    fromHouse: street.fromHouse || '',
    toHouse: street.toHouse || '',
    numberOfHouses: street.numberOfHouses || null
  })),
  totalStreets: (group.streets || []).length
}));

groupsArray.sort((a, b) => a.groupNumber - b.groupNumber);

return {
  json: {
    routeData: {
      totalGroups: groupsArray.length,
      groups: groupsArray,
      source: 'claude-vision'
    },
    summary: {
      totalGroups: groupsArray.length,
      totalStreets: groupsArray.reduce((sum, g) => sum + g.totalStreets, 0),
      totalHouses: 0
    }
  }
};
