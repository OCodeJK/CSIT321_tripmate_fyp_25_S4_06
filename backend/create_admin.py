import bcrypt
from db import get_db_connection

def create_admin():
    """Create admin user account"""
    username = "admin"
    email = "admin@tripmate.com"
    password = "admin123"
    full_name = "Administrator"
    
    # Hash password
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Check if admin already exists
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            print(f"Admin user '{username}' already exists!")
            return
        
        # Insert admin user
        cur.execute(
            """INSERT INTO users (username, email, password_hash, full_name, is_admin, is_premium)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (username, email, password_hash, full_name, True, True)
        )
        user_id = cur.lastrowid
        conn.commit()
        
        print(f"Admin account created successfully!")
        print(f"Username: {username}")
        print(f"Password: {password}")
        print(f"User ID: {user_id}")
        
    except Exception as e:
        conn.rollback()
        print(f"Error creating admin: {str(e)}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    create_admin()

