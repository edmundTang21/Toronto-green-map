#!/usr/bin/env python3
"""Convert JPG street images to WebP format at quality 85."""

import sys
from pathlib import Path

DEFAULT_SRC = Path(__file__).parent.parent / 'data' / 'street_images'
QUALITY = 85


def convert_directory(src_dir: Path) -> None:
    from PIL import Image

    jpg_files = sorted(src_dir.glob('*.JPG')) + sorted(src_dir.glob('*.jpg'))

    if not jpg_files:
        print(f'No JPG files found in {src_dir}')
        return

    print(f'Found {len(jpg_files)} JPG file(s) in {src_dir}')
    converted = 0
    skipped = 0

    for jpg_path in jpg_files:
        webp_path = jpg_path.with_suffix('.webp')
        if webp_path.exists():
            print(f'  SKIP (already exists): {webp_path.name}')
            skipped += 1
            continue
        try:
            with Image.open(jpg_path) as img:
                img.save(webp_path, 'WEBP', quality=QUALITY)
            orig_kb = jpg_path.stat().st_size / 1024
            new_kb = webp_path.stat().st_size / 1024
            pct = 100 * (1 - new_kb / orig_kb) if orig_kb else 0
            print(f'  OK: {jpg_path.name} -> {webp_path.name}  '
                  f'({orig_kb:.0f} KB -> {new_kb:.0f} KB, -{pct:.0f}%)')
            converted += 1
        except Exception as e:
            print(f'  ERROR: {jpg_path.name}: {e}')

    print(f'\nDone. Converted: {converted}, Skipped: {skipped}')


def main():
    src_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src_dir.is_dir():
        print(f'ERROR: Directory not found: {src_dir}')
        sys.exit(1)
    convert_directory(src_dir)


if __name__ == '__main__':
    main()
