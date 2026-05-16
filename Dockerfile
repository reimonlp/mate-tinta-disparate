FROM node:22-alpine

# Instalar git y bash (necesarios para el sync loop)
RUN apk add --no-cache git bash

WORKDIR /app

# Crear directorios y dar permisos al usuario 'node'
RUN mkdir -p /app/node_modules /app/dist /app/.astro /app_backup && \
    chown -R node:node /app /app_backup

# Cambiar al usuario 'node' para mayor seguridad
USER node

# Copiar archivos de configuración
COPY --chown=node:node package*.json ./
COPY --chown=node:node astro.config.mjs ./
COPY --chown=node:node tsconfig.json ./

# Instalar dependencias en el build para aprovechar caché de Docker
RUN npm install --no-audit

# Copiar el resto del código
COPY --chown=node:node . .

# Crear backup del código base
RUN cp -r /app/. /app_backup/

# Preparar el build inicial
RUN npm run build

# Volver a root solo para mover el script a una ubicación segura, luego el script manejará el resto
USER root
RUN cp entrypoint.sh /usr/local/bin/entrypoint.sh && \
    chmod +x /usr/local/bin/entrypoint.sh && \
    chown node:node /usr/local/bin/entrypoint.sh

USER node

# Exponer puerto de Astro
EXPOSE 80

# Usar el entrypoint desde la ubicación segura
CMD ["/bin/sh", "/usr/local/bin/entrypoint.sh"]
