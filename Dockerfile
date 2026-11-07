FROM node:22-alpine

WORKDIR /app

# Install production dependencies only.
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Application code.
COPY index.html login.html admin.html ./
COPY server/src ./server/src
COPY server/scripts ./server/scripts
COPY server/.env.example ./server/.env.example

# The audit log lives here — mount a volume to keep it across restarts.
RUN mkdir -p /app/server/data && chown -R node:node /app/server/data
VOLUME ["/app/server/data"]

ENV NODE_ENV=production \
    PORT=3000 \
    FRAME_ANCESTORS="'none'"

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/src/server.js"]
