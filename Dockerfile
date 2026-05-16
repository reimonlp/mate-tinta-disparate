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

# Mover el entrypoint a una ubicación fuera de /app para evitar que sea tapado por volúmenes
RUN cp entrypoint.sh /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

# Exponer puerto de Astro
EXPOSE 80

# Usar el entrypoint desde la ubicación segura
CMD ["/bin/sh", "/usr/local/bin/entrypoint.sh"]
