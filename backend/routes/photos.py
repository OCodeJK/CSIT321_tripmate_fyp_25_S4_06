from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from db import get_db_connection
from routes.auth import verify_token
import os
import uuid
from datetime import datetime

photos_bp = Blueprint("photos_bp", __name__)

# Get the directory where this file is located (routes folder)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "photos")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "mp4", "mov", "mp3", "wav"}

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# File size limits (in bytes)
MAX_FILE_SIZE_FREE = 100 * 1024 * 1024  # 100MB
MAX_FILE_SIZE_PREMIUM = 1024 * 1024 * 1024  # 1GB

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def get_user_from_token():
    """Helper to get user from token"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None
    payload = verify_token(token)
    return payload

@photos_bp.route("/upload", methods=["POST"])
def upload_photos():
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if "photos" not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    trip_id = request.form.get("trip_id")
    location_name = request.form.get("location_name", "Unknown")
    files = request.files.getlist("photos")
    
    if not files or files[0].filename == "":
        return jsonify({"error": "No files selected"}), 400

    if not trip_id:
        return jsonify({"error": "Trip ID is required"}), 400

    # Verify trip ownership
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT user_id FROM trips WHERE id = %s", (trip_id,))
        trip = cur.fetchone()
        if not trip:
            return jsonify({"error": "Trip not found"}), 404
        if trip[0] != user["user_id"]:
            return jsonify({"error": "Unauthorized"}), 403

        # Check user's storage limit
        max_size = MAX_FILE_SIZE_PREMIUM if user.get("is_premium") else MAX_FILE_SIZE_FREE
        cur.execute("SELECT SUM(LENGTH(file_path)) FROM photos WHERE trip_id = %s", (trip_id,))
        current_size = cur.fetchone()[0] or 0

        uploaded_photos = []
        total_size = 0
        
        for file in files:
            if not file or not allowed_file(file.filename):
                continue

            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)

            if file_size > max_size:
                return jsonify({"error": f"File {file.filename} exceeds maximum size limit"}), 400

            if current_size + total_size + file_size > max_size:
                if not user.get("is_premium"):
                    return jsonify({"error": "Storage limit reached. Upgrade to premium for more space"}), 400
                else:
                    return jsonify({"error": "Storage limit reached"}), 400

            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(filepath)

            # Save to database
            cur.execute(
                """INSERT INTO photos (trip_id, location_name, filename, file_path)
                   VALUES (%s, %s, %s, %s)""",
                (trip_id, location_name, filename, f"/uploads/photos/{unique_filename}")
            )
            photo_id = cur.lastrowid

            uploaded_photos.append({
                "id": photo_id,
                "filename": filename,
                "url": f"/api/photos/uploads/photos/{unique_filename}",
                "location_name": location_name,
                "uploaded_at": datetime.now().isoformat()
            })
            total_size += file_size

        conn.commit()
        return jsonify({"photos": uploaded_photos}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@photos_bp.route("/<int:photo_id>", methods=["DELETE"])
def delete_photo(photo_id):
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Get photo and verify ownership through trip
        cur.execute(
            """SELECT p.file_path, t.user_id FROM photos p
               JOIN trips t ON p.trip_id = t.id WHERE p.id = %s""",
            (photo_id,)
        )
        photo = cur.fetchone()
        
        if not photo:
            return jsonify({"error": "Photo not found"}), 404
        
        if photo[1] != user["user_id"]:
            return jsonify({"error": "Unauthorized"}), 403

        # Delete file
        file_path = photo[0].replace("/api/photos", "").replace("/uploads/photos/", "")
        full_path = os.path.join(UPLOAD_FOLDER, file_path.split("/")[-1])
        if os.path.exists(full_path):
            os.remove(full_path)

        # Delete from database
        cur.execute("DELETE FROM photos WHERE id = %s", (photo_id,))
        conn.commit()

        return jsonify({"message": "Photo deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@photos_bp.route("/trip/<int:trip_id>", methods=["GET"])
def get_trip_photos(trip_id):
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Verify trip ownership
        cur.execute("SELECT user_id FROM trips WHERE id = %s", (trip_id,))
        trip = cur.fetchone()
        if not trip:
            return jsonify({"error": "Trip not found"}), 404
        if trip[0] != user["user_id"]:
            return jsonify({"error": "Unauthorized"}), 403

        cur.execute(
            """SELECT id, location_name, filename, file_path, uploaded_at
               FROM photos WHERE trip_id = %s ORDER BY uploaded_at ASC""",
            (trip_id,)
        )

        photos = []
        for row in cur.fetchall():
            photos.append({
                "id": row[0],
                "location_name": row[1],
                "filename": row[2],
                "url": f"/api/photos{row[3]}",
                "uploaded_at": row[4].isoformat() if row[4] else None
            })

        return jsonify({"photos": photos}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@photos_bp.route("/uploads/photos/<filename>")
def serve_photo(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

