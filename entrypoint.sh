#!/bin/sh

# Manejo de señales para un apagado limpio
trap "echo 'Apagando servidor...'; kill \$NODE_PID; exit" SIGTERM SIGINT

echo "--- MATE TINTA DISPARATE DIAGNOSTIC ---"
echo "User: $(whoami) (UID: $(id -u))"
echo "Dir: $(pwd)"
echo "---------------------------------------"

# Configuración global de Git para evitar problemas de permisos
git config --global --add safe.directory /app
git config --global --add safe.directory '*'

# Sistema de auto-recuperación si el volumen oculta los archivos
if [ ! -f "package.json" ]; then
  echo "AVISO: package.json no encontrado. Restaurando desde backup..."
  cp -r /app_backup/. /app/
fi

# Sincronizar node_modules si es necesario (evita conflictos de arquitectura)
if [ ! -d "node_modules/.bin" ]; then
  echo "Sincronizando dependencias..."
  npm install --prefer-offline --no-audit
fi

# Construir solo si no existe el build previo
if [ ! -f "./dist/server/entry.mjs" ]; then
  echo "Build inicial no detectado, construyendo..."
  npm run build
fi

# Función para iniciar el servidor
start_server() {
  echo "Iniciando servidor Node.js en puerto 80..."
  HOST=0.0.0.0 PORT=80 node ./dist/server/entry.mjs &
  NODE_PID=$!
}

start_server

# Loop de sincronización con Git
while true; do
  if [ -d ".git" ]; then
    # Silencioso, solo fetch
    git fetch origin main > /dev/null 2>&1
    
    LOCAL=$(git rev-parse HEAD 2>/dev/null)
    REMOTE=$(git rev-parse origin/main 2>/dev/null)
    
    if [ ! -z "$LOCAL" ] && [ ! -z "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
      echo "--- CAMBIOS EN GITHUB DETECTADOS ---"
      git pull origin main
      
      echo "Actualizando y reconstruyendo..."
      npm install --prefer-offline --no-audit
      npm run build
      
      echo "Reiniciando servidor para aplicar cambios..."
      kill $NODE_PID
      wait $NODE_PID 2>/dev/null
      start_server
    fi
  fi
  
  # Esperar en background para permitir el trap de señales
  sleep 60 & 
  wait $!
done
