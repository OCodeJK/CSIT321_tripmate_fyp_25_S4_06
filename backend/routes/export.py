from flask import Blueprint, request, send_file, jsonify
import os
import tempfile
from PIL import Image, ImageDraw, ImageFont
import io

export_bp = Blueprint("export_bp", __name__)

# Try to import moviepy, but make it optional
try:
    from moviepy.editor import ImageClip, concatenate_videoclips, TextClip, CompositeVideoClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

@export_bp.route("/video", methods=["POST"])
def export_video():
    # Check if user is premium
    from routes.auth import verify_token
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401
    
    if not payload.get("is_premium"):
        return jsonify({"error": "Video export is only available for premium users"}), 403

    data = request.get_json()
    locations = data.get("locations", [])
    photos = data.get("photos", {})
    route_data = data.get("routeData", {})

    if not photos or not any(photos.values()):
        return jsonify({"error": "No photos to export"}), 400

    # Collect all photos in order
    all_photos = []
    for location_name, photo_list in photos.items():
        for photo in photo_list:
            all_photos.append({
                "url": photo.get("url", ""),
                "location": location_name
            })

    if not MOVIEPY_AVAILABLE:
        # Create a simple placeholder video using PIL
        return create_simple_video(all_photos, locations, route_data)
    
    try:
        return create_moviepy_video(all_photos, locations, route_data)
    except Exception as e:
        print(f"MoviePy error: {e}, falling back to simple video")
        return create_simple_video(all_photos, locations, route_data)

def create_simple_video(photos, locations, route_data):
    """Create a simple video using PIL (fallback)"""
    # Create a simple image sequence as a placeholder
    # In production, you'd want to use a proper video library
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frames = []
    for photo_info in photos[:10]:  # Limit to 10 photos for demo
        try:
            # Load image from URL
            photo_filename = photo_info["url"].split("/")[-1]
            photo_path = os.path.join(BASE_DIR, "uploads", "photos", photo_filename)
            if os.path.exists(photo_path):
                img = Image.open(photo_path)
                img = img.resize((1920, 1080), Image.Resampling.LANCZOS)
                
                # Add text overlay
                draw = ImageDraw.Draw(img)
                try:
                    font = ImageFont.truetype("arial.ttf", 60)
                except:
                    font = ImageFont.load_default()
                
                text = photo_info.get("location", "Trip Photo")
                draw.text((50, 50), text, fill=(255, 255, 255), font=font, stroke_width=2, stroke_fill=(0, 0, 0))
                frames.append(img)
        except Exception as e:
            print(f"Error processing photo: {e}")
            continue

    if not frames:
        return jsonify({"error": "Could not process any photos"}), 500

    # Save as a simple animated GIF (since we can't create MP4 without moviepy)
    output = io.BytesIO()
    frames[0].save(
        output,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=2000,  # 2 seconds per frame
        loop=0
    )
    output.seek(0)
    
    return send_file(
        output,
        mimetype="image/gif",
        as_attachment=True,
        download_name="trip-recap.gif"
    )

def create_moviepy_video(photos, locations, route_data):
    """Create video using MoviePy"""
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    clips = []
    
    for photo_info in photos[:20]:  # Limit to 20 photos
        try:
            photo_filename = photo_info["url"].split("/")[-1]
            photo_path = os.path.join(BASE_DIR, "uploads", "photos", photo_filename)
            if not os.path.exists(photo_path):
                continue
                
            # Create image clip
            clip = ImageClip(photo_path, duration=3)
            clip = clip.resize((1920, 1080))
            
            # Add text overlay
            location_name = photo_info.get("location", "Trip Photo")
            txt_clip = TextClip(
                location_name,
                fontsize=60,
                color="white",
                font="Arial-Bold",
                stroke_color="black",
                stroke_width=2
            ).set_position(("center", 50)).set_duration(3)
            
            # Composite
            video = CompositeVideoClip([clip, txt_clip])
            clips.append(video)
        except Exception as e:
            print(f"Error processing photo with MoviePy: {e}")
            continue
    
    if not clips:
        return jsonify({"error": "Could not process any photos"}), 500
    
    # Concatenate all clips
    final_video = concatenate_videoclips(clips, method="compose")
    
    # Export to temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    final_video.write_videofile(
        temp_file.name,
        fps=24,
        codec="libx264",
        audio=False,
        verbose=False,
        logger=None
    )
    
    return send_file(
        temp_file.name,
        mimetype="video/mp4",
        as_attachment=True,
        download_name="trip-recap.mp4"
    )

