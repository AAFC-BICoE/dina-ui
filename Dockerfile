FROM node:12
WORKDIR /app
COPY ./package*.json ./
COPY ./scripts ./scripts
RUN npm install --unsafe-perm
COPY ./ ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
