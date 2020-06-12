# Build step: try to keep this section the same as in seqdb-ui.Dockerfile
# so building multiple images at once re-uses the cached node_modules:
FROM node:12.16.3 as builder
WORKDIR /dina-ui
COPY ./package.json ./
COPY ./packages/common-ui/package.json ./packages/common-ui/package.json
COPY ./packages/objectstore-ui/package.json ./packages/objectstore-ui/package.json
COPY ./packages/seqdb-ui/package.json ./packages/seqdb-ui/package.json
COPY ./yarn.lock ./
RUN yarn
COPY ./ ./

# objectstore-ui step:
RUN yarn --cwd=/dina-ui/packages/objectstore-ui build

FROM caddy/caddy:2.0.0-rc.3
COPY --from=builder /dina-ui/packages/objectstore-ui/prod.Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /dina-ui/packages/objectstore-ui/out /www/html
EXPOSE 80
