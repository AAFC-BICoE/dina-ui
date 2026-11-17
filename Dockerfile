FROM caddy/caddy:2.11.7-alpine
COPY packages/dina-ui/prod.Caddyfile /etc/caddy/Caddyfile
COPY packages/dina-ui/out /www/html
EXPOSE 8080
