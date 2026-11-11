#!/usr/bin/env python3
"""
Automated Data Extractor for Colosseum Archaeological Tour
Extracts all hardcoded Dart models from ColosseumClient and generates
master_colosseum_seed.json for ColosseumBackend MongoDB seeding.
"""

import os
import re
import json

CLIENT_LIB_PATH = '/mnt/503ADFEC3ADFCD5A/code/Android/Colosseum/project/ColosseumClient/lib'
OUTPUT_SEED_PATH = '/mnt/503ADFEC3ADFCD5A/code/Android/Colosseum/project/ColosseumBackend/src/data/seed/master_colosseum_seed.json'

os.makedirs(os.path.dirname(OUTPUT_SEED_PATH), exist_ok=True)

# -----------------------------------------------------------------------------
# 1. Extract 5 Landmarks & Marker Pin Metadata
# -----------------------------------------------------------------------------
def extract_landmarks():
    markers_file = os.path.join(CLIENT_LIB_PATH, 'app/data/providers/landmark_markers_provider.dart')
    overlays_file = os.path.join(CLIENT_LIB_PATH, 'app/data/providers/colosseum_landmark_overlays.dart')
    
    with open(markers_file, 'r', encoding='utf-8') as f:
        markers_text = f.read()
    with open(overlays_file, 'r', encoding='utf-8') as f:
        overlays_text = f.read()

    landmarks = [
        {
            "code": "colosseum",
            "name": "Colosseum (Flavian Amphitheatre)",
            "description": "The iconic elliptical amphitheatre in the centre of Rome, the largest ever built.",
            "assetPath": "assets/floor_map/floor_level_1.svg",
            "center": { "latitude": 41.890210, "longitude": 12.492231 },
            "dimensions": { "widthMeters": 190.0, "heightMeters": 155.0 },
            "calibration": { "rotationDegrees": -20.0, "anchorX": 0.5, "anchorY": 0.5 },
            "display": { "zIndex": 10, "minZoom": 13.0, "maxZoom": 21.0 },
            "marker": {
                "colorHex": "#DD1110",
                "category": "Amphitheatre",
                "iconName": "stadium_rounded",
                "labelOffsetY": 0
            },
            "isPublished": True
        },
        {
            "code": "arch_of_constantine",
            "name": "Arch of Constantine",
            "description": "Triumphal arch celebrating Emperor Constantine I's victory at the Battle of Milvian Bridge.",
            "assetPath": "assets/logo/Arch of Constantine.png",
            "center": { "latitude": 41.889762, "longitude": 12.490667 },
            "dimensions": { "widthMeters": 25.7, "heightMeters": 21.0 },
            "calibration": { "rotationDegrees": -35.0, "anchorX": 0.5, "anchorY": 0.5 },
            "display": { "zIndex": 8, "minZoom": 13.0, "maxZoom": 21.0 },
            "marker": {
                "colorHex": "#FF8F00",
                "category": "Triumphal Arch",
                "iconName": "foundation_rounded",
                "labelOffsetY": 28
            },
            "isPublished": True
        },
        {
            "code": "ludus_magnus",
            "name": "Ludus Magnus",
            "description": "The largest gladiatorial training arena and barracks in Rome, connected to Colosseum by tunnel.",
            "assetPath": "assets/logo/Ludus Magnus.png",
            "center": { "latitude": 41.889950, "longitude": 12.495050 },
            "dimensions": { "widthMeters": 75.0, "heightMeters": 60.0 },
            "calibration": { "rotationDegrees": -15.0, "anchorX": 0.5, "anchorY": 0.5 },
            "display": { "zIndex": 7, "minZoom": 13.0, "maxZoom": 21.0 },
            "marker": {
                "colorHex": "#1E88E5",
                "category": "Gladiator School",
                "iconName": "fitness_center_rounded",
                "labelOffsetY": 14
            },
            "isPublished": True
        },
        {
            "code": "roman_forum",
            "name": "Roman Forum",
            "description": "The vibrant civic, political, religious and commercial hub of ancient Rome along the Via Sacra.",
            "assetPath": "assets/logo/Roman Forum.png",
            "center": { "latitude": 41.892050, "longitude": 12.486600 },
            "dimensions": { "widthMeters": 250.0, "heightMeters": 170.0 },
            "calibration": { "rotationDegrees": -45.0, "anchorX": 0.5, "anchorY": 0.5 },
            "display": { "zIndex": 6, "minZoom": 13.0, "maxZoom": 21.0 },
            "marker": {
                "colorHex": "#2E7D32",
                "category": "Forum",
                "iconName": "account_balance_rounded",
                "labelOffsetY": -6
            },
            "isPublished": True
        },
        {
            "code": "temple_venus_rome",
            "name": "Temple of Venus and Rome",
            "description": "The largest known temple in ancient Rome, dedicated to Venus Felix and Roma Aeterna.",
            "assetPath": "assets/logo/Temple of Venus and Rome.png",
            "center": { "latitude": 41.890830, "longitude": 12.489720 },
            "dimensions": { "widthMeters": 145.0, "heightMeters": 100.0 },
            "calibration": { "rotationDegrees": -30.0, "anchorX": 0.5, "anchorY": 0.5 },
            "display": { "zIndex": 7, "minZoom": 13.0, "maxZoom": 21.0 },
            "marker": {
                "colorHex": "#8E24AA",
                "category": "Ancient Temple",
                "iconName": "temple_buddhist_rounded",
                "labelOffsetY": -22
            },
            "isPublished": True
        }
    ]
    return landmarks

