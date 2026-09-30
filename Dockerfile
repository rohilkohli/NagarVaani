FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev \
    && node -e "require('@google-cloud/firestore'); require('@google-cloud/storage'); console.log('firebase deps ok')"
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
EXPOSE 8080
CMD ["node", "dist/server.cjs"]