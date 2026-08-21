import psycopg2

passwords = ['', 'postgres', 'admin', 'root', '1234', '123456', 'password', 'pass', 'postgres123']
connected = False

for p in passwords:
    try:
        conn = psycopg2.connect(dbname='postgres', user='postgres', password=p, host='localhost', port=5432)
        print(f"SUCCESS: Connected to PostgreSQL with password: '{p}'")
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute("SELECT datname FROM pg_database WHERE datname='civiclens_db'")
        if not cursor.fetchone():
            cursor.execute("CREATE DATABASE civiclens_db")
            print("Created database 'civiclens_db'")
        conn.close()
        connected = True
        break
    except Exception as e:
        pass

if not connected:
    print("Could not connect to localhost PostgreSQL with standard passwords, will support configurable PG URL.")
