# ---- Base Node image ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false

# ---- Development image ----
FROM base AS dev
ENV PORT=3000
COPY . .
CMD ["npm", "run", "dev"]

# ---- Build image ----
FROM base AS build
COPY . .
RUN npm run build

# ---- Production image ----
FROM node:20-alpine AS prod
WORKDIR /app
ENV PORT=3000
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm install --production=true && npm cache clean --force
EXPOSE 3000
CMD ["node", "dist/index.js"]
