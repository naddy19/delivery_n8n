const data = $json;

let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Delivery Route</title>
  <style>
    body { font-family: Arial; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
    h1 { color: #2c3e50; text-align: center; }
    .summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
    .summary-item { text-align: center; }
    .summary-number { font-size: 32px; font-weight: bold; display: block; }
    .summary-label { font-size: 14px; opacity: 0.9; }
    .group { margin-bottom: 25px; border: 2px solid #3498db; border-radius: 8px; overflow: hidden; }
    .group-header { background: #3498db; color: white; padding: 15px; font-size: 20px; font-weight: bold; }
    .street-section { padding: 15px; border-bottom: 1px solid #eee; }
    .street-name { font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
    .address-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 8px; }
    .address-item { padding: 8px; background: #f8f9fa; border-radius: 5px; font-size: 13px; border-left: 3px solid #27ae60; }
    .address-number { font-weight: bold; }
    .coordinates { color: #666; font-size: 11px; margin-top: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📍 Delivery Route with Geocoded Addresses</h1>
    <div class="summary">
      <div class="summary-item"><span class="summary-number">${data.summary.totalGroups}</span><span class="summary-label">Groups</span></div>
      <div class="summary-item"><span class="summary-number">${data.summary.totalHouses}</span><span class="summary-label">Actual Houses</span></div>
      <div class="summary-item"><span class="summary-number">${data.summary.totalCandidates}</span><span class="summary-label">Tested</span></div>
      <div class="summary-item"><span class="summary-number">${data.summary.notFound}</span><span class="summary-label">Not Found</span></div>
    </div>
`;

data.groups.forEach(group => {
  html += `<div class="group"><div class="group-header">Group ${group.groupNumber} - ${group.totalHouses} Houses</div>`;
  group.streets.forEach(street => {
    html += `<div class="street-section"><div class="street-name">📍 ${street.streetName} (${street.addresses.length} houses)</div><div class="address-list">`;
    street.addresses.forEach(addr => {
      const coordText = addr.coordinates ? `${addr.coordinates.lat.toFixed(6)}, ${addr.coordinates.lng.toFixed(6)}` : 'No coords';
      html += `<div class="address-item"><div class="address-number">${addr.houseNumber} ${addr.streetName}</div><div class="coordinates">${coordText}</div></div>`;
    });
    html += `</div></div>`;
  });
  html += `</div>`;
});

html += `</div></body></html>`;

return { json: { html: html, data: data } };
