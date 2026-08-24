#!/bin/bash

# Create PNG icons from SVG for Chrome extension
# This fixes issues where Chrome doesn't load SVG icons properly

EXTENSION_DIR="/home/khanhromvn/Documents/Coding/Zentri/extensions/workflow-recorder"
ICON_SVG="$EXTENSION_DIR/icon.svg"

echo "🎨 Creating PNG icons from SVG..."

# Check if rsvg-convert is installed (for SVG to PNG conversion)
if ! command -v rsvg-convert &> /dev/null; then
    echo "⚠️  rsvg-convert not found. Installing librsvg2-bin..."
    sudo apt-get update && sudo apt-get install -y librsvg2-bin
fi

# Check if convert (ImageMagick) is installed as alternative
if ! command -v rsvg-convert &> /dev/null && ! command -v convert &> /dev/null; then
    echo "❌ Neither rsvg-convert nor ImageMagick convert found."
    echo "Please install one of them:"
    echo "  sudo apt-get install librsvg2-bin"
    echo "  OR"
    echo "  sudo apt-get install imagemagick"
    exit 1
fi

# Create icons in different sizes
SIZES=(16 32 48 128)

for size in "${SIZES[@]}"; do
    output="$EXTENSION_DIR/icon-${size}.png"
    
    if command -v rsvg-convert &> /dev/null; then
        rsvg-convert -w $size -h $size "$ICON_SVG" -o "$output"
    elif command -v convert &> /dev/null; then
        convert -background none -resize ${size}x${size} "$ICON_SVG" "$output"
    fi
    
    if [ -f "$output" ]; then
        echo "✅ Created $output"
    else
        echo "❌ Failed to create $output"
    fi
done

echo "✨ Done! Now update manifest.json to use PNG icons."
