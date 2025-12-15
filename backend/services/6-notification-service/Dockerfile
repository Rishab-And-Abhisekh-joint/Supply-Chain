FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy the config directory for the service account key
COPY src/config ./src/config

COPY . .

EXPOSE 3005

CMD ["npm", "run", "start:dev"] 