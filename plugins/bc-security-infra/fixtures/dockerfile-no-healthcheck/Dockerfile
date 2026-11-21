# bc-security fixture: the digest below is synthetic.
FROM node:20.11.1-alpine3.19@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
WORKDIR /app
COPY server.js .
USER node
EXPOSE 3000
CMD ["node", "server.js"]
