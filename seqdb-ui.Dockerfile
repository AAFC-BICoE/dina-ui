# Build step: try to keep this section the same as in dina-ui Dockerfile
# so building multiple images at once re-uses the cached node_modules:
FROM node:14.5.0 as builder
WORKDIR /dina-ui
COPY ./package.json ./
COPY ./tsconfig.common.json ./
COPY ./packages/common-ui/package.json ./packages/common-ui/package.json
COPY ./packages/dina-ui/package.json ./packages/dina-ui/package.json
COPY ./packages/seqdb-ui/package.json ./packages/seqdb-ui/package.json
COPY ./yarn.lock ./
RUN yarn
COPY ./packages/ ./packages/

# seqdb-ui step:
RUN yarn --cwd=./packages/seqdb-ui build

FROM caddy/caddy:2.0.0-alpine
COPY --from=builder /dina-ui/packages/seqdb-ui/prod.Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /dina-ui/packages/seqdb-ui/out /www/html
EXPOSE 8080
