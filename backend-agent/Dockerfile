# Build from repo root:
#   docker build -f backend-agent/Dockerfile -t travelos-backend .
#
# ---- build stage ----
FROM node:22-alpine AS builder

WORKDIR /repo

# Build SDK first
COPY sdk/package*.json ./sdk/
RUN cd sdk && npm ci

COPY sdk ./sdk
RUN cd sdk && npm run build

# Build backend
COPY backend-agent/package*.json ./backend-agent/
RUN cd backend-agent && npm ci

# Install SDK into backend as a local dependency
RUN cd backend-agent && npm install /repo/sdk

COPY backend-agent/tsconfig.json ./backend-agent/
COPY backend-agent/src ./backend-agent/src

RUN cd backend-agent && npm run build

# ---- runtime stage ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /repo/sdk /sdk

COPY backend-agent/package*.json ./
RUN npm ci --omit=dev && npm install /sdk

COPY --from=builder /repo/backend-agent/dist ./dist

EXPOSE 3001

CMD ["node", "dist/api/server.js"]
