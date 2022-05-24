# Step 1 - Install dependencies
FROM node:16-alpine AS dependencies
WORKDIR /app
COPY package.json ./
RUN yarn install --frozen-lockfile

# Step 2 - Build the dina-ui project.
FROM node:16-alpine AS builder
WORKDIR /app
COPY ./packages .
COPY --from=dependencies /app/node_modules ./node_modules
RUN yarn build

# Step 3 - Run the nextjs server as PRODUCTION.
FROM node:16-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["yarn", "start"]