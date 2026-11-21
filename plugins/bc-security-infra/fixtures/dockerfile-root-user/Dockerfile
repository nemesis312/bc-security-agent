# bc-security fixture: the digest below is synthetic (repeated pattern), not a real image.
FROM node:20.11.1-alpine3.19@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
WORKDIR /app
COPY server.js .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.js"]
