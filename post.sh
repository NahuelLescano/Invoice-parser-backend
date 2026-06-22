#!/bin/bash

if [ "$#" -eq 0 ]; then
    echo "❌ Uso: $0 <imagen1> [imagen2] [imagen3] ..."
    echo "Ejemplo: $0 quilmes.jpeg dba.png"
    exit 1
fi

echo "🔄 Preparando facturas..."

PAYLOAD_FILE=$(mktemp)
echo '{"invoices": [' > "$PAYLOAD_FILE"

FIRST_ITEM=1

for FILE in "$@"; do
    if [ ! -f "$FILE" ]; then
        echo "⚠️ Archivo no encontrado: $FILE (Omitiendo...)"
        continue
    fi

    MIME_TYPE=$(file -b --mime-type "$FILE")
    
    BASE64_DATA=$(base64 -w 0 "$FILE")

    if [ $FIRST_ITEM -eq 0 ]; then
        echo ',' >> "$PAYLOAD_FILE"
    fi
    FIRST_ITEM=0

    echo "  {" >> "$PAYLOAD_FILE"
    echo "    \"mimeType\": \"$MIME_TYPE\"," >> "$PAYLOAD_FILE"
    echo "    \"imageBase64\": \"$BASE64_DATA\"" >> "$PAYLOAD_FILE"
    echo "  }" >> "$PAYLOAD_FILE"
    
    echo "✅ Procesado localmente: $FILE ($MIME_TYPE)"
done

echo "]}" >> "$PAYLOAD_FILE"

echo "🚀 Enviando lote al servidor..."
echo "---------------------------------------------------"

curl -sX POST http://localhost:3000/api/v1/invoice \
    -H "Content-Type: application/json" \
    -d "@$PAYLOAD_FILE" | jq .

rm "$PAYLOAD_FILE"

echo ""
echo "---------------------------------------------------"
echo "🏁 Finalizado."
