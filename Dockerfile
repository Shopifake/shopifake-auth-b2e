# ---- Base Node image ----
# Using Node 22 to satisfy package requirements and eliminate the EBADENGINE warning
FROM node:22-bullseye AS base
WORKDIR /app
# Copy only manifest files first for efficient caching
COPY package*.json ./

# ---- Development image ----
FROM base AS dev
ENV PORT=3000
# Install dev and production dependencies
RUN npm install
# Command to start the application in development mode
CMD ["npm", "run", "dev"]

# ---- Build image ----
FROM base AS build
# Copy configuration and source files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY eslint.config.js ./

# 1. Install all dependencies
RUN npm install

# 2. IMPORTANT FIX: Generate the Prisma Client *before* running the TypeScript compiler (npm run build)
RUN npx prisma generate

# 3. Run linting and the final TypeScript build
RUN npm run lint
RUN npm run build

# ---- Production image ----
FROM node:22-bullseye AS prod
WORKDIR /app
ENV PORT=3000
# Copy built files and production dependencies from the 'build' stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
# Clean up cache after installing only production dependencies (optional step for cleaner image)
RUN npm install --production=true && npm cache clean --force
EXPOSE 3000
# Command to run the compiled application
CMD ["node", "dist/index.js"]