
import mysql.connector
import os

def restore_database():
    # Database configuration
    config = {
        'user': 'betty_user',
        'password': 'Cc6hD88gWlK9oBwm',
        'host': '34.172.114.46',
        'port': 3306,
        'database': 'betty',  # Connect to 'betty' if it exists, otherwise leave None and create it
        'autocommit': True
    }

    try:
        # First connect without database to ensure it exists
        cnx = mysql.connector.connect(**{k: v for k, v in config.items() if k != 'database'})
        cursor = cnx.cursor()
        
        # Read SQL file
        with open('docs/betty_db.sql', 'r') as f:
            sql_script = f.read()

        # Execute statements
        print("Executing SQL script...")
        # Split by semicolon, but be careful with data containing semicolons (though our simple script implies we can just split)
        statements = [s.strip() for s in sql_script.split(';') if s.strip()]
        
        for statement in statements:
            print(f"Executing: {statement[:50]}...")
            cursor.execute(statement)
            print(f"Rows affected: {cursor.rowcount}")

        cnx.commit()

        print("Database restoration completed successfully.")

    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'cnx' in locals():
            cnx.close()

if __name__ == "__main__":
    restore_database()
