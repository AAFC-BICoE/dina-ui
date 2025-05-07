FROM caddy/caddy:2.8.4-alpine
COPY packages/dina-ui/prod.Caddyfile /etc/caddy/Caddyfile
COPY packages/dina-ui/out /www/html
EXPOSE 8080
