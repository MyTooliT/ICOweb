# ===========================
# Stage 1: Build
# ===========================
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false
RUN npm ci --include=dev
RUN npm i -g vite

COPY . .

ARG VITE_APPLICATION_PORT
ENV VITE_APPLICATION_PORT=${VITE_APPLICATION_PORT}

RUN vite build


# ===========================
# Stage 2: Serve with Nginx
# ===========================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE ${VITE_APPLICATION_PORT}

CMD ["sh", "-c", "envsubst '$VITE_APPLICATION_PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
