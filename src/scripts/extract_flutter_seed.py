#!/usr/bin/env python3
import re
import json
import os
import math

TOUR_DATA_PATH = '../ColosseumClient/lib/app/data/providers/colosseum_tour_data.dart'
OVERLAYS_PATH = '../ColosseumClient/lib/app/data/providers/colosseum_landmark_overlays.dart'
OUTPUT_PATH = 'src/data/seed/colosseum_mvp_seed.json'

os.makedirs('src/data/seed', exist_ok=True)

with open(TOUR_DATA_PATH, 'r', encoding='utf-8') as f:
    tour_content = f.read()

def canvas_to_lat_lng(norm_x, norm_y):
    center_lat = 41.890210
    center_lng = 12.492231
    arena_w = 86.0
    arena_h = 54.0
    theta = 20.0 * (math.pi / 180.0)
    meters_per_deg_lat = 111139.0
    meters_per_deg_lng = 111139.0 * math.cos(center_lat * math.pi / 180.0)

    x_rot = (norm_x - 0.50) / 0.82 * arena_w
    y_rot = -(norm_y - 0.50) / 0.60 * arena_h

    d_east = x_rot * math.cos(theta) + y_rot * math.sin(theta)
    d_north = -x_rot * math.sin(theta) + y_rot * math.cos(theta)

    lat = center_lat + (d_north / meters_per_deg_lat)
    lng = center_lng + (d_east / meters_per_deg_lng)
    return round(lat, 6), round(lng, 6)

def extract_field_string(chunk, field_name):
    pattern = rf'\b{field_name}\s*:\s*'
    m = re.search(pattern, chunk)
    if not m:
        return ''
    start = m.end()
    i = start
    result = []
    while i < len(chunk):
        while i < len(chunk) and chunk[i] in ' \t\r\n':
            i += 1
        if i >= len(chunk) or chunk[i] not in ("'", '"'):
            break
        quote = chunk[i]
        i += 1
        str_part = []
        while i < len(chunk):
            if chunk[i] == '\\' and i + 1 < len(chunk):
                nxt = chunk[i + 1]
                if nxt == 'n':
                    str_part.append('\n')
                elif nxt == 't':
                    str_part.append('\t')
                else:
                    str_part.append(nxt)
                i += 2
                continue
            if chunk[i] == quote:
                i += 1
                break
            str_part.append(chunk[i])
            i += 1
        result.append("".join(str_part))
    return "".join(result).strip()

vp_chunks = re.findall(r'ViewpointModel\s*\((.*?)\s*\),', tour_content, re.DOTALL)
viewpoints = []

for chunk in vp_chunks:
    def get_num(name):
        m = re.search(r'\b' + name + r':\s*([\d\.\-]+)', chunk)
        return float(m.group(1)) if m else None

    def get_int(name):
        m = re.search(r'\b' + name + r':\s*(\d+)', chunk)
        return int(m.group(1)) if m else None

    vp_id = extract_field_string(chunk, 'id')
    floor_id = extract_field_string(chunk, 'floorId')
    title = extract_field_string(chunk, 'title')
    order = get_int('order')
    norm_x = get_num('normalizedX')
    norm_y = get_num('normalizedY')
    lat = get_num('latitude')
    lng = get_num('longitude')
    img_asset = extract_field_string(chunk, 'imageAsset')
    audio_dur = extract_field_string(chunk, 'audioDuration')
    desc = extract_field_string(chunk, 'description')

    if not lat or not lng:
        lat, lng = canvas_to_lat_lng(norm_x or 0.5, norm_y or 0.5)

    if vp_id and floor_id and title:
        viewpoints.append({
            'id': vp_id,
            'floorId': floor_id,
            'order': order,
            'title': title,
            'description': desc,
            'normalizedX': norm_x,
            'normalizedY': norm_y,
            'latitude': lat,
            'longitude': lng,
            'imageAsset': img_asset or f'assets/images/{vp_id}.jpg',
            'audioDuration': audio_dur or '3 min',
            'triggerRadiusMeters': 4.0
        })

print(f"Extracted {len(viewpoints)} viewpoints.")

