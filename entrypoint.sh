#!/bin/sh

# Manejo de señales
trap "echo 'Apagando servidor...'; kill \$NODE_PID; exit" SIGTERM SIGINT

echo "--- MATE TINTA DISPARATE PRODUCTION START ---"
echo "User: $(whoami) (UID: $(id -u))"
echo "Dir: $(pwd)"
echo "---------------------------------------------"

# Configuración global de Git
git config --global --add safe.directory /app
git config --global user.email "bot@disparate.com.ar"
git config --global user.name "MTyD Bot"

# Si hay un token, re-configurar el remote para que sea automático
if [ ! -z "$GITHUB_TOKEN" ]; then
  echo "Configurando acceso autenticado a GitHub..."
  git remote set-url origin "https://${GITHUB_TOKEN}@github.com/reimonlp/mate.tinta.disparate.git"
fi

# Función para iniciar el servidor
start_server() {
  echo "Iniciando servidor Node.js en puerto 80..."
  HOST=0.0.0.0 PORT=80 node ./dist/server/entry.mjs &
  NODE_PID=$!
}

# Función para realizar el update
do_update() {
  echo "--- ACTUALIZANDO DESDE GITHUB ---"
  git pull origin main
  npm install --prefer-offline --no-audit
  npm run build
  echo "Reiniciando servidor..."
  kill $NODE_PID
  wait $NODE_PID 2>/dev/null
  start_server
  rm -f .git-update-trigger
}

# El build ya ocurrió en el Dockerfile, así que arrancamos directo
start_server

# Loop de sincronización
while true; do
  if [ -f ".git-update-trigger" ]; then
    do_update
  fi

  # Polling de seguridad cada 5 min
  git fetch origin main > /dev/null 2>&1
  LOCAL=$(git rev-parse HEAD 2>/dev/null)
  REMOTE=$(git rev-parse origin/main 2>/dev/null)
  
  if [ ! -z "$LOCAL" ] && [ ! -z "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
    echo "Sincronizando cambios detectados por polling..."
    do_update
  fi
  
  sleep 30 & 
  wait $!
done
