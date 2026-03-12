#!/usr/bin/env python3
"""
Add ground truth region color bar to depth profile images.
The color bar shows the true region for each channel.
"""

import csv
import numpy as np
from PIL import Image
from pathlib import Path

# Region to color mapping (from the depth profile legend)
REGION_COLORS = {
    # Main regions in the data
    "VISam": (0, 204, 255),      # Cyan (VISam/VISam6a)
    "CA1": (153, 255, 153),      # Light green (SUB/CA1)
    "APN": (255, 0, 255),        # Magenta (APN)
    "DG": (204, 255, 0),         # Green-yellow (DG/DG-mo)
    "NOT": (255, 153, 204),      # Light pink
    "MB": (255, 153, 153),       # Light salmon (MB/MGv)
    "UNK": (200, 200, 200),      # Gray (unknown regions)
}

PROBES = ["773549842", "773549846", "773549848", "773549850", "773549852", "773549856"]
SESSION = "768515987"
CSV_PATH = Path("data/allen/allen_probe_labels.csv")
DEPTH_PROFILE_DIR = Path("public/predictions")

def load_channel_regions(probe_id, session_id):
    """Load channel-to-region mapping from CSV, sorted by depth (z-coordinate)."""
    channels = []

    with open(CSV_PATH, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['pid'] == probe_id and row['eid'] == session_id:
                channels.append({
                    'z': float(row['z']),
                    'acronym': row['acronym'],
                    'raw_ind': int(row['rawInd'])
                })

    # Sort by z coordinate (depth) - same ordering as depth profile image
    channels.sort(key=lambda c: c['z'])

    # Return as index -> region mapping
    channel_regions = {i: ch['acronym'] for i, ch in enumerate(channels)}
    return channel_regions

def get_region_color(acronym):
    """Get RGB color for a region."""
    if acronym in REGION_COLORS:
        return REGION_COLORS[acronym]
    # Default to gray for unknown regions
    return (200, 200, 200)

def add_colorbar_to_image(image_path, channel_regions, output_path):
    """Add ground truth color bar to the right side of depth profile image."""

    # Load image
    img = Image.open(image_path)
    img_array = np.array(img)

    height, width = img_array.shape[:2]

    # Create color bar (vertical strip showing ground truth region per channel)
    # Width: 30 pixels, Height: match image height
    colorbar_width = 30
    colorbar_height = height

    # Calculate pixels per channel
    pixels_per_channel = colorbar_height / max(channel_regions.keys()) if channel_regions else 1

    # Create colorbar array (RGB or RGBA)
    if len(img_array.shape) == 3 and img_array.shape[2] == 4:
        colorbar_array = np.ones((colorbar_height, colorbar_width, 4), dtype=np.uint8) * 255
    else:
        colorbar_array = np.ones((colorbar_height, colorbar_width, 3), dtype=np.uint8) * 255

    # Fill colorbar with region colors
    for channel_idx, acronym in sorted(channel_regions.items()):
        color = get_region_color(acronym)

        # Calculate pixel positions for this channel
        y_start = int(channel_idx * pixels_per_channel)
        y_end = int((channel_idx + 1) * pixels_per_channel)

        if y_end > colorbar_height:
            y_end = colorbar_height

        if y_start < colorbar_height:
            colorbar_array[y_start:y_end, :, 0] = color[0]
            colorbar_array[y_start:y_end, :, 1] = color[1]
            colorbar_array[y_start:y_end, :, 2] = color[2]

    # Combine image and colorbar
    if len(img_array.shape) == 3 and img_array.shape[2] == 4:
        combined = np.hstack([img_array, colorbar_array])
    else:
        combined = np.hstack([img_array, colorbar_array[:, :, :3]])

    # Save result
    result_img = Image.fromarray(combined)
    result_img.save(output_path)
    print(f"✓ Saved: {output_path}")

def main():
    print("===== ADDING GROUND TRUTH COLOR BARS =====\n")

    for probe_id in PROBES:
        print(f"Processing probe {probe_id}...")

        # Load channel regions for this probe
        channel_regions = load_channel_regions(probe_id, SESSION)

        if not channel_regions:
            print(f"  ⚠️  No channel data found for {probe_id}")
            continue

        # Process each depth profile image
        for snapshot in ["start", "middle", "end"]:
            input_path = DEPTH_PROFILE_DIR / f"depth_profile_{probe_id}.png"
            output_path = DEPTH_PROFILE_DIR / f"depth_profile_{probe_id}_gt.png"

            if not input_path.exists():
                print(f"  ⚠️  Image not found: {input_path}")
                continue

            try:
                add_colorbar_to_image(input_path, channel_regions, output_path)
            except Exception as e:
                print(f"  ❌ Error processing {probe_id}: {e}")

    print("\n✓ Ground truth color bars added!")

if __name__ == "__main__":
    main()
