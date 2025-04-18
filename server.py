from http.server import HTTPServer, SimpleHTTPRequestHandler

class NoCacheHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Set headers to disable caching
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

if __name__ == "__main__":
    server_address = ('', 8000)  # Serve on all interfaces, port 8000
    httpd = HTTPServer(server_address, NoCacheHTTPRequestHandler)
    print("Serving on port 8000...")
    httpd.serve_forever()