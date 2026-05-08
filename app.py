import os
import sys
import sqlite3
import json
import threading
import webbrowser
from datetime import datetime
from flask import Flask, jsonify, request, send_file

# ---------------------------------------------------------------------------
# Paths — work both in dev (plain Python) and frozen (PyInstaller --onefile)
# ---------------------------------------------------------------------------

def _base_dir():
    """Directory of the .exe when frozen, or of this script in dev."""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def _html_path():
    """HTML file lives in _MEIPASS when frozen, beside script in dev."""
    if getattr(sys, 'frozen', False):
        return os.path.join(sys._MEIPASS, 'business_plan_tool.html')
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'business_plan_tool.html')


DB_PATH = os.path.join(_base_dir(), 'reports.db')

# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------

app = Flask(__name__)


def _get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS reports (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                name          TEXT    NOT NULL,
                created_at    TEXT    NOT NULL,
                plan_code     TEXT    DEFAULT '',
                scope         TEXT    DEFAULT '',
                state_json    TEXT    NOT NULL,
                summary_json  TEXT    DEFAULT '{}'
            )
        ''')


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    return send_file(_html_path())


@app.route('/api/reports', methods=['GET'])
def list_reports():
    with _get_db() as conn:
        rows = conn.execute(
            'SELECT id, name, created_at, plan_code, scope, summary_json '
            'FROM reports ORDER BY created_at DESC'
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route('/api/reports', methods=['POST'])
def save_report():
    data = request.get_json(force=True, silent=True) or {}
    if not data.get('name') or not data.get('state_json'):
        return jsonify({'error': 'name and state_json are required'}), 400
    with _get_db() as conn:
        cur = conn.execute(
            'INSERT INTO reports (name, created_at, plan_code, scope, state_json, summary_json) '
            'VALUES (?, ?, ?, ?, ?, ?)',
            (
                data['name'],
                datetime.now().strftime('%Y-%m-%d %H:%M'),
                data.get('plan_code', ''),
                data.get('scope', ''),
                data['state_json'],
                json.dumps(data.get('summary', {})),
            )
        )
        new_id = cur.lastrowid
    return jsonify({'id': new_id, 'ok': True}), 201


@app.route('/api/reports/<int:rid>', methods=['GET'])
def get_report(rid):
    with _get_db() as conn:
        row = conn.execute('SELECT * FROM reports WHERE id = ?', (rid,)).fetchone()
    if not row:
        return jsonify({'error': 'not found'}), 404
    return jsonify(dict(row))


@app.route('/api/reports/<int:rid>', methods=['DELETE'])
def delete_report(rid):
    with _get_db() as conn:
        conn.execute('DELETE FROM reports WHERE id = ?', (rid,))
    return jsonify({'ok': True})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def _open_browser():
    webbrowser.open('http://127.0.0.1:5000')


if __name__ == '__main__':
    init_db()
    threading.Timer(1.2, _open_browser).start()
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