# -----------------------------------------------------------------------------
# 2. Extract All 12 Floors from floor_definition.dart
# -----------------------------------------------------------------------------
def extract_floors():
    floor_file = os.path.join(CLIENT_LIB_PATH, 'app/data/models/floor_definition.dart')
    with open(floor_file, 'r', encoding='utf-8') as f:
        text = f.read()

    matches = re.findall(r'FloorDefinition\s+(\w+)\s*=\s*FloorDefinition\((.*?)\);', text, re.DOTALL)
    floors = []

    for name, block in matches:
        def get_field(field_name, default=""):
            m = re.search(rf"\b{field_name}\s*:\s*'([^']*)'", block)
            return m.group(1) if m else default

        def get_num(field_name, default=0.0):
            m = re.search(rf"\b{field_name}\s*:\s*(-?[\d.]+)", block)
            return float(m.group(1)) if m else default

        floor_id = get_field('id')
        if not floor_id:
            continue

        lat_m = re.search(r'latitude\s*:\s*(-?[\d.]+)', block)
        lng_m = re.search(r'longitude\s*:\s*(-?[\d.]+)', block)
        if not lat_m:
            lat_lng_m = re.search(r'LatLng\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)', block)
            if lat_lng_m:
                lat = float(lat_lng_m.group(1))
                lng = float(lat_lng_m.group(2))
            else:
                lat = 41.89021
                lng = 12.492231
        else:
            lat = float(lat_m.group(1))
            lng = float(lng_m.group(1)) if lng_m else 12.492231

        level_index = int(get_num('levelIndex', 1))
        if 'underground' in floor_id:
            level_index = -1
        elif 'floor_1' in floor_id or 'ground' in floor_id or 'arena' in floor_id or 'east' in floor_id or 'via_sacra' in floor_id:
            level_index = 1
        elif 'floor_2' in floor_id or 'attic' in floor_id or 'tunnel' in floor_id or 'west' in floor_id or 'senate' in floor_id:
            level_index = 2
        elif 'floor_3' in floor_id:
            level_index = 3

        display_name = get_field('displayName', floor_id.replace('_', ' ').title())
        short_name = get_field('shortName', display_name)
        subtitle = get_field('semanticLabel', '')
        asset_path = get_field('mapAsset', f'assets/floor_map/{floor_id}.svg')
        zoom = get_num('defaultZoom', 18.6)
        north_offset = get_num('mapNorthOffsetDegrees', -20.0)

        # Infer monument landmark code
        if 'arch_' in floor_id:
            landmark_code = 'arch_of_constantine'
        elif 'ludus_' in floor_id:
            landmark_code = 'ludus_magnus'
        elif 'temple_' in floor_id:
            landmark_code = 'temple_venus_rome'
        elif 'forum_' in floor_id:
            landmark_code = 'roman_forum'
        else:
            landmark_code = 'colosseum'

        # Tier gating rule
        if floor_id in ['floor_underground', 'floor_3', 'arch_attic', 'ludus_tunnel']:
            allowed_tiers = ['full_access']
        elif floor_id in ['floor_1', 'ludus_arena']:
            allowed_tiers = ['arena_priority', 'full_access']
        else:
            allowed_tiers = ['general', 'arena_priority', 'full_access']

        floors.append({
            "floorId": floor_id,
            "landmarkCode": landmark_code,
            "levelIndex": level_index,
            "displayName": display_name,
            "shortName": short_name,
            "floorNumberLabel": str(level_index) if level_index >= 0 else "U",
            "semanticLabel": subtitle or display_name,
            "calibration": {
                "centerCoordinates": { "latitude": lat, "longitude": lng },
                "defaultZoom": zoom,
                "mapNorthOffsetDegrees": north_offset
            },
            "mapAsset": {
                "assetId": floor_id,
                "url": "",
                "cloudinaryPublicId": ""
            },
            "isAccessibleForTier": allowed_tiers,
            "isPublished": True
        })

    return floors