# Parse Itineraries
itineraries = []
offset_pattern = re.compile(r"Offset\s*\(\s*([\d\.\-]+)\s*,\s*([\d\.\-]+)\s*\)")

floor_sections = {
    'floor_underground': re.search(r'undergroundItinerary\s*=\s*\[(.*?)\];', tour_content, re.DOTALL),
    'floor_1': re.search(r'level1Itinerary\s*=\s*\[(.*?)\];', tour_content, re.DOTALL),
    'floor_2': re.search(r'level2Itinerary\s*=\s*\[(.*?)\];', tour_content, re.DOTALL),
    'floor_3': re.search(r'level3Itinerary\s*=\s*\[(.*?)\];', tour_content, re.DOTALL),
}

for floor_id, sec in floor_sections.items():
    if not sec:
        continue
    sec_text = sec.group(1)
    seg_matches = re.finditer(r'ItinerarySegmentModel\s*\(\s*fromId:\s*[\'"]([^\'"]+)[\'"],\s*toId:\s*[\'"]([^\'"]+)[\'"],\s*points:\s*\[(.*?)\]\s*,?\s*\)', sec_text, re.DOTALL)
    for sm in seg_matches:
        f_id = sm.group(1)
        t_id = sm.group(2)
        pts_text = sm.group(3)
        pts = [{'x': float(o.group(1)), 'y': float(o.group(2))} for o in offset_pattern.finditer(pts_text)]
        itineraries.append({
            'floorId': floor_id,
            'fromId': f_id,
            'toId': t_id,
            'points': pts
        })

print(f"Extracted {len(itineraries)} itinerary segments.")

# Parse Landmarks
with open(OVERLAYS_PATH, 'r', encoding='utf-8') as f:
    overlays_content = f.read()

landmark_matches = re.finditer(
    r"MapLandmarkOverlay\s*\(\s*id:\s*['\"]([^'\"]+)['\"],\s*name:\s*['\"]([^'\"]+)['\"],\s*assetPath:\s*['\"]?([^'\",\)]+)['\"]?,\s*center:\s*const\s*LatLng\(\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\),\s*widthMeters:\s*([\d\.]+),\s*heightMeters:\s*([\d\.]+),\s*rotationDegrees:\s*([\d\.\-]+),\s*anchorX:\s*([\d\.]+),\s*anchorY:\s*([\d\.]+),\s*zIndex:\s*(\d+),\s*minZoom:\s*([\d\.]+),\s*maxZoom:\s*([\d\.]+)",
    overlays_content,
    re.DOTALL
)

landmarks = []
for m in landmark_matches:
    code = m.group(1)
    name = m.group(2)
    raw_asset = m.group(3).replace('$assetFolder/', 'assets/logo/').replace("'", "")
    lat = float(m.group(4))
    lng = float(m.group(5))
    w = float(m.group(6))
    h = float(m.group(7))
    rot = float(m.group(8))
    ax = float(m.group(9))
    ay = float(m.group(10))
    zi = int(m.group(11))
    min_z = float(m.group(12))
    max_z = float(m.group(13))

    landmarks.append({
        'code': code,
        'name': name,
        'assetPath': raw_asset,
        'center': {'latitude': lat, 'longitude': lng},
        'dimensions': {'widthMeters': w, 'heightMeters': h},
        'calibration': {'rotationDegrees': rot, 'anchorX': ax, 'anchorY': ay},
        'display': {'zIndex': zi, 'minZoom': min_z, 'maxZoom': max_z}
    })

print(f"Extracted {len(landmarks)} landmarks.")

