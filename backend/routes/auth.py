from flask import Blueprint, request, jsonify
from db import get_db_connection
import bcrypt
from datetime import datetime, timedelta
import jwt
import os

auth_bp = Blueprint("auth_bp", __name__)

# JWT secret key (in production, use environment variable)
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

def verify_token(token):
    """Verify JWT token - exported for use in other modules"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def generate_token(user_id, username, is_admin=False, is_premium=False):
    """Generate JWT token for user"""
    payload = {
        "user_id": user_id,
        "username": username,
        "is_admin": is_admin,
        "is_premium": is_premium,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Check if username or email already exists
        cur.execute(
            "SELECT id FROM users WHERE username = %s OR email = %s",
            (username, email)
        )
        if cur.fetchone():
            return jsonify({"error": "Username or email already exists"}), 400

        # Hash password
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Insert user
        cur.execute(
            """INSERT INTO users (username, email, password_hash, full_name)
               VALUES (%s, %s, %s, %s)""",
            (username, email, password_hash, full_name)
        )
        user_id = cur.lastrowid
        conn.commit()
        
        # Fetch the created user
        cur.execute(
            "SELECT id, username, email, full_name, is_admin, is_premium FROM users WHERE id = %s",
            (user_id,)
        )
        user = cur.fetchone()

        token = generate_token(user[0], user[1], user[4], user[5])

        return jsonify({
            "message": "Registration successful",
            "token": token,
            "user": {
                "id": user[0],
                "username": user[1],
                "email": user[2],
                "full_name": user[3],
                "is_admin": user[4],
                "is_premium": user[5]
            }
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT id, username, email, password_hash, full_name, is_admin, is_premium FROM users WHERE username = %s OR email = %s",
            (username, username)
        )
        user = cur.fetchone()

        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        # Verify password
        if not bcrypt.checkpw(password.encode("utf-8"), user[3].encode("utf-8")):
            return jsonify({"error": "Invalid credentials"}), 401

        # Check if premium is still valid
        cur.execute("SELECT premium_expires_at FROM users WHERE id = %s", (user[0],))
        premium_expires = cur.fetchone()[0]
        is_premium = user[6]
        
        if premium_expires and datetime.now() > premium_expires:
            # Premium expired, update user
            cur.execute("UPDATE users SET is_premium = FALSE WHERE id = %s", (user[0],))
            conn.commit()
            is_premium = False

        token = generate_token(user[0], user[1], user[5], is_premium)

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user[0],
                "username": user[1],
                "email": user[2],
                "full_name": user[4],
                "is_admin": user[5],
                "is_premium": is_premium
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@auth_bp.route("/verify", methods=["POST"])
def verify():
    """Verify token and return user info"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    
    if not token:
        return jsonify({"error": "Token required"}), 401

    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT id, username, email, full_name, is_admin, is_premium FROM users WHERE id = %s",
            (payload["user_id"],)
        )
        user = cur.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "user": {
                "id": user[0],
                "username": user[1],
                "email": user[2],
                "full_name": user[3],
                "is_admin": user[4],
                "is_premium": user[5]
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