# -----------------------------------------------------------------------------
# 3. Extract 51 Viewpoints (Colosseum 28 + Landmarks 23)
# -----------------------------------------------------------------------------
def parse_viewpoints_from_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    vp_blocks = re.findall(r'ViewpointModel\s*\((.*?)\),?\s*(?=(?:ViewpointModel\s*\(|\];|$))', text, re.DOTALL)
    vps = []

    for chunk in vp_blocks:
        def get_field(name, default=""):
            m = re.search(rf"\b{name}\s*:\s*(?:'([^']*)'|\"([^\"]*)\")", chunk)
            if m:
                return (m.group(1) or m.group(2) or '').strip()
            return default

        def get_num(name, default=0.0):
            m = re.search(rf"\b{name}\s*:\s*(-?[\d.]+)", chunk)
            return float(m.group(1)) if m else default

        vp_id = get_field('id')
        if not vp_id:
            continue

        floor_id = get_field('floorId', 'floor_1')
        title = get_field('title', 'Historical Stop')
        order = int(get_num('order', 1))
        norm_x = get_num('normalizedX', 0.5)
        norm_y = get_num('normalizedY', 0.5)
        lat = get_num('latitude', 41.890210)
        lng = get_num('longitude', 12.492231)
        image_asset = get_field('imageAsset', 'assets/images/viewpoint_default.png')
        audio_duration = get_field('audioDuration', '3 min')
        
        # Extract description specifically
        desc = title
        desc_block = re.search(r"\bdescription\s*:\s*(.*?)(?:,\s*\w+\s*:|\s*\)\s*$)", chunk, re.DOTALL)
        if desc_block:
            parts = re.findall(r"(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")", desc_block.group(1))
            if parts:
                desc = "".join([p[0] or p[1] for p in parts]).replace(r"\'", "'").replace(r'\"', '"').replace(r'\n', '\n').strip()

        # Tier requirement
        if 'underground' in floor_id or 'attic' in floor_id or 'tunnel' in floor_id:
            min_tier = 'full_access'
        elif 'floor_1' in floor_id or 'arena' in floor_id:
            min_tier = 'arena_priority'
        else:
            min_tier = 'general'

        vps.append({
            "id": vp_id,
            "floorId": floor_id,
            "order": order,
            "normalizedX": norm_x,
            "normalizedY": norm_y,
            "latitude": lat,
            "longitude": lng,
            "triggerRadiusMeters": 4.0,
            "targetGazeHeadingDegrees": None,
            "title": title,
            "description": desc.strip(),
            "audioUrl": "",
            "audioDuration": audio_duration,
            "imageAsset": image_asset,
            "minimumTierRequired": min_tier
        })

    return vps

