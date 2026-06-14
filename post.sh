#!/bin/bash

IMAGE_PATH="mayorista_net.jpeg"
PAYLOAD_FILE="payload_tmp.json"

if [ ! -f "$IMAGE_PATH" ]; then
    echo "Error: No se encontró el archivo '$IMAGE_PATH'."
    exit 1
fi

echo "Generando payload JSON..."

# 1. Armamos el JSON escribiendo directamente en un archivo temporal
echo -n '{"mimeType": "image/jpeg", "imageBase64": "' > "$PAYLOAD_FILE"
# 2. Inyectamos el base64 directamente en el archivo
base64 -w 0 "$IMAGE_PATH" >> "$PAYLOAD_FILE"
# 3. Cerramos el JSON
echo '"}' >> "$PAYLOAD_FILE"

echo "Enviando petición al backend..."

# Usamos el arroba (@) para decirle a curl que lea el body desde el archivo
curl -s -X POST http://localhost:3000/api/v1/invoice \
  -H "Content-Type: application/json" \
  -d @"$PAYLOAD_FILE" | jq .

# Limpiamos el archivo temporal para no dejar basura
rm "$PAYLOAD_FILE"

echo ""
