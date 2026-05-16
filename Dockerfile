FROM node:22-alpine

# Instalar git y bash (necesarios para el sync loop)
RUN apk add --no-cache git bash

WORKDIR /app

# Crear directorios y dar permisos
RUN mkdir -p /app/node_modules /app/dist /app/.astro && \
    chown -R node:node /app

# Cambiar al usuario 'node'
USER node

# Copiar archivos de configuración
COPY --chown=node:node package*.json ./
COPY --chown=node:node astro.config.mjs ./
COPY --chown=node:node tsconfig.json ./

# Instalar dependencias
RUN npm install --no-audit

# Copiar el resto del código
COPY --chown=node:node . .

# Build inicial
RUN npm run build

# El script de entrada se ejecuta directamente desde la app
CMD ["/bin/sh", "entrypoint.sh"]
