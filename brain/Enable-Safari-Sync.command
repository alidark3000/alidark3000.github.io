#!/bin/bash
# =========================================================================
# Ali Brain • Safari Local File Sync Bridge Installer & Launcher
# =========================================================================
# Installs a lightweight local file bridge on 127.0.0.1:8765 and registers
# a macOS LaunchAgent so Safari can open, auto-save, and 3-way merge local
# .json knowledge base files in place just like Chrome.
# =========================================================================

set -e

BRIDGE_DIR="$HOME/.alibrain"
BRIDGE_SCRIPT="$BRIDGE_DIR/bridge.py"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$LAUNCH_AGENTS_DIR/com.alibrain.bridge.plist"
PORT=8765

mkdir -p "$BRIDGE_DIR"
mkdir -p "$LAUNCH_AGENTS_DIR"

cat << 'EOF' > "$BRIDGE_SCRIPT"
#!/usr/bin/env python3
import http.server
import json
import os
import subprocess
import sys
import urllib.parse

PORT = 8765
STATE_DIR = os.path.expanduser("~/.alibrain")
STATE_FILE = os.path.join(STATE_DIR, "state.json")

os.makedirs(STATE_DIR, exist_ok=True)

def load_state():
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def save_state(state):
    try:
        tmp = STATE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
        os.replace(tmp, STATE_FILE)
    except Exception:
        pass

def run_osascript(script):
    proc = subprocess.run(
        ["/usr/bin/osascript", "-e", script],
        capture_output=True,
        text=True
    )
    if proc.returncode != 0:
        return None
    return proc.stdout.strip()

class BridgeHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        state = load_state()

        if parsed.path == "/status":
            target_path = params.get("path", [None])[0] or state.get("lastPath")
            exists = bool(target_path and os.path.isfile(target_path))
            mtime = int(os.path.getmtime(target_path) * 1000) if exists else 0
            self.send_json({
                "ok": True,
                "version": "1.0.0",
                "lastPath": target_path if exists else None,
                "lastName": os.path.basename(target_path) if exists else None,
                "exists": exists,
                "lastModified": mtime
            })
            return

        if parsed.path == "/file":
            target_path = params.get("path", [None])[0] or state.get("lastPath")
            if not target_path or not os.path.isfile(target_path):
                self.send_json({"ok": False, "error": "File not found on disk."}, status=404)
                return
            try:
                with open(target_path, "r", encoding="utf-8") as f:
                    content = f.read()
                mtime = int(os.path.getmtime(target_path) * 1000)
                self.send_json({
                    "ok": True,
                    "path": target_path,
                    "name": os.path.basename(target_path),
                    "lastModified": mtime,
                    "content": content
                })
            except Exception as e:
                self.send_json({"ok": False, "error": str(e)}, status=500)
            return

        self.send_json({"ok": False, "error": "Not found"}, status=404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            body = json.loads(raw_body) if raw_body.strip() else {}
        except Exception:
            body = {}

        if parsed.path == "/pick-open":
            remember = body.get("remember", True)
            applescript = '''
            tell application "System Events"
                activate
                set theFile to choose file with prompt "Select your Knowledge Base (.json) file:" of type {"json", "public.json"}
                return POSIX path of theFile
            end tell
            '''
            chosen = run_osascript(applescript)
            if not chosen:
                self.send_json({"ok": False, "cancelled": True})
                return
            chosen = os.path.abspath(os.path.expanduser(chosen))
            if not os.path.isfile(chosen):
                self.send_json({"ok": False, "error": "Selected file does not exist."}, status=400)
                return
            if remember:
                state = load_state()
                state["lastPath"] = chosen
                save_state(state)
            mtime = int(os.path.getmtime(chosen) * 1000)
            self.send_json({
                "ok": True,
                "path": chosen,
                "name": os.path.basename(chosen),
                "lastModified": mtime
            })
            return

        if parsed.path == "/pick-save":
            suggested = body.get("suggestedName", "my-knowledge-base.json")
            safe_suggested = suggested.replace('"', '')
            applescript = f'''
            tell application "System Events"
                activate
                set theFile to choose file name with prompt "Create New Knowledge Base (.json) file:" default name "{safe_suggested}"
                return POSIX path of theFile
            end tell
            '''
            chosen = run_osascript(applescript)
            if not chosen:
                self.send_json({"ok": False, "cancelled": True})
                return
            chosen = os.path.abspath(os.path.expanduser(chosen))
            if not chosen.lower().endswith(".json"):
                chosen += ".json"
            try:
                os.makedirs(os.path.dirname(chosen), exist_ok=True)
                if not os.path.exists(chosen):
                    with open(chosen, "w", encoding="utf-8") as f:
                        f.write("")
                state = load_state()
                state["lastPath"] = chosen
                save_state(state)
                mtime = int(os.path.getmtime(chosen) * 1000)
                self.send_json({
                    "ok": True,
                    "path": chosen,
                    "name": os.path.basename(chosen),
                    "lastModified": mtime
                })
            except Exception as e:
                self.send_json({"ok": False, "error": str(e)}, status=500)
            return

        if parsed.path == "/file":
            state = load_state()
            target_path = body.get("path") or state.get("lastPath")
            content = body.get("content")
            if not target_path:
                self.send_json({"ok": False, "error": "Missing file path."}, status=400)
                return
            if content is None:
                self.send_json({"ok": False, "error": "Missing content."}, status=400)
                return
            try:
                target_path = os.path.abspath(os.path.expanduser(target_path))
                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                tmp_path = target_path + ".alibrain.tmp"
                with open(tmp_path, "w", encoding="utf-8") as f:
                    f.write(content)
                os.replace(tmp_path, target_path)
                state["lastPath"] = target_path
                save_state(state)
                mtime = int(os.path.getmtime(target_path) * 1000)
                self.send_json({
                    "ok": True,
                    "path": target_path,
                    "name": os.path.basename(target_path),
                    "lastModified": mtime
                })
            except Exception as e:
                self.send_json({"ok": False, "error": str(e)}, status=500)
            return

        self.send_json({"ok": False, "error": "Not found"}, status=404)

if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), BridgeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
EOF

