#!/usr/bin/env python3
"""Extract GPS EXIF from street_images/ and write data/street_images.geojson."""

import json
import os
import struct
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / 'data'
IMG_DIR = DATA_DIR / 'street_images'
OUT_FILE = DATA_DIR / 'street_images.geojson'


def dms_to_decimal(dms, ref):
    d, m, s = [float(x) for x in dms]
    dec = d + m / 60 + s / 3600
    if ref in ('S', 'W'):
        dec = -dec
    return dec


def get_gps(path):
    from PIL import Image
    from PIL.ExifTags import TAGS, GPSTAGS

    img = Image.open(path)
    exif = img._getexif()
    if not exif:
        return None

    gps_tag = next((k for k, v in TAGS.items() if v == 'GPSInfo'), None)
    if gps_tag not in exif:
        return None

    gps_raw = exif[gps_tag]
    gps = {GPSTAGS.get(k, k): v for k, v in gps_raw.items()}

    lat = dms_to_decimal(gps['GPSLatitude'], gps.get('GPSLatitudeRef', 'N'))
    lng = dms_to_decimal(gps['GPSLongitude'], gps.get('GPSLongitudeRef', 'E'))
    return lat, lng


def main():
    features = []
    skipped = []

    for img_path in sorted(IMG_DIR.glob('*.JPG')) + sorted(IMG_DIR.glob('*.jpg')):
        try:
            coords = get_gps(img_path)
            if coords is None:
                skipped.append(img_path.name)
                continue
            lat, lng = coords
            features.append({
                'type': 'Feature',
                'geometry': {'type': 'Point', 'coordinates': [lng, lat]},
                'properties': {'filename': img_path.name},
            })
        except Exception as e:
            print(f'  WARN: {img_path.name}: {e}')
            skipped.append(img_path.name)

    geojson = {'type': 'FeatureCollection', 'features': features}
    OUT_FILE.write_text(json.dumps(geojson, indent=2))

    print(f'Wrote {len(features)} features to {OUT_FILE}')
    if skipped:
        print(f'Skipped (no GPS): {", ".join(skipped)}')


if __name__ == '__main__':
    main()
