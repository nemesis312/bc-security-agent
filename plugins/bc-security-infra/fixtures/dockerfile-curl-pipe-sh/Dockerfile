# bc-security fixture: the digest below is synthetic.
FROM node:20.11.1-alpine3.19@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
RUN apk add --no-cache curl \
 && curl -fsSL https://tools.example.com/install.sh | sh
WORKDIR /app
COPY server.js .
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.js"]
