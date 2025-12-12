import mysql.connector
from mysql.connector import Error
import os

def get_db_connection():
    """
    Connect to MySQL database
    Update these values to match your MySQL setup:
    - host: usually "localhost" or "127.0.0.1"
    - database: name of your database (default: "tripmate_db")
    - user: your MySQL username (default: "root")
    - password: your MySQL password (leave empty string "" if no password)
    """
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "tripmate_db"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "kratonmotor")
        )
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        print("\nMake sure:")
        print("1. MySQL server is running")
        print("2. Database 'tripmate_db' exists (run schema_mysql.sql first)")
        print("3. Username and password are correct")
        raise
