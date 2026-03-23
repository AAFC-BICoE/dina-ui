FROM caddy/caddy:2.11.2-builder-alpine
COPY packages/dina-ui/prod.Caddyfile /etc/caddy/Caddyfile
COPY packages/dina-ui/out /www/html
EXPOSE 8080