chmod +x "$BRIDGE_SCRIPT"

PYTHON_BIN="/usr/bin/python3"
if [ ! -x "$PYTHON_BIN" ]; then
  PYTHON_BIN="$(command -v python3)"
fi

WRAPPER_PATH="$BRIDGE_DIR/Ali Brain Link"
cat << EOF > "$WRAPPER_PATH"
#!/bin/sh
exec "$PYTHON_BIN" "$BRIDGE_SCRIPT" "\$@"
EOF
chmod +x "$WRAPPER_PATH"

cat << EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.alibrain.bridge</string>
  <key>ProgramArguments</key>
  <array>
    <string>$WRAPPER_PATH</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$BRIDGE_DIR/bridge.log</string>
  <key>StandardErrorPath</key>
  <string>$BRIDGE_DIR/bridge.err</string>
</dict>
</plist>
EOF

# Stop any existing instance on port 8765
lsof -ti tcp:$PORT | xargs kill -9 2>/dev/null || true
launchctl bootout "gui/$(id -u)" "$PLIST_PATH" 2>/dev/null || launchctl unload "$PLIST_PATH" 2>/dev/null || true

# Load LaunchAgent so it starts now and on every macOS login
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH" 2>/dev/null || launchctl load -w "$PLIST_PATH" 2>/dev/null || true

sleep 0.6

# Fallback direct background launch if launchctl hasn't bound the port yet
if ! lsof -i tcp:$PORT >/dev/null 2>&1; then
  nohup "$WRAPPER_PATH" >/dev/null 2>&1 &
  sleep 0.5
fi

echo ""
echo "========================================================"
echo "  Ali Brain Safari Local File Sync Bridge is ACTIVE!"
echo "  Listening on: http://127.0.0.1:$PORT"
echo "  Auto-Start:   Enabled (macOS LaunchAgent)"
echo "========================================================"
echo ""
echo "You can now close this Terminal window and return to Safari."
