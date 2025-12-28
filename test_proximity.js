// Test the proximity checking logic

// Haversine formula to calculate distance between two coordinates in meters
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

// Test with actual addresses from the data
const testAddresses = [
  { name: "503 Hillcrest Pt NW", lat: 53.50437469999999, lng: -113.5907607 },
  { name: "505 Hillcrest Pt NW", lat: 53.5044324, lng: -113.5914917 },
  { name: "507 Hillcrest Pt NW", lat: 53.5044614, lng: -113.5915486 },
  { name: "509 Hillcrest Pt NW", lat: 53.5045194, lng: -113.591871 },
  { name: "511 Hillcrest Pt NW", lat: 53.5045774, lng: -113.5921277 },
  { name: "7204 156 St NW", lat: 53.5042656, lng: -113.590797 },
  { name: "7206 156 St NW", lat: 53.5043619, lng: -113.590385 },
  { name: "7208 156 St NW", lat: 53.5044581, lng: -113.5907987 },
  { name: "7210 156 St NW", lat: 53.5045544, lng: -113.590385 }
];

console.log("Testing proximity between addresses:\n");

// Test Hillcrest Pt addresses (should all be close to each other)
console.log("=== Hillcrest Pt NW addresses ===");
for (let i = 0; i < 5; i++) {
  for (let j = i + 1; j < 5; j++) {
    const distance = calculateDistance(
      testAddresses[i].lat,
      testAddresses[i].lng,
      testAddresses[j].lat,
      testAddresses[j].lng
    );
    console.log(`${testAddresses[i].name} to ${testAddresses[j].name}: ${distance.toFixed(2)}m`);
  }
}

console.log("\n=== 156 St NW addresses ===");
for (let i = 5; i < 9; i++) {
  for (let j = i + 1; j < 9; j++) {
    const distance = calculateDistance(
      testAddresses[i].lat,
      testAddresses[i].lng,
      testAddresses[j].lat,
      testAddresses[j].lng
    );
    console.log(`${testAddresses[i].name} to ${testAddresses[j].name}: ${distance.toFixed(2)}m`);
  }
}

console.log("\n=== Cross-street distances (Hillcrest to 156 St) ===");
// Test distance between Hillcrest and 156 St addresses (should be close since they're in the same group)
const distance1 = calculateDistance(
  testAddresses[0].lat, // 503 Hillcrest
  testAddresses[0].lng,
  testAddresses[5].lat, // 7204 156 St
  testAddresses[5].lng
);
console.log(`503 Hillcrest Pt to 7204 156 St: ${distance1.toFixed(2)}m`);

const distance2 = calculateDistance(
  testAddresses[4].lat, // 511 Hillcrest
  testAddresses[4].lng,
  testAddresses[8].lat, // 7210 156 St
  testAddresses[8].lng
);
console.log(`511 Hillcrest Pt to 7210 156 St: ${distance2.toFixed(2)}m`);

console.log("\n=== Testing walking distance threshold (500m) ===");
testAddresses.forEach((addr, i) => {
  const nearbyAddresses = testAddresses.filter((other, j) => {
    if (i === j) return false;
    const dist = calculateDistance(addr.lat, addr.lng, other.lat, other.lng);
    return dist <= 500;
  });
  console.log(`${addr.name}: ${nearbyAddresses.length} addresses within 500m`);
});
