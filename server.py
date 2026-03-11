import sqlite3
import hashlib
import os
import bcrypt
from datetime import datetime
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

# ─── Database setup ───────────────────────────────────────────────
DB_FILE = "details.db"

def init_db():
    if not os.path.exists(DB_FILE):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                username    TEXT UNIQUE NOT NULL,
                email       TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at  TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()
        print(f"Database created: {DB_FILE}")
    else:
        print(f"Database already exists: {DB_FILE}")

# Call once when starting (or move to a separate init script)
init_db()

# ─── Very simple password hashing (SHA-256) ───────────────────────
#     In production → use bcrypt or argon2 !!!
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')

def check_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# ─── API endpoint ─────────────────────────────────────────────────
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        username = data.get('username', '').strip()
        email    = data.get('email', '').strip()
        password = data.get('password', '')

        if not all([username, email, password]):
            return jsonify({"error": "All fields are required"}), 400

        if len(username) < 3:
            return jsonify({"error": "Username must be at least 3 characters"}), 400

        if '@' not in email or '.' not in email:
            return jsonify({"error": "Invalid email format"}), 400

        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400

        password_hash = hash_password(password)

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Check if username or email already exists
        cursor.execute("SELECT 1 FROM users WHERE username = ? OR email = ?", (username, email))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Username or email already taken"}), 409

        # Insert new user
        created_at = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES (?, ?, ?, ?)
        """, (username, email, password_hash, created_at))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Account created successfully",
            "username": username
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({"error": "Username or email already taken"}), 409
    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({"error": "Server error. Please try again later."}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request"}), 400

        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({"error": "Username and password required"}), 400

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute("SELECT password_hash FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()

        conn.close()

        if not row:
            return jsonify({"error": "Invalid username or password"}), 401

        if not check_password(password, row[0]):
            return jsonify({"error": "Invalid username or password"}), 401

        # Login successful
        # In real app: create session / JWT token here
        return jsonify({
            "message": "Login successful",
            "username": username
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)