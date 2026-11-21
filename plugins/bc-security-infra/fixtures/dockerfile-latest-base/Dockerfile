FROM node:latest
WORKDIR /app
COPY server.js .
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.js"]
