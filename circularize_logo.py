import os
from PIL import Image, ImageOps, ImageDraw

def make_circle(image_path, output_path):
    try:
        img = Image.open(image_path).convert("RGBA")
        
        # Create mask
        mask = Image.new("L", img.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0) + img.size, fill=255)
        
        # Apply mask
        output = ImageOps.fit(img, mask.size, centering=(0.5, 0.5))
        output.putalpha(mask)
        
        output.save(output_path)
        print(f"Created circular icon at {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    src = "public/logo.png"
    if not os.path.exists(src):
        # Fallback if logo.png doesn't exist, try local specific path or fail
        print("Source logo.png not found")
        exit(1)
        
    make_circle(src, "resources/icon.png")
    # Also update public/icon.png if used by metadata
    make_circle(src, "public/icon.png")
