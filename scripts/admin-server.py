#!/usr/bin/env python3
"""
scripts/admin-server.py — Servidor local para el panel de administración.

QUÉ HACE: sirve los archivos estáticos del sitio (igual que
"python3 -m http.server") y además atiende dos rutas especiales que permiten
al panel (admin.html) guardar cambios directamente en el disco: actualizar
js/data/projects.js y subir imágenes nuevas a assets/img/.

QUÉ NO HACE: no publica nada en internet. Solo escucha en 127.0.0.1 (tu
propio ordenador) — ningún otro dispositivo de tu red puede alcanzarlo.

SEGURIDAD: las dos rutas que escriben en disco exigen el hash SHA-256 de la
frase de paso del panel (el mismo valor que PASSPHRASE_HASH en
js/admin/auth.js). Sin ese hash exacto, el servidor rechaza la petición con
un 401, antes de tocar cualquier archivo.
"""

import base64
import http.server
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 4180

# Tiene que coincidir EXACTAMENTE con PASSPHRASE_HASH en js/admin/auth.js.
# Es un hash, no la frase de paso en sí: no hay ningún secreto en texto claro
# en este archivo.
PASSPHRASE_HASH = "602130f7df2dffe5649ba6f4eaa3d3f498bec68f22cd19e72a641410f3e7d782"

PROJECTS_FILE = os.path.join(ROOT, "js", "data", "projects.js")
IMG_DIR = os.path.join(ROOT, "assets", "img")

# Solo minúsculas, números y guiones antes de la extensión: descarta
# cualquier intento de path traversal (../, rutas absolutas, etc.) de raíz,
# sin necesidad de parsear rutas.
SAFE_IMAGE_NAME = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*\.(png|jpe?g|webp|gif)$")

MAX_BODY_BYTES = 5_000_000
MAX_IMAGE_BYTES = 1_000_000


class AdminHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def end_headers(self):
        # Es una herramienta de desarrollo local: siempre interesa el
        # archivo tal como está en disco ahora mismo, nunca una copia vieja
        # guardada en caché por el navegador (Safari es especialmente
        # agresivo cacheando CSS/JS servidos sin esta cabecera).
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0 or length > MAX_BODY_BYTES:
            raise ValueError("Cuerpo de la petición vacío o demasiado grande.")
        raw = self.rfile.read(length)
        return json.loads(raw)

    def _check_passphrase(self, data):
        if data.get("passphraseHash") != PASSPHRASE_HASH:
            raise PermissionError("Frase de paso incorrecta.")

    def do_POST(self):
        try:
            if self.path == "/__admin/save-projects":
                self._handle_save_projects()
            elif self.path == "/__admin/upload-image":
                self._handle_upload_image()
            else:
                self._send_json(404, {"error": "Ruta no encontrada."})
        except PermissionError as error:
            self._send_json(401, {"error": str(error)})
        except ValueError as error:
            self._send_json(400, {"error": str(error)})
        except Exception as error:  # se informa al panel, nunca se oculta
            self._send_json(500, {"error": f"Error del servidor: {error}"})

    def _handle_save_projects(self):
        data = self._read_json_body()
        self._check_passphrase(data)
        content = data.get("content", "")
        if "ANCLA-ADMIN" not in content:
            raise ValueError(
                "El contenido nuevo no incluye la línea ANCLA-ADMIN; me niego "
                "a guardarlo para no perder el punto de inserción."
            )
        with open(PROJECTS_FILE, "w", encoding="utf-8") as f:
            f.write(content)
        self._send_json(200, {"ok": True})

    def _handle_upload_image(self):
        data = self._read_json_body()
        self._check_passphrase(data)
        filename = os.path.basename(data.get("filename", ""))
        if not SAFE_IMAGE_NAME.match(filename):
            raise ValueError(f"Nombre de archivo de imagen no válido: {filename}")
        raw_bytes = base64.b64decode(data.get("base64", ""), validate=True)
        if len(raw_bytes) > MAX_IMAGE_BYTES:
            raise ValueError("La imagen pesa más de 1 MB.")
        os.makedirs(IMG_DIR, exist_ok=True)
        target = os.path.join(IMG_DIR, filename)
        with open(target, "wb") as f:
            f.write(raw_bytes)
        self._send_json(200, {"ok": True, "path": f"assets/img/{filename}"})


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), AdminHandler)
    print(f"Panel de administración: http://localhost:{PORT}/admin.html")
    print(f"Web normal:              http://localhost:{PORT}/")
    print(f"Sirviendo desde:         {ROOT}")
    print("Solo accesible desde este ordenador (127.0.0.1). Ctrl+C para parar.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
