# serve.py
import http.server
import socketserver
import webbrowser
import threading
import os

PORT = 8000
HOST = "localhost"
DIRECTORY = "." # Serve files from the current directory where the script is run

# Ensure index.html exists in the target directory
if not os.path.exists(os.path.join(DIRECTORY, "index.html")):
    print(f"Error: 'index.html' not found in the directory '{os.path.abspath(DIRECTORY)}'.")
    print("Please place this script in the same directory as your index.html file.")
    exit()

# Define the handler to use for incoming requests
# SimpleHTTPRequestHandler serves files from the current directory
Handler = http.server.SimpleHTTPRequestHandler

# Use socketserver.TCPServer for the server instance
# It allows address reuse which is helpful for quick restarts
socketserver.TCPServer.allow_reuse_address = True

# Create the server instance
httpd = socketserver.TCPServer((HOST, PORT), Handler)

# --- Server Thread ---
# Function to run the server
def run_server():
    print(f"Serving directory '{os.path.abspath(DIRECTORY)}' at http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop the server.")
    httpd.serve_forever()

# Start the server in a separate thread
# daemon=True means the thread will exit when the main script exits
server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

# --- Open Browser ---
# Construct the URL
url = f"http://{HOST}:{PORT}"

# Open the URL in the default web browser
print(f"Opening {url} in your default browser...")
webbrowser.open(url)

# Keep the main thread alive until interrupted (e.g., by Ctrl+C)
# This is needed because the server is on a daemon thread
try:
    while True:
        # Keep the main script running while the server thread operates
        # You could add other main thread tasks here if needed
        pass
except KeyboardInterrupt:
    print("\nCtrl+C received. Shutting down server...")
    httpd.shutdown() # Shut down the server gracefully
    httpd.server_close() # Close the server socket
    print("Server stopped.")
