#!/usr/bin/env python3
"""Extract GPS metadata from street_images/ (source MOV/mov files) and write
data/street_videos.geojson.  The converted MP4s live in street_videos/ but GPS
metadata is read from the original MOV files in street_images/ because ffmpeg
does not copy proprietary Apple GPS atoms into H.264 MP4 containers.

Requires exiftool to be installed (https://exiftool.org/).
"""

import json
import subprocess
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / 'data'
# Source MOV files (GPS metadata lives here)
VIDEO_DIR = DATA_DIR / 'street_images'
OUT_FILE = DATA_DIR / 'street_videos.geojson'

# Only scan for original MOV source files; MP4 outputs in street_videos/ lack GPS
VIDEO_EXTENSIONS = {'.mov', '.MOV'}


def get_gps_exiftool(path):
    """Return (lat, lng) from video file using exiftool, or None if unavailable."""
    try:
        result = subprocess.run(
            ['exiftool', '-json', '-GPSLatitude', '-GPSLongitude',
             '-GPSLatitudeRef', '-GPSLongitudeRef', str(path)],
            capture_output=True, text=True, timeout=30,
        )
    except FileNotFoundError:
        print('ERROR: exiftool not found. Install it from https://exiftool.org/')
        sys.exit(1)

    if result.returncode != 0:
        return None

    try:
        data = json.loads(result.stdout)
        if not data:
            return None
        meta = data[0]

        lat_raw = meta.get('GPSLatitude')
        lng_raw = meta.get('GPSLongitude')
        if lat_raw is None or lng_raw is None:
            return None

        # exiftool returns values like "43 deg 39' 10.00\" N" or plain floats
        lat = _parse_exiftool_coord(lat_raw, meta.get('GPSLatitudeRef', 'N'))
        lng = _parse_exiftool_coord(lng_raw, meta.get('GPSLongitudeRef', 'E'))
        return lat, lng
    except (json.JSONDecodeError, KeyError, ValueError):
        return None


def _parse_exiftool_coord(value, ref):
    """Parse exiftool GPS coordinate — accepts float string or DMS string."""
    if isinstance(value, (int, float)):
        coord = float(value)
    else:
        # Format: "43 deg 39' 10.00\" N"  or  "43.6527778"
        value = str(value).strip()
        if 'deg' in value:
            parts = value.replace("deg", "").replace("'", "").replace('"', "").split()
            # last token may be the ref letter embedded in the string
            nums = [p for p in parts if p.replace('.', '', 1).lstrip('-').isdigit()]
            d, m, s = float(nums[0]), float(nums[1]), float(nums[2])
            coord = d + m / 60 + s / 3600
        else:
            coord = float(value)

    if str(ref).upper() in ('S', 'W'):
        coord = -coord
    return coord


def main():
    if not VIDEO_DIR.exists():
        print(f'Source video directory not found: {VIDEO_DIR}')
        print('Create it with: mkdir -p data/street_images')
        sys.exit(1)

    video_files = [
        p for p in sorted(VIDEO_DIR.iterdir())
        if p.suffix in VIDEO_EXTENSIONS
    ]

    if not video_files:
        print(f'No MOV source files found in {VIDEO_DIR}')

    features = []
    skipped = []

    for vid_path in video_files:
        # The published filename is the converted MP4 in street_videos/
        mp4_name = vid_path.stem + '.mp4'
        try:
            coords = get_gps_exiftool(vid_path)
            if coords is None:
                print(f'  WARN: {vid_path.name}: no GPS data — skipping')
                skipped.append(vid_path.name)
                continue
            lat, lng = coords
            features.append({
                'type': 'Feature',
                'geometry': {'type': 'Point', 'coordinates': [lng, lat]},
                'properties': {'filename': mp4_name},
            })
            print(f'  OK:   {vid_path.name} -> {mp4_name}  ({lat:.6f}, {lng:.6f})')
        except Exception as e:
            print(f'  WARN: {vid_path.name}: {e}')
            skipped.append(vid_path.name)

    geojson = {'type': 'FeatureCollection', 'features': features}
    OUT_FILE.write_text(json.dumps(geojson, indent=2))

    print(f'\nWrote {len(features)} features to {OUT_FILE}')
    if skipped:
        print(f'Skipped (no GPS): {", ".join(skipped)}')


if __name__ == '__main__':
    main()
