#!/usr/bin/env python3
"""
Simple script to create basic PWA icons for LearnTug
Creates purple gradient icons with 'LT' text
"""

def create_basic_png_data(size):
    """Create a basic PNG file with purple background and white LT text"""
    import struct
    import zlib
    
    # Create image data (RGBA)
    width, height = size, size
    img_data = bytearray()
    
    for y in range(height):
        img_data.append(0)  # Filter type: None
        for x in range(width):
            # Purple gradient from top to bottom
            r = int(139 + (89 - 139) * y / height)  # 139->89
            g = int(92 + (130 - 92) * y / height)   # 92->130  
            b = int(246 + (246 - 246) * y / height) # 246->246
            a = 255
            
            # Add simple "LT" text in center
            center_x, center_y = width // 2, height // 2
            text_size = size // 6
            
            # Simple pixel art "L"
            if (x >= center_x - text_size and x <= center_x - text_size//2 and 
                y >= center_y - text_size and y <= center_y + text_size):
                r, g, b = 255, 255, 255  # White
            elif (x >= center_x - text_size and x <= center_x and 
                  y >= center_y + text_size//2 and y <= center_y + text_size):
                r, g, b = 255, 255, 255  # White
            
            # Simple pixel art "T"
            elif (x >= center_x + text_size//4 and x <= center_x + text_size and 
                  y >= center_y - text_size and y <= center_y - text_size//2):
                r, g, b = 255, 255, 255  # White
            elif (x >= center_x + text_size//2 and x <= center_x + text_size//2 + text_size//4 and 
                  y >= center_y - text_size and y <= center_y + text_size):
                r, g, b = 255, 255, 255  # White
            
            img_data.extend([r, g, b, a])
    
    # Compress the image data
    compressed_data = zlib.compress(bytes(img_data))
    
    # PNG file structure
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    ihdr_chunk = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk
    idat_crc = zlib.crc32(b'IDAT' + compressed_data) & 0xffffffff
    idat_chunk = struct.pack('>I', len(compressed_data)) + b'IDAT' + compressed_data + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    iend_chunk = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png_signature + ihdr_chunk + idat_chunk + iend_chunk

def create_icon_file(size, filename):
    """Create a PNG icon file"""
    try:
        png_data = create_basic_png_data(size)
        with open(filename, 'wb') as f:
            f.write(png_data)
        print(f"✅ Created {filename} ({len(png_data)} bytes)")
        return True
    except Exception as e:
        print(f"❌ Error creating {filename}: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Creating LearnTug PWA icons...")
    
    success = True
    success &= create_icon_file(192, "icon-192x192.png")
    success &= create_icon_file(512, "icon-512x512.png")
    
    if success:
        print("🎉 All icons created successfully!")
        print("📱 PWA should now work without icon errors.")
    else:
        print("⚠️ Some icons failed to create.") 