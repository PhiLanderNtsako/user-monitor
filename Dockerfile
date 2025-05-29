FROM node:24-alpine3.20
WORKDIR /app
COPY . /app
RUN npm install
HEALTHCHECK --interval=12s --timeout=12s --start-period=30s CMD curl --fail http://localhost:3000/ || exit 1
EXPOSE 3000
CMD ["npm","run","dev"]