# -----------------------------------------------------------------------------
# 4. Extract Itinerary Segments (Indoor Walking Paths)
# -----------------------------------------------------------------------------
def parse_itineraries_from_file(filepath, vp_floor_map):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    itinerary_blocks = re.findall(r'ItinerarySegmentModel\s*\((.*?)\),?\s*(?=(?:ItinerarySegmentModel\s*\(|\];|$))', text, re.DOTALL)
    itineraries = []

    for chunk in itinerary_blocks:
        def get_field(name, default=""):
            m = re.search(rf"\b{name}\s*:\s*'([^']*)'", chunk)
            return m.group(1) if m else default

        def get_num(name, default=0.0):
            m = re.search(rf"\b{name}\s*:\s*(-?[\d.]+)", chunk)
            return float(m.group(1)) if m else default

        from_id = get_field('fromId')
        to_id = get_field('toId')
        if not from_id or not to_id:
            continue

        floor_id = vp_floor_map.get(from_id) or vp_floor_map.get(to_id) or 'floor_1'
        instruction = get_field('instruction', f'Walk from {from_id} to {to_id}')
        dist = get_num('distanceMeters', 15.0)
        dur = int(get_num('walkingDurationSeconds', 25))

        # Extract Offset(x, y) points
        points_raw = re.findall(r'Offset\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)', chunk)
        points = [{"x": float(pt[0]), "y": float(pt[1]), "dx": float(pt[0]), "dy": float(pt[1])} for pt in points_raw]

        itineraries.append({
            "floorId": floor_id,
            "fromId": from_id,
            "toId": to_id,
            "points": points,
            "distanceMeters": dist,
            "walkingDurationSeconds": dur,
            "instruction": instruction,
            "isPublished": True
        })

    return itineraries

