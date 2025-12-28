const data = $json;

let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Delivery Route - Validation</title>
  <style>
    body { font-family: Arial; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
    h1 { color: #2c3e50; text-align: center; margin-bottom: 10px; }
    .subtitle { text-align: center; color: #7f8c8d; margin-bottom: 30px; font-size: 14px; }
    .summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
    .summary-item { text-align: center; }
    .summary-number { font-size: 32px; font-weight: bold; display: block; }
    .summary-label { font-size: 13px; opacity: 0.9; }
    .actions-bar { background: #34495e; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 10px; align-items: center; justify-content: space-between; }
    .action-btn { padding: 12px 24px; border: none; border-radius: 5px; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.3s; }
    .submit-btn { background: #27ae60; color: white; font-size: 16px; }
    .submit-btn:hover { background: #229954; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
    .select-all-btn, .deselect-all-btn { background: #3498db; color: white; }
    .select-all-btn:hover, .deselect-all-btn:hover { background: #2980b9; }
    .export-json-btn { background: #9b59b6; color: white; }
    .export-json-btn:hover { background: #8e44ad; }
    .validation-stats { color: white; font-size: 14px; }
    .group { margin-bottom: 25px; border: 2px solid #3498db; border-radius: 8px; overflow: hidden; }
    .group-header { background: #3498db; color: white; padding: 15px; font-size: 20px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
    .group-stats { font-size: 14px; opacity: 0.9; }
    .street-section { padding: 15px; border-bottom: 1px solid #eee; }
    .street-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .street-name { font-weight: bold; color: #2c3e50; font-size: 16px; }
    .street-actions { display: flex; gap: 8px; }
    .street-btn { padding: 6px 12px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; background: #ecf0f1; color: #2c3e50; }
    .street-btn:hover { background: #bdc3c7; }
    .address-table { width: 100%; border-collapse: collapse; }
    .address-table th { background: #f8f9fa; padding: 10px; text-align: left; font-size: 13px; border-bottom: 2px solid #dee2e6; }
    .address-table td { padding: 10px; border-bottom: 1px solid #dee2e6; font-size: 13px; }
    .address-row { transition: background 0.2s; }
    .address-row:hover { background: #f8f9fa; }
    .address-row.invalid { opacity: 0.5; background: #fee; }
    .checkbox-cell { width: 40px; text-align: center; }
    .status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .status-rooftop { background: #d4edda; color: #155724; }
    .status-interpolated { background: #fff3cd; color: #856404; }
    .status-unknown { background: #e2e3e5; color: #383d41; }
    .coordinates { color: #666; font-size: 11px; font-family: monospace; }
    .map-link { color: #3498db; text-decoration: none; font-size: 12px; }
    .map-link:hover { text-decoration: underline; }
    input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
    .hidden { display: none; }
    .toast { position: fixed; top: 20px; right: 20px; background: #27ae60; color: white; padding: 15px 20px; border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 1000; animation: slideIn 0.3s; }
    @keyframes slideIn { from { transform: translateX(400px); } to { transform: translateX(0); } }
  </style>
</head>
<body>
  <div class="container">
    <h1>📍 Delivery Route Address Validation</h1>
    <div class="subtitle">Review and validate geocoded addresses. Uncheck invalid addresses before submitting.</div>
    <div class="summary">
      <div class="summary-item"><span class="summary-number">${data.summary.totalGroups}</span><span class="summary-label">Groups</span></div>
      <div class="summary-item"><span class="summary-number">${data.summary.totalHouses}</span><span class="summary-label">Valid Addresses</span></div>
      <div class="summary-item"><span class="summary-number">${data.summary.rooftopAddresses || 0}</span><span class="summary-label">✓ Confirmed</span></div>
      <div class="summary-item"><span class="summary-number">${data.summary.interpolatedAddresses || 0}</span><span class="summary-label">⚠ Verify</span></div>
      <div class="summary-item"><span class="summary-number">${data.summary.notFound}</span><span class="summary-label">Not Found</span></div>
      <div class="summary-item"><span class="summary-number">${data.summary.discardedDueToProximity || 0}</span><span class="summary-label">Too Far</span></div>
    </div>
    <div class="actions-bar">
      <div style="display: flex; gap: 10px;">
        <button class="action-btn select-all-btn" onclick="selectAll()">✓ Select All</button>
        <button class="action-btn deselect-all-btn" onclick="deselectAll()">✗ Deselect All</button>
      </div>
      <div class="validation-stats">
        <span id="selectedCount">${data.summary.totalHouses}</span> addresses selected
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="action-btn export-json-btn" onclick="exportJSON()">📥 Export JSON</button>
        <button class="action-btn submit-btn" onclick="submitValidation()">✓ Submit Validated Addresses</button>
      </div>
    </div>
`;


data.groups.forEach(group => {
  const groupId = `group-${group.groupNumber}`;
  html += `<div class="group" id="${groupId}">
    <div class="group-header">
      <span>Group ${group.groupNumber} - ${group.totalHouses} Houses</span>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button class="action-btn" style="background: #e67e22; color: white; padding: 8px 16px; font-size: 14px;" onclick="generateRouteMap('${groupId}')">
          🗺️ Generate Route Map
        </button>
        <span class="group-stats">
          <span id="${groupId}-selected">${group.totalHouses}</span> selected
        </span>
      </div>
    </div>`;
  
  group.streets.forEach((street, streetIdx) => {
    const streetId = `${groupId}-street-${streetIdx}`;
    html += `<div class="street-section">
      <div class="street-header">
        <div class="street-name">📍 ${street.streetName} (${street.addresses.length} houses)</div>
        <div class="street-actions">
          <button class="street-btn" onclick="selectStreet('${streetId}')">✓ Select All</button>
          <button class="street-btn" onclick="deselectStreet('${streetId}')">✗ Deselect All</button>
        </div>
      </div>
      <table class="address-table" id="${streetId}">
        <thead>
          <tr>
            <th class="checkbox-cell">✓</th>
            <th>House #</th>
            <th>Full Address</th>
            <th>Status</th>
            <th>Coordinates</th>
            <th>Map</th>
          </tr>
        </thead>
        <tbody>`;
    
    street.addresses.forEach((addr, addrIdx) => {
      const addressId = `${streetId}-addr-${addrIdx}`;
      const coordText = addr.coordinates ? `${addr.coordinates.lat.toFixed(6)}, ${addr.coordinates.lng.toFixed(6)}` : 'No coords';
      const mapLink = addr.coordinates ? `https://www.google.com/maps?q=${addr.coordinates.lat},${addr.coordinates.lng}` : '#';
      
      let statusBadge = '<span class="status-badge status-unknown">Unknown</span>';
      if (addr.geocodeStatus === 'rooftop') {
        statusBadge = '<span class="status-badge status-rooftop">✓ ROOFTOP</span>';
      } else if (addr.geocodeStatus === 'interpolated') {
        statusBadge = '<span class="status-badge status-interpolated">⚠ INTERPOLATED</span>';
      }
      
      html += `<tr class="address-row" id="${addressId}" data-group="${group.groupNumber}" data-street="${street.streetName}">
        <td class="checkbox-cell">
          <input type="checkbox" checked onchange="updateCounts()" data-address='${JSON.stringify(addr).replace(/'/g, "&apos;")}'>
        </td>
        <td><strong>${addr.houseNumber}</strong></td>
        <td>${addr.fullAddress}</td>
        <td>${statusBadge}</td>
        <td class="coordinates">${coordText}</td>
        <td>${addr.coordinates ? `<a href="${mapLink}" target="_blank" class="map-link">View Map</a>` : '-'}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div>`;
  });
  
  html += `</div>`;
});

html += `</div>
<script>
function updateCounts() {
  const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
  document.getElementById('selectedCount').textContent = checkedCount;
  
  // Update group counts
  document.querySelectorAll('.group').forEach(group => {
    const groupId = group.id;
    const groupCheckboxes = group.querySelectorAll('input[type="checkbox"]');
    const groupChecked = Array.from(groupCheckboxes).filter(cb => cb.checked).length;
    const countElement = document.getElementById(groupId + '-selected');
    if (countElement) countElement.textContent = groupChecked;
  });
  
  // Update row styling
  allCheckboxes.forEach(cb => {
    const row = cb.closest('tr');
    if (row) {
      if (cb.checked) {
        row.classList.remove('invalid');
      } else {
        row.classList.add('invalid');
      }
    }
  });
}

function selectAll() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
  updateCounts();
}

function deselectAll() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  updateCounts();
}

function selectStreet(streetId) {
  document.querySelectorAll('#' + streetId + ' input[type="checkbox"]').forEach(cb => cb.checked = true);
  updateCounts();
}

function deselectStreet(streetId) {
  document.querySelectorAll('#' + streetId + ' input[type="checkbox"]').forEach(cb => cb.checked = false);
  updateCounts();
}

function exportJSON() {
  const validatedData = getValidatedData();
  const json = JSON.stringify(validatedData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'validated-addresses-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  showToast('JSON exported successfully!');
}

function getValidatedData() {
  const groups = {};
  
  document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
    const address = JSON.parse(cb.dataset.address);
    const row = cb.closest('tr');
    const groupNum = row.dataset.group;
    const streetName = row.dataset.street;
    
    if (!groups[groupNum]) {
      groups[groupNum] = { groupNumber: parseInt(groupNum), streets: {}, totalHouses: 0 };
    }
    
    if (!groups[groupNum].streets[streetName]) {
      groups[groupNum].streets[streetName] = { streetName: streetName, addresses: [] };
    }
    
    groups[groupNum].streets[streetName].addresses.push(address);
    groups[groupNum].totalHouses++;
  });
  
  const groupsArray = Object.values(groups).map(g => ({
    ...g,
    streets: Object.values(g.streets)
  }));
  
  return {
    groups: groupsArray,
    summary: {
      totalGroups: groupsArray.length,
      totalValidatedAddresses: Object.values(groups).reduce((sum, g) => sum + g.totalHouses, 0),
      validatedAt: new Date().toISOString()
    }
  };
}

function submitValidation() {
  const validatedData = getValidatedData();
  const totalSelected = validatedData.summary.totalValidatedAddresses;
  
  if (totalSelected === 0) {
    alert('⚠️ No addresses selected! Please select at least one address.');
    return;
  }
  
  if (confirm(\`Submit \${totalSelected} validated addresses?\\n\\nThis will finalize the address list.\`)) {
    console.log('Validated Data:', validatedData);
    showToast(\`✓ \${totalSelected} addresses validated successfully!\`);
    
    // Auto-download the JSON
    exportJSON();
    
    // You can also send this data back to n8n via webhook or API
    // Example: fetch('/webhook/validated-addresses', { method: 'POST', body: JSON.stringify(validatedData) });
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function generateRouteMap(groupId) {
  // Get all checked addresses in this group
  const group = document.getElementById(groupId);
  const checkedCheckboxes = group.querySelectorAll('input[type="checkbox"]:checked');
  
  if (checkedCheckboxes.length === 0) {
    alert('⚠️ No addresses selected in this group! Please select at least one address.');
    return;
  }
  
  // Collect all addresses with coordinates
  const addresses = [];
  checkedCheckboxes.forEach(cb => {
    const address = JSON.parse(cb.dataset.address);
    if (address.coordinates && address.coordinates.lat && address.coordinates.lng) {
      addresses.push(address);
    }
  });
  
  if (addresses.length === 0) {
    alert('⚠️ No valid coordinates found for selected addresses!');
    return;
  }
  
  // Build Google Maps URL with optimized route
  // Format: https://www.google.com/maps/dir/?api=1&origin=LAT,LNG&destination=LAT,LNG&waypoints=LAT,LNG|LAT,LNG
  
  if (addresses.length === 1) {
    // Single address - just open the location
    const addr = addresses[0];
    const url = \`https://www.google.com/maps?q=\${addr.coordinates.lat},\${addr.coordinates.lng}\`;
    window.open(url, '_blank');
    showToast('Opening single address location...');
  } else {
    // Multiple addresses - create route
    const origin = addresses[0];
    const destination = addresses[addresses.length - 1];
    const waypoints = addresses.slice(1, -1).map(a => \`\${a.coordinates.lat},\${a.coordinates.lng}\`).join('|');
    
    let url = \`https://www.google.com/maps/dir/?api=1&origin=\${origin.coordinates.lat},\${origin.coordinates.lng}&destination=\${destination.coordinates.lat},\${destination.coordinates.lng}\`;
    
    if (waypoints) {
      url += \`&waypoints=\${waypoints}\`;
    }
    
    // Add travelmode (walking for delivery)
    url += '&travelmode=walking';
    
    window.open(url, '_blank');
    showToast(\`Opening route with \${addresses.length} stops...\`);
  }
}

// Initialize counts on load
updateCounts();
</script>
</body>
</html>`;

return { json: { html: html, data: data } };
