import psycopg2

def get_db_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="tripmate_db",
        user="postgres",
        password="1337"
    )
    return conn
