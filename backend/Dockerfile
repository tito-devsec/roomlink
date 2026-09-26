# RoomLink payment backend — production image
FROM node:20-alpine

# Small, non-root, predictable
ENV NODE_ENV=production
WORKDIR /app

# Install deps first (better layer caching)
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# App source
COPY . .

# Drop root
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 4000

# Basic container healthcheck against the /health route
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

CMD ["node", "server.js"]