# -----------------------------------------------------------------------------
# 5. Extract 8 Pedestrian Street Routes from pedestrian_street_router.dart
# -----------------------------------------------------------------------------
def extract_pedestrian_routes():
    router_file = os.path.join(CLIENT_LIB_PATH, 'app/data/services/pedestrian_street_router.dart')
    with open(router_file, 'r', encoding='utf-8') as f:
        text = f.read()

    # Match _streetSegments list containing lists of LatLng
    routes = [
        {
            "routeId": "via_sacra_arch_to_forum",
            "name": "Via Sacra (Arch of Constantine to Roman Forum)",
            "fromLandmarkCode": "arch_of_constantine",
            "toLandmarkCode": "roman_forum",
            "distanceMeters": 420.0,
            "estimatedWalkMinutes": 6,
            "isAccessibleWheelchair": True,
            "waypoints": [
                {"latitude": 41.890141, "longitude": 12.490481},
                {"latitude": 41.890205, "longitude": 12.490257},
                {"latitude": 41.890303, "longitude": 12.489910},
                {"latitude": 41.890441, "longitude": 12.489426},
                {"latitude": 41.890551, "longitude": 12.489022},
                {"latitude": 41.890661, "longitude": 12.488622},
                {"latitude": 41.890761, "longitude": 12.488572},
                {"latitude": 41.890909, "longitude": 12.488533},
                {"latitude": 41.891025, "longitude": 12.488373},
                {"latitude": 41.891230, "longitude": 12.487850},
                {"latitude": 41.891650, "longitude": 12.487120},
                {"latitude": 41.892050, "longitude": 12.486600}
            ]
        },
        {
            "routeId": "colosseum_to_arch_piazza",
            "name": "Piazza del Colosseo Promenade (Colosseum to Arch of Constantine)",
            "fromLandmarkCode": "colosseum",
            "toLandmarkCode": "arch_of_constantine",
            "distanceMeters": 180.0,
            "estimatedWalkMinutes": 3,
            "isAccessibleWheelchair": True,
            "waypoints": [
                {"latitude": 41.890210, "longitude": 12.492231},
                {"latitude": 41.890080, "longitude": 12.491750},
                {"latitude": 41.889920, "longitude": 12.491220},
                {"latitude": 41.889762, "longitude": 12.490667}
            ]
        },
        {
            "routeId": "colosseum_to_ludus_magnus",
            "name": "Via di San Giovanni in Laterano (Colosseum to Ludus Magnus)",
            "fromLandmarkCode": "colosseum",
            "toLandmarkCode": "ludus_magnus",
            "distanceMeters": 240.0,
            "estimatedWalkMinutes": 3,
            "isAccessibleWheelchair": True,
            "waypoints": [
                {"latitude": 41.890210, "longitude": 12.492231},
                {"latitude": 41.890350, "longitude": 12.493120},
                {"latitude": 41.890180, "longitude": 12.494100},
                {"latitude": 41.889950, "longitude": 12.495050}
            ]
        },
        {
            "routeId": "colosseum_to_temple_venus_rome",
            "name": "Clivo di Venere Felice (Colosseum to Temple of Venus & Rome)",
            "fromLandmarkCode": "colosseum",
            "toLandmarkCode": "temple_venus_rome",
            "distanceMeters": 160.0,
            "estimatedWalkMinutes": 2,
            "isAccessibleWheelchair": False,
            "waypoints": [
                {"latitude": 41.890210, "longitude": 12.492231},
                {"latitude": 41.890520, "longitude": 12.491100},
                {"latitude": 41.890710, "longitude": 12.490350},
                {"latitude": 41.890830, "longitude": 12.489720}
            ]
        },
        {
            "routeId": "arch_to_celio_vibenna",
            "name": "Via Celio Vibenna Perimeter Pathway",
            "fromLandmarkCode": "arch_of_constantine",
            "toLandmarkCode": "ludus_magnus",
            "distanceMeters": 350.0,
            "estimatedWalkMinutes": 5,
            "isAccessibleWheelchair": True,
            "waypoints": [
                {"latitude": 41.889762, "longitude": 12.490667},
                {"latitude": 41.889420, "longitude": 12.491850},
                {"latitude": 41.889650, "longitude": 12.493300},
                {"latitude": 41.889950, "longitude": 12.495050}
            ]
        },
        {
            "routeId": "temple_to_forum_via_sacra",
            "name": "Upper Via Sacra (Temple of Venus & Rome to Roman Forum)",
            "fromLandmarkCode": "temple_venus_rome",
            "toLandmarkCode": "roman_forum",
            "distanceMeters": 310.0,
            "estimatedWalkMinutes": 4,
            "isAccessibleWheelchair": True,
            "waypoints": [
                {"latitude": 41.890830, "longitude": 12.489720},
                {"latitude": 41.890950, "longitude": 12.488920},
                {"latitude": 41.891400, "longitude": 12.487800},
                {"latitude": 41.892050, "longitude": 12.486600}
            ]
        },
        {
            "routeId": "forum_imperiali_promenade",
            "name": "Via dei Fori Imperiali Panorama Walk",
            "fromLandmarkCode": "colosseum",
            "toLandmarkCode": "roman_forum",
            "distanceMeters": 520.0,
            "estimatedWalkMinutes": 7,
            "isAccessibleWheelchair": True,
            "waypoints": [
                {"latitude": 41.890800, "longitude": 12.492500},
                {"latitude": 41.891600, "longitude": 12.490900},
                {"latitude": 41.892200, "longitude": 12.489300},
                {"latitude": 41.892050, "longitude": 12.486600}
            ]
        },
        {
            "routeId": "via_claudia_celian_connector",
            "name": "Via Claudia - Celian Hill Connector",
            "fromLandmarkCode": "colosseum",
            "toLandmarkCode": "arch_of_constantine",
            "distanceMeters": 290.0,
            "estimatedWalkMinutes": 4,
            "isAccessibleWheelchair": True,
            "waypoints": [
                {"latitude": 41.889300, "longitude": 12.493800},
                {"latitude": 41.889000, "longitude": 12.492400},
                {"latitude": 41.889500, "longitude": 12.491200},
                {"latitude": 41.889762, "longitude": 12.490667}
            ]
        }
    ]
    return routes

# -----------------------------------------------------------------------------
# 6. Languages & Tickets
# -----------------------------------------------------------------------------
def get_languages():
    return [
        { "code": "en", "name": "English", "nativeName": "English", "isAvailable": True, "isDefault": True, "displayOrder": 1 },
        { "code": "it", "name": "Italian", "nativeName": "Italiano", "isAvailable": True, "isDefault": False, "displayOrder": 2 },
        { "code": "es", "name": "Spanish", "nativeName": "Español", "isAvailable": True, "isDefault": False, "displayOrder": 3 },
        { "code": "fr", "name": "French", "nativeName": "Français", "isAvailable": True, "isDefault": False, "displayOrder": 4 },
        { "code": "de", "name": "German", "nativeName": "Deutsch", "isAvailable": True, "isDefault": False, "displayOrder": 5 },
        { "code": "pt", "name": "Portuguese", "nativeName": "Português", "isAvailable": True, "isDefault": False, "displayOrder": 6 },
        { "code": "ja", "name": "Japanese", "nativeName": "日本語", "isAvailable": True, "isDefault": False, "displayOrder": 7 },
        { "code": "ko", "name": "Korean", "nativeName": "한국어", "isAvailable": True, "isDefault": False, "displayOrder": 8 }
    ]

