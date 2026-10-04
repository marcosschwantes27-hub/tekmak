import os
import numpy as np
from PIL import Image, ImageFilter

def create_mobile_slide(
    src_path,
    output_path,
    machine_crop_box,       # (left, top, right, bottom) of machine in source
    target_machine_width=850,
    target_wheels_y=1350,
    canvas_w=946,
    canvas_h=2048,
    bg_color=(7, 10, 14),   # #070a0e
    spotlight_intensity=24.0,
    quality=95
):
    print(f"\nProcessing {src_path} -> {output_path}...")
    src = Image.open(src_path).convert('RGB')
    sw, sh = src.size
    
    # 1. Calculate scaling
    m_left, m_top, m_right, m_bottom = machine_crop_box
    m_width = m_right - m_left
    scale = target_machine_width / float(m_width)
    print(f"  Machine source width: {m_width}px -> target: {target_machine_width}px (scale: {scale:.4f})")
    
    scaled_w = int(sw * scale)
    scaled_h = int(sh * scale)
    scaled = src.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
    
    # 2. Calculate placement
    # Horizontal: center the machine at canvas_w // 2 (473)
    scaled_m_center_x = (m_left + m_right) * 0.5 * scale
    paste_x = int((canvas_w * 0.5) - scaled_m_center_x)
    
    # Vertical: align bottom wheels/feet with target_wheels_y
    scaled_wheels_y = m_bottom * scale
    paste_y = int(target_wheels_y - scaled_wheels_y)
    
    scaled_bottom_y = paste_y + scaled_h
    print(f"  Scaled size: {scaled_w}x{scaled_h}")
    print(f"  Paste coordinates: ({paste_x}, {paste_y})")
    print(f"  Machine top: {paste_y + int(m_top * scale)}px, bottom: {target_wheels_y}px")
    print(f"  Source image bottom edge on canvas: {scaled_bottom_y}px")
    
    # 3. Create Studio Background Canvas
    # Base: #070a0e
    bg_arr = np.zeros((canvas_h, canvas_w, 3), dtype=np.float32)
    bg_arr[:] = np.array(bg_color, dtype=np.float32)
    
    # Studio ceiling spotlight beam
    # Centers around x = canvas_w // 2, y = 700
    for y in range(canvas_h):
        for x in range(canvas_w):
            dx = (x - canvas_w * 0.5) / 380.0
            dy = (y - 720) / 580.0
            d2 = dx*dx + dy*dy
            spot = np.exp(-d2 * 1.15) * spotlight_intensity
            if y < target_wheels_y:
                bg_arr[y, x, 0] += spot * 0.82
                bg_arr[y, x, 1] += spot * 1.00
                bg_arr[y, x, 2] += spot * 1.35
                
    bg_img = Image.fromarray(np.clip(bg_arr, 0, 255).astype(np.uint8))
    
    # 4. Prepare scaled image with smooth alpha blending for top & edges
    # Top of scaled image fades seamlessly into studio background
    scaled_arr = np.array(scaled, dtype=np.float32)
    alpha = np.ones((scaled_h, scaled_w), dtype=np.float32) * 255.0
    
    # Top fade: first 140 rows of scaled image fade in
    top_fade_len = min(140, scaled_h)
    for r in range(top_fade_len):
        f = 0.5 - 0.5 * np.cos(np.pi * r / float(top_fade_len))
        alpha[r, :] *= f
        
    scaled_rgba = scaled.convert('RGBA')
    s_arr = np.array(scaled_rgba)
    s_arr[:, :, 3] = alpha.astype(np.uint8)
    scaled_rgba = Image.fromarray(s_arr)
    
    # Paste scaled image onto canvas
    bg_img.paste(scaled_rgba, (paste_x, paste_y), scaled_rgba)
    
    # 5. Seamless Floor Extension down to y = canvas_h (2048)
    canvas_arr = np.array(bg_img, dtype=np.float32)
    
    # Where does the source floor end? At scaled_bottom_y
    # We want a seamless extension starting around scaled_bottom_y - 80 down to 2048
    floor_trans_start = max(target_wheels_y + 40, scaled_bottom_y - 90)
    ext_len = canvas_h - floor_trans_start
    print(f"  Floor extension from y={floor_trans_start} to {canvas_h} (height: {ext_len}px)")
    
    if ext_len > 0:
        # Sample clean floor from scaled image near the bottom
        # Rows from scaled_bottom_y - 120 to scaled_bottom_y
        strip_y1 = max(0, scaled_h - 120)
        strip_y2 = scaled_h
        
        # Crop across canvas width at paste_x
        crop_x1 = max(0, -paste_x)
        crop_x2 = min(scaled_w, canvas_w - paste_x)
        floor_sample = scaled.crop((crop_x1, strip_y1, crop_x2, strip_y2))
        
        # If floor_sample width < canvas_w, resize or tile to full canvas_w
        floor_sample = floor_sample.resize((canvas_w, strip_y2 - strip_y1), Image.Resampling.LANCZOS)
        
        # Separate specular columns (low freq) and surface grain (high freq)
        f_low = floor_sample.filter(ImageFilter.GaussianBlur(radius=10))
        f_low_arr = np.array(f_low, dtype=np.float32)
        f_orig_arr = np.array(floor_sample, dtype=np.float32)
        f_high_arr = f_orig_arr - f_low_arr # high frequency metallic grain
        
        # Specular column profile at bottom of sample
        bottom_spec_profile = f_low_arr[-15:].mean(axis=0) # shape (canvas_w, 3)
        grain_h = f_high_arr.shape[0]
        
        bg_rgb = np.array(bg_color, dtype=np.float32)
        
        # Synthesize floor rows
        for y_idx in range(floor_trans_start, canvas_h):
            t = (y_idx - floor_trans_start) / float(ext_len)
            
            # Specular light columns decay with distance
            spec_decay = np.exp(-2.1 * t)
            spec_row = bg_rgb + (bottom_spec_profile - bg_rgb) * spec_decay
            
            # Micro metallic grain continues across floor
            grain_y = int(((y_idx - floor_trans_start) * 0.9) % grain_h)
            grain_row = f_high_arr[grain_y] * (1.0 - t * 0.6)
            
            # Horizontal vignette (darkening toward left and right edges)
            xs = np.linspace(-1.0, 1.0, canvas_w)
            vignette = 1.0 - 0.35 * (xs ** 2)
            vignette = np.clip(vignette, 0.0, 1.0)[:, None]
            
            synth_row = (spec_row + grain_row) * vignette
            
            # Cross-fade blend at junction with existing canvas content
            blend_zone = 90
            if y_idx < floor_trans_start + blend_zone:
                blend_factor = 0.5 - 0.5 * np.cos(np.pi * (y_idx - floor_trans_start) / float(blend_zone))
                canvas_arr[y_idx] = canvas_arr[y_idx] * (1.0 - blend_factor) + synth_row * blend_factor
            else:
                canvas_arr[y_idx] = synth_row
                
    # 6. Apply final subtle full-frame grading to ensure exact match with #070a0e
    # Ensure top 200 rows and bottom 100 rows seamlessly hit base color
    for r in range(180):
        t = 1.0 - (r / 180.0) # 1 at top, 0 at 180
        canvas_arr[r] = canvas_arr[r] * (1.0 - t * 0.45) + np.array(bg_color) * (t * 0.45)
        
    for r in range(canvas_h - 120, canvas_h):
        t = (r - (canvas_h - 120)) / 120.0
        canvas_arr[r] = canvas_arr[r] * (1.0 - t * 0.40) + np.array(bg_color) * (t * 0.40)
        
    final_img = Image.fromarray(np.clip(canvas_arr, 0, 255).astype(np.uint8))
    
    # Save as WebP
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_img.save(output_path, 'WEBP', quality=quality, method=6)
    file_size = os.path.getsize(output_path)
    print(f"  Successfully saved {output_path}: {final_img.size}, {file_size / 1024:.1f} KB")
    return final_img

