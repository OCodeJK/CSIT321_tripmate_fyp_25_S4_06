from flask import Blueprint, request, jsonify
from db import get_db_connection
from routes.auth import verify_token

notifications_bp = Blueprint("notifications_bp", __name__)

def get_user_from_token():
    """Helper to get user from token"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None
    payload = verify_token(token)
    return payload

@notifications_bp.route("/", methods=["GET"])
def get_notifications():
    """Get all notifications for current user"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """SELECT id, message, type, is_read, created_at
               FROM notifications WHERE user_id = %s
               ORDER BY created_at DESC""",
            (user["user_id"],)
        )

        notifications = []
        for row in cur.fetchall():
            notifications.append({
                "id": row[0],
                "message": row[1],
                "type": row[2],
                "is_read": row[3],
                "created_at": row[4].isoformat()
            })

        unread_count = sum(1 for n in notifications if not n["is_read"])

        return jsonify({
            "notifications": notifications,
            "unread_count": unread_count
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@notifications_bp.route("/<int:notification_id>/read", methods=["PUT"])
def mark_read(notification_id):
    """Mark a notification as read"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "UPDATE notifications SET is_read = TRUE WHERE id = %s AND user_id = %s",
            (notification_id, user["user_id"])
        )
        conn.commit()

        if cur.rowcount == 0:
            return jsonify({"error": "Notification not found"}), 404

        return jsonify({"message": "Notification marked as read"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@notifications_bp.route("/<int:notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    """Delete a notification"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "DELETE FROM notifications WHERE id = %s AND user_id = %s",
            (notification_id, user["user_id"])
        )
        conn.commit()

        if cur.rowcount == 0:
            return jsonify({"error": "Notification not found"}), 404

        return jsonify({"message": "Notification deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@notifications_bp.route("/read-all", methods=["PUT"])
def mark_all_read():
    """Mark all notifications as read"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = %s AND is_read = FALSE",
            (user["user_id"],)
        )
        conn.commit()

        return jsonify({"message": "All notifications marked as read"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

