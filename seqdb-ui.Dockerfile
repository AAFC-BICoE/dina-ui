# Build step: try to keep this section the same as in dina-ui Dockerfile
# so building multiple images at once re-uses the cached node_modules:
FROM node:12.16.3 as builder
WORKDIR /dina-ui
COPY ./package.json ./
COPY ./packages/common-ui/package.json ./packages/common-ui/package.json
COPY ./packages/dina-ui/package.json ./packages/dina-ui/package.json
COPY ./packages/seqdb-ui/package.json ./packages/seqdb-ui/package.json
COPY ./yarn.lock ./
RUN yarn
COPY ./ ./

# seqdb-ui step:
RUN yarn --cwd=/dina-ui/packages/seqdb-ui build

FROM caddy/caddy:2.0.0-rc.3
COPY --from=builder /dina-ui/packages/seqdb-ui/prod.Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /dina-ui/packages/seqdb-ui/out /www/html
EXPOSE 80
