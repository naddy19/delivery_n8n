#!/usr/bin/env python3
"""
Analyze the address ranges to identify potential OCR errors.
Large ranges (>100 houses) are likely misreads.
"""

import json

def analyze_ranges(filepath):
    """Analyze address ranges from generate_candidates.json"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Get the route data from first item
    if not data or 'routeData' not in data[0]:
        print("No route data found")
        return
    
    route_data = data[0]['routeData']
    
    print("=" * 80)
    print("ADDRESS RANGE ANALYSIS")
    print("=" * 80)
    print()
    
    total_candidates = 0
    suspicious_ranges = []
    
    for group in route_data['groups']:
        print(f"Group {group['groupNumber']}:")
        print("-" * 80)
        
        for street in group['streets']:
            from_house = street['fromHouse']
            to_house = street['toHouse']
            street_name = street['streetName']
            
            # Parse house numbers
            from_num = int(''.join(filter(str.isdigit, from_house))) if from_house else 0
            to_num = int(''.join(filter(str.isdigit, to_house))) if to_house else 0
            
            # Calculate range
            range_size = abs(to_num - from_num)
            num_houses = (range_size // 2) + 1  # Approximate (assuming all odd or all even)
            total_candidates += num_houses
            
            # Flag suspicious ranges
            is_suspicious = range_size > 100
            flag = " ⚠️  SUSPICIOUS - Likely OCR error!" if is_suspicious else ""
            
            print(f"  {street_name}")
            print(f"    Range: {from_house} to {to_house}")
            print(f"    Span: {range_size} numbers (~{num_houses} houses){flag}")
            
            if is_suspicious:
                suspicious_ranges.append({
                    'group': group['groupNumber'],
                    'street': street_name,
                    'from': from_house,
                    'to': to_house,
                    'span': range_size,
                    'houses': num_houses
                })
            
            print()
        
        print()
    
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total candidate addresses: {total_candidates}")
    print(f"Suspicious ranges found: {len(suspicious_ranges)}")
    print()
    
    if suspicious_ranges:
        print("SUSPICIOUS RANGES (span > 100):")
        print("-" * 80)
        for item in suspicious_ranges:
            print(f"Group {item['group']}: {item['street']}")
            print(f"  {item['from']} to {item['to']} = {item['span']} span (~{item['houses']} houses)")
            print()
        
        print("\nRECOMMENDATION:")
        print("These ranges are likely OCR errors. Please:")
        print("1. Check the original delivery route image")
        print("2. Verify the correct house number ranges")
        print("3. Re-run OCR or manually correct the data")

if __name__ == '__main__':
    analyze_ranges('sample_data/generate_candidates.json')
