# ---- Base Node image ----
FROM node:20-bullseye AS base
WORKDIR /app
COPY package*.json ./

# ---- Development image ----
FROM base AS dev
ENV PORT=3000
RUN npm install --production=false
CMD ["npm", "run", "dev"]

# ---- Build image ----
FROM base AS build
COPY . .
RUN npm install --production=false
RUN npx prisma generate
RUN npm run build

# ---- Production image ----
FROM node:20-bullseye AS prod
WORKDIR /app
ENV PORT=3000
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
RUN npm install --production=true && npm cache clean --force
EXPOSE 3000
CMD ["node", "dist/index.js"]