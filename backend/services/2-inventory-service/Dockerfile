# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Dependencies Stage ----
FROM base AS dependencies
RUN npm install --only=production

# ---- Development Stage ----
FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "start:dev"]

# ---- Build Stage ----
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
CMD ["node", "dist/main"] 