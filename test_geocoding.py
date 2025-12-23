#!/usr/bin/env python3
"""
Test script to validate geocoding logic for delivery route addresses.
Reads candidates from generate_candidates.json and geocodes them using Google Maps API.
"""

import json
import os
import time
import requests
from urllib.parse import quote

def load_candidates(filepath):
    """Load candidate addresses from JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Extract addresses from the format
    candidates = []
    for item in data:
        # Try different structures
        if 'address' in item:
            candidates.append(item['address'])
        elif 'json' in item and 'address' in item['json']:
            candidates.append(item['json']['address'])
    
    print(f"Loaded {len(candidates)} candidate addresses")
    return candidates

def geocode_address(address_str, api_key):
    """
    Geocode a single address using Google Maps Geocoding API.
    Returns: dict with coordinates, status, and exists flag.
    """
    url = f"https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        'address': address_str,
        'key': api_key
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        result = response.json()
        
        if result['status'] == 'OK' and result.get('results'):
            location = result['results'][0]['geometry']['location']
            location_type = result['results'][0]['geometry']['location_type']
            
            # Only accept ROOFTOP or RANGE_INTERPOLATED
            if location_type in ['ROOFTOP', 'RANGE_INTERPOLATED']:
                return {
                    'coordinates': {
                        'lat': location['lat'],
                        'lng': location['lng']
                    },
                    'location_type': location_type,
                    'status': 'success',
                    'exists': True
                }
            else:
                return {
                    'coordinates': None,
                    'location_type': location_type,
                    'status': 'approximate',
                    'exists': False
                }
        elif result['status'] == 'ZERO_RESULTS':
            return {
                'coordinates': None,
                'location_type': None,
                'status': 'not_found',
                'exists': False
            }
        else:
            return {
                'coordinates': None,
                'location_type': None,
                'status': result['status'],
                'exists': False
            }
    
    except Exception as e:
        print(f"  Error geocoding {address_str}: {e}")
        return {
            'coordinates': None,
            'location_type': None,
            'status': 'error',
            'exists': False,
            'error': str(e)
        }

def aggregate_results(geocoded_addresses):
    """
    Aggregate geocoded addresses by group and street.
    Returns: dict with groups, streets, and summary statistics.
    """
    # Filter only existing addresses
    existing = [addr for addr in geocoded_addresses if addr.get('exists')]
    
    print(f"\nFound {len(existing)} existing addresses out of {len(geocoded_addresses)} candidates")
    
    # Group by group number
    groups = {}
    for addr in existing:
        group_num = addr['groupNumber']
        if group_num not in groups:
            groups[group_num] = []
        groups[group_num].append(addr)
    
    # Structure by group and street
    grouped_data = []
    for group_num in sorted(groups.keys()):
        addresses = groups[group_num]
        
        # Group by street within this group
        streets = {}
        for addr in addresses:
            street_name = addr['streetName']
            if street_name not in streets:
                streets[street_name] = []
            streets[street_name].append(addr)
        
        grouped_data.append({
            'groupNumber': group_num,
            'streets': [
                {
                    'streetName': street_name,
                    'addresses': sorted(street_addrs, key=lambda a: a['houseNumber'])
                }
                for street_name, street_addrs in sorted(streets.items())
            ],
            'totalHouses': len(addresses)
        })
    
    summary = {
        'totalGroups': len(grouped_data),
        'totalCandidates': len(geocoded_addresses),
        'totalHouses': len(existing),
        'notFound': len(geocoded_addresses) - len(existing)
    }
    
    return {
        'groups': grouped_data,
        'summary': summary
    }

def main():
    # Check for API key
    api_key = os.environ.get('GOOGLE_MAPS_API_KEY')
    if not api_key:
        print("ERROR: GOOGLE_MAPS_API_KEY environment variable not set")
        print("Set it with: $env:GOOGLE_MAPS_API_KEY='your-api-key-here'")
        return
    
    # Load candidates
    candidates_file = 'sample_data/generate_candidates.json'
    candidates = load_candidates(candidates_file)
    
    if not candidates:
        print("No candidates found in file")
        return
    
    # Ask user how many to process (for testing)
    print(f"\nTotal candidates: {len(candidates)}")
    user_input = input(f"How many addresses to geocode? (press Enter for all, or enter a number): ").strip()
    
    if user_input:
        try:
            limit = int(user_input)
            candidates = candidates[:limit]
            print(f"Processing first {limit} addresses...")
        except ValueError:
            print("Invalid number, processing all addresses")
    else:
        print("Processing all addresses...")
    
    # Geocode each address
    geocoded = []
    total = len(candidates)
    
    print(f"\nGeocoding {total} addresses...")
    print("=" * 60)
    
    for i, candidate in enumerate(candidates, 1):
        full_address = candidate['fullAddress']
        print(f"[{i}/{total}] {full_address}", end=' ... ')
        
        result = geocode_address(full_address, api_key)
        
        # Combine candidate info with geocode result
        geocoded_address = {
            **candidate,
            'coordinates': result['coordinates'],
            'location_type': result.get('location_type'),
            'geocodeStatus': result['status'],
            'exists': result['exists']
        }
        
        if 'error' in result:
            geocoded_address['error'] = result['error']
        
        geocoded.append(geocoded_address)
        
        # Print status
        if result['exists']:
            print(f"✓ {result['location_type']}")
        else:
            print(f"✗ {result['status']}")
        
        # Rate limiting - Google Maps API has limits
        # Free tier: 50 requests per second, 40,000 per day
        time.sleep(0.05)  # 20 requests per second
    
    print("=" * 60)
    
    # Aggregate results
    aggregated = aggregate_results(geocoded)
    
    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total Groups: {aggregated['summary']['totalGroups']}")
    print(f"Total Candidates Tested: {aggregated['summary']['totalCandidates']}")
    print(f"Actual Houses Found: {aggregated['summary']['totalHouses']}")
    print(f"Not Found: {aggregated['summary']['notFound']}")
    print()
    
    # Print details by group
    for group in aggregated['groups']:
        print(f"Group {group['groupNumber']}: {group['totalHouses']} houses")
        for street in group['streets']:
            house_numbers = [str(addr['houseNumber']) for addr in street['addresses']]
            print(f"  {street['streetName']}: {len(street['addresses'])} houses - {', '.join(house_numbers[:10])}")
            if len(house_numbers) > 10:
                print(f"    ... and {len(house_numbers) - 10} more")
    
    # Save results
    output_file = 'sample_data/geocoded_results.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'groups': aggregated['groups'],
            'summary': aggregated['summary'],
            'all_addresses': geocoded
        }, f, indent=2)
    
    print(f"\n✓ Results saved to {output_file}")
    
    # Save summary HTML
    html_file = 'sample_data/geocoded_results.html'
    generate_html(aggregated, html_file)
    print(f"✓ HTML report saved to {html_file}")

def generate_html(data, filepath):
    """Generate HTML report of geocoded results."""
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Delivery Route - Geocoded</title>
  <style>
    body {{ font-family: Arial; margin: 20px; background: #f5f5f5; }}
    .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }}
    h1 {{ color: #2c3e50; text-align: center; }}
    .summary {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }}
    .summary-item {{ text-align: center; }}
    .summary-number {{ font-size: 32px; font-weight: bold; display: block; }}
    .summary-label {{ font-size: 14px; opacity: 0.9; }}
    .group {{ margin-bottom: 25px; border: 2px solid #3498db; border-radius: 8px; overflow: hidden; }}
    .group-header {{ background: #3498db; color: white; padding: 15px; font-size: 20px; font-weight: bold; }}
    .street-section {{ padding: 15px; border-bottom: 1px solid #eee; }}
    .street-name {{ font-weight: bold; color: #2c3e50; margin-bottom: 10px; }}
    .address-list {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 8px; }}
    .address-item {{ padding: 8px; background: #f8f9fa; border-radius: 5px; font-size: 13px; border-left: 3px solid #27ae60; }}
    .address-number {{ font-weight: bold; }}
    .coordinates {{ color: #666; font-size: 11px; margin-top: 3px; }}
  </style>
</head>
<body>
  <div class="container">
    <h1>📍 Delivery Route with Geocoded Addresses</h1>
    <div class="summary">
      <div class="summary-item"><span class="summary-number">{data['summary']['totalGroups']}</span><span class="summary-label">Groups</span></div>
      <div class="summary-item"><span class="summary-number">{data['summary']['totalHouses']}</span><span class="summary-label">Actual Houses</span></div>
      <div class="summary-item"><span class="summary-number">{data['summary']['totalCandidates']}</span><span class="summary-label">Tested</span></div>
      <div class="summary-item"><span class="summary-number">{data['summary']['notFound']}</span><span class="summary-label">Not Found</span></div>
    </div>
"""
    
    for group in data['groups']:
        html += f'<div class="group"><div class="group-header">Group {group["groupNumber"]} - {group["totalHouses"]} Houses</div>'
        for street in group['streets']:
            html += f'<div class="street-section"><div class="street-name">📍 {street["streetName"]} ({len(street["addresses"])} houses)</div><div class="address-list">'
            for addr in street['addresses']:
                coord_text = f"{addr['coordinates']['lat']:.6f}, {addr['coordinates']['lng']:.6f}" if addr.get('coordinates') else 'No coords'
                html += f'<div class="address-item"><div class="address-number">{addr["houseNumber"]} {addr["streetName"]}</div><div class="coordinates">{coord_text}</div></div>'
            html += '</div></div>'
        html += '</div>'
    
    html += '</div></body></html>'
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == '__main__':
    main()
