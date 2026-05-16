FROM node:22-alpine

# Instalar git y bash
RUN apk add --no-cache git bash

WORKDIR /app

# Copiar archivos de configuración primero para aprovechar caché
COPY package*.json ./
COPY astro.config.mjs ./
COPY tsconfig.json ./

# Copiar el resto del código
COPY . .

# Crear un backup del código para poder restaurarlo si el volumen montado está vacío
RUN mkdir /app_backup && cp -r /app/. /app_backup/

# Mover el entrypoint a una ubicación fuera de /app para evitar que sea tapado por volúmenes
RUN cp entrypoint.sh /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

# Exponer puerto de Astro
EXPOSE 80

# Usar el entrypoint desde la ubicación segura
CMD ["/bin/sh", "/usr/local/bin/entrypoint.sh"]
