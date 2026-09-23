#!/usr/bin/env python3
"""
Script to set up the Betty's Bird Boutique database.
Connects to Cloud SQL MySQL instance and runs the schema.

Install dependencies: uv pip install mysql-connector-python
"""
import mysql.connector
from mysql.connector import Error
import os
from pathlib import Path

# Database connection details
DB_HOST = "35.226.62.44"
DB_USER = "betty_user"
DB_PASSWORD = "Cc6hD88gWlK9oBwm"
DB_PORT = 3306

def setup_database():
    """Connect to database and run schema SQL."""
    try:
        # Connect to MySQL server
        print(f"Connecting to MySQL at {DB_HOST}...")
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            allow_local_infile=True
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            print("Connected successfully!")
            
            # Read and execute SQL file
            script_dir = Path(__file__).parent.parent.parent
            sql_file = script_dir / "docs" / "betty_db.sql"
            print(f"Reading SQL file: {sql_file}")
            
            with open(sql_file, 'r') as file:
                sql_script = file.read()
            
            # Execute SQL statements
            print("Executing SQL schema...")
            for statement in sql_script.split(';'):
                statement = statement.strip()
                if statement:
                    try:
                        cursor.execute(statement)
                        connection.commit()
                        print(f"  ✓ Executed: {statement[:50]}...")
                    except Error as e:
                        if "already exists" not in str(e).lower():
                            print(f"  ⚠ Warning: {e}")
            
            # Verify data was inserted
            cursor.execute("SELECT COUNT(*) FROM betty.products")
            count = cursor.fetchone()[0]
            print(f"\n✓ Database setup complete! Found {count} products in database.")
            
            # Show products
            cursor.execute("SELECT product_name, price FROM betty.products")
            products = cursor.fetchall()
            print("\nProducts in database:")
            for name, price in products:
                print(f"  - {name}: ${price:.2f}")
            
            cursor.close()
            connection.close()
            print("\n✓ Connection closed.")
            
    except Error as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = setup_database()
    exit(0 if success else 1)