floors = [
    {
        'floorId': 'floor_underground',
        'landmarkCode': 'colosseum',
        'levelIndex': -1,
        'displayName': 'Underground (Hypogeum)',
        'shortName': 'Underground',
        'floorNumberLabel': 'Underground',
        'semanticLabel': 'Underground Hypogeum, current floor',
        'calibration': {
            'centerCoordinates': {'latitude': 41.890210, 'longitude': 12.492231},
            'defaultZoom': 18.6,
            'mapNorthOffsetDegrees': -20.0
        },
        'mapAsset': {'assetId': 'underground_map', 'url': 'assets/maps/underground_map.png'}
    },
    {
        'floorId': 'floor_1',
        'landmarkCode': 'colosseum',
        'levelIndex': 1,
        'displayName': 'Level 1',
        'shortName': 'Level 1',
        'floorNumberLabel': 'Floor 1',
        'semanticLabel': 'Level 1, current floor',
        'calibration': {
            'centerCoordinates': {'latitude': 41.890210, 'longitude': 12.492231},
            'defaultZoom': 18.6,
            'mapNorthOffsetDegrees': -20.0
        },
        'mapAsset': {'assetId': 'level_1_map', 'url': 'assets/maps/level_1_map.png'}
    },
    {
        'floorId': 'floor_2',
        'landmarkCode': 'colosseum',
        'levelIndex': 2,
        'displayName': 'Level 2',
        'shortName': 'Level 2',
        'floorNumberLabel': 'Floor 2',
        'semanticLabel': 'Level 2, current floor',
        'calibration': {
            'centerCoordinates': {'latitude': 41.890210, 'longitude': 12.492231},
            'defaultZoom': 18.6,
            'mapNorthOffsetDegrees': -20.0
        },
        'mapAsset': {'assetId': 'level_2_map', 'url': 'assets/maps/level_2_map.png'}
    },
    {
        'floorId': 'floor_3',
        'landmarkCode': 'colosseum',
        'levelIndex': 3,
        'displayName': 'Level 3',
        'shortName': 'Level 3',
        'floorNumberLabel': 'Floor 3',
        'semanticLabel': 'Level 3, current floor',
        'calibration': {
            'centerCoordinates': {'latitude': 41.890210, 'longitude': 12.492231},
            'defaultZoom': 18.6,
            'mapNorthOffsetDegrees': -20.0
        },
        'mapAsset': {'assetId': 'level_3_map', 'url': 'assets/maps/level_3_map.png'}
    }
]

languages = [
    {'code': 'en', 'name': 'English', 'nativeName': 'English', 'isAvailable': True, 'isDefault': True, 'displayOrder': 1},
    {'code': 'it', 'name': 'Italian', 'nativeName': 'Italiano', 'isAvailable': True, 'isDefault': False, 'displayOrder': 2},
    {'code': 'fr', 'name': 'French', 'nativeName': 'Français', 'isAvailable': True, 'isDefault': False, 'displayOrder': 3},
    {'code': 'de', 'name': 'German', 'nativeName': 'Deutsch', 'isAvailable': True, 'isDefault': False, 'displayOrder': 4},
    {'code': 'es', 'name': 'Spanish', 'nativeName': 'Español', 'isAvailable': True, 'isDefault': False, 'displayOrder': 5},
    {'code': 'pt', 'name': 'Portuguese', 'nativeName': 'Português', 'isAvailable': True, 'isDefault': False, 'displayOrder': 6},
    {'code': 'ja', 'name': 'Japanese', 'nativeName': '日本語', 'isAvailable': True, 'isDefault': False, 'displayOrder': 7},
    {'code': 'ko', 'name': 'Korean', 'nativeName': '한국어', 'isAvailable': True, 'isDefault': False, 'displayOrder': 8},
]

tickets = [
    {
        'token': 'COL-DEMO-2026',
        'tier': 'full_access',
        'allowedFloorIds': ['floor_underground', 'floor_1', 'floor_2', 'floor_3'],
        'validUntil': '2027-12-31T23:59:59.000Z',
        'maxActivations': 100,
        'isActive': True
    },
    {
        'token': 'COL-VIP-FULL',
        'tier': 'full_access',
        'allowedFloorIds': ['floor_underground', 'floor_1', 'floor_2', 'floor_3'],
        'validUntil': '2027-12-31T23:59:59.000Z',
        'maxActivations': 50,
        'isActive': True
    }
]

seed_data = {
    'floors': floors,
    'viewpoints': viewpoints,
    'itineraries': itineraries,
    'landmarks': landmarks,
    'languages': languages,
    'tickets': tickets
}

with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(seed_data, f, indent=2, ensure_ascii=False)

print(f"✅ Successfully wrote seed data to {OUTPUT_PATH}")
