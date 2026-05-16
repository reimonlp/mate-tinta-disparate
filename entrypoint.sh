#!/bin/bash

echo "Starting Mate Tinta Disparate sync loop..."

# Asegurar que Git no se queje por permisos de volumen (safe directory)
git config --global --add safe.directory /app
git config --global --add safe.directory '*'

# Ir al directorio de la app
cd /app

# Verificar si es un repositorio git
if [ ! -d ".git" ]; then
  echo "ERROR: /app no es un repositorio Git o el volumen no se montó correctamente."
  # No salimos para que al menos el servidor intente arrancar si dist existe
else
  echo "Repositorio Git detectado."
fi

# Reinstalar dependencias para asegurar compatibilidad con Alpine (especialmente por sharp)
if [ ! -f "node_modules/.bin/astro" ]; then
  echo "Instalando dependencias (node_modules no encontrado o incompleto)..."
  npm install
else
  echo "node_modules detectado, sincronizando por si hubo cambios..."
  npm install --prefer-offline --no-audit
fi

# Construir el proyecto
echo "Ejecutando build..."
npm run build

if [ ! -f "./dist/server/entry.mjs" ]; then
  echo "ERROR: No se encontró el archivo de entrada en ./dist/server/entry.mjs tras el build."
  ls -R ./dist || echo "Carpeta dist no existe."
  exit 1
fi

# Iniciar el servidor de Node.js en background
echo "Iniciando servidor Node.js..."
HOST=0.0.0.0 PORT=80 node ./dist/server/entry.mjs &
NODE_PID=$!

# Bucle infinito para sincronización con Git
while true; do
  if [ -d ".git" ]; then
    # Actualizar referencias remotas
    git fetch origin main > /dev/null 2>&1
    
    # Comparar commit local con commit remoto
    LOCAL=$(git rev-parse HEAD 2>/dev/null)
    REMOTE=$(git rev-parse origin/main 2>/dev/null)
    
    if [ ! -z "$LOCAL" ] && [ ! -z "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
      echo "Nuevos cambios detectados en GitHub. Sincronizando..."
      git pull origin main
      
      echo "Actualizando dependencias..."
      npm install --prefer-offline --no-audit
      
      echo "Reconstruyendo Astro..."
      npm run build
      
      echo "Reiniciando servidor Node.js..."
      kill $NODE_PID
      sleep 2
      HOST=0.0.0.0 PORT=80 node ./dist/server/entry.mjs &
      NODE_PID=$!
    fi
  fi
  
  sleep 30 # Aumentamos el tiempo de espera para no saturar
done