def main():
    # 1. Slide 0: Prensa Industrial
    # In assets/hero-slide-3-prensa-v2.webp (1672x941):
    # Machine box: left=524 (white tray), top=220 (chimney), right=1615 (side casing), bottom=770 (wheels)
    create_mobile_slide(
        src_path='assets/hero-slide-3-prensa-v2.webp',
        output_path='assets/hero-slide-0-prensa-mobile.webp',
        machine_crop_box=(524, 220, 1615, 770),
        target_machine_width=860,       # 860 / 946 = 90.9% width
        target_wheels_y=1350,          # wheels at y=1350 (65.9% height)
        spotlight_intensity=26.0,
        quality=95
    )
    
    # 2. Slide 1: Impressora Industrial
    # In assets/hero-slide-1-impressora-v2.webp (1672x941):
    # Machine box: left=580 (left frame), top=210 (top ink towers), right=1555 (right panel), bottom=740 (feet)
    create_mobile_slide(
        src_path='assets/hero-slide-1-impressora-v2.webp',
        output_path='assets/hero-slide-1-impressora-mobile.webp',
        machine_crop_box=(580, 210, 1555, 740),
        target_machine_width=835,       # 835 / 946 = 88.3% width
        target_wheels_y=1375,          # feet at y=1375 (67.1% height)
        spotlight_intensity=22.0,
        quality=95
    )

if __name__ == '__main__':
    main()
