# Build from backend-agent/ folder (build context = backend-agent/)
#   flyctl deploy   OR   docker build -t travelos-backend .
#
# ---- build stage ----
FROM node:22-alpine AS builder

WORKDIR /repo

# Build SDK
COPY sdk/package*.json ./sdk/
RUN cd sdk && npm ci

COPY sdk ./sdk
RUN cd sdk && npm run build

# Build backend
COPY package*.json ./
RUN npm ci

# Install SDK as local dependency
RUN npm install /repo/sdk

COPY tsconfig.json .
COPY src ./src

RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /repo/sdk /sdk

COPY package*.json ./
RUN npm ci --omit=dev && npm install /sdk

COPY --from=builder /repo/dist ./dist

EXPOSE 3001

CMD ["node", "dist/api/server.js"]
