# This file was copied and modified from the official Next.js Docker example:
# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
FROM node:16-alpine

WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Automatically leverage output traces to reduce image size 
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --chown=nextjs:nodejs ./packages/dina-ui/.next/standalone ./
COPY --chown=nextjs:nodejs ./packages/dina-ui/.next/static ./packages/dina-ui/.next/static

COPY ./packages/dina-ui/next.config.js ./packages/dina-ui/next.config.js
COPY ./packages/dina-ui/static ./packages/dina-ui/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "packages/dina-ui/server.js"]