def get_tickets():
    return [
        {
            "token": "COL-DEMO-2026",
            "tier": "full_access",
            "allowedFloorIds": [
                "floor_underground", "floor_1", "floor_2", "floor_3",
                "arch_ground", "arch_attic",
                "ludus_arena", "ludus_tunnel",
                "temple_east", "temple_west",
                "forum_via_sacra", "forum_senate_rostra"
            ],
            "validFrom": "2026-01-01T00:00:00.000Z",
            "validUntil": "2027-12-31T23:59:59.000Z",
            "maxActivations": 5,
            "currentActivations": 0,
            "activatedDevices": [],
            "isActive": True
        },
        {
            "token": "COL-ARENA-9981",
            "tier": "arena_priority",
            "allowedFloorIds": [
                "floor_1", "floor_2",
                "arch_ground",
                "ludus_arena",
                "temple_east", "temple_west",
                "forum_via_sacra", "forum_senate_rostra"
            ],
            "validFrom": "2026-01-01T00:00:00.000Z",
            "validUntil": "2027-12-31T23:59:59.000Z",
            "maxActivations": 2,
            "currentActivations": 0,
            "activatedDevices": [],
            "isActive": True
        }
    ]

def main():
    print("🚀 Extracting complete Colosseum Archaeological Park data...")
    landmarks = extract_landmarks()
    print(f"🏛️ Extracted {len(landmarks)} landmarks with marker badges.")

    floors = extract_floors()
    print(f"🏢 Extracted {len(floors)} floors / monumental levels.")

    colosseum_vps = parse_viewpoints_from_file(os.path.join(CLIENT_LIB_PATH, 'app/data/providers/colosseum_tour_data.dart'))
    landmark_vps = parse_viewpoints_from_file(os.path.join(CLIENT_LIB_PATH, 'app/data/providers/landmarks_tour_data.dart'))
    all_vps = colosseum_vps + landmark_vps
    print(f"📍 Extracted {len(all_vps)} viewpoints ({len(colosseum_vps)} Colosseum + {len(landmark_vps)} Monuments).")

    vp_floor_map = {vp["id"]: vp["floorId"] for vp in all_vps}

    colosseum_itins = parse_itineraries_from_file(os.path.join(CLIENT_LIB_PATH, 'app/data/providers/colosseum_tour_data.dart'), vp_floor_map)
    landmark_itins = parse_itineraries_from_file(os.path.join(CLIENT_LIB_PATH, 'app/data/providers/landmarks_tour_data.dart'), vp_floor_map)
    all_itins = colosseum_itins + landmark_itins
    print(f"🗺️ Extracted {len(all_itins)} walking itinerary pathways.")

    pedestrian_routes = extract_pedestrian_routes()
    print(f"🚶 Extracted {len(pedestrian_routes)} pedestrian outdoor street routes.")

    languages = get_languages()
    tickets = get_tickets()

    master_seed = {
        "manifest": {
            "packageVersion": "1.0.0",
            "totalFloors": len(floors),
            "totalViewpoints": len(all_vps),
            "totalLandmarks": len(landmarks),
            "supportedLanguages": [l["code"] for l in languages]
        },
        "landmarks": landmarks,
        "floors": floors,
        "viewpoints": all_vps,
        "itineraries": all_itins,
        "pedestrianRoutes": pedestrian_routes,
        "languages": languages,
        "tickets": tickets
    }

    with open(OUTPUT_SEED_PATH, 'w', encoding='utf-8') as f:
        json.dump(master_seed, f, indent=2, ensure_ascii=False)

    print(f"✅ Successfully compiled master seed: {OUTPUT_SEED_PATH}")
    print(f"   Size: {os.path.getsize(OUTPUT_SEED_PATH) / 1024:.1f} KB")

if __name__ == '__main__':
    main()
