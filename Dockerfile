# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Setting this will make react build to /app/build and use /api for backend calls
ENV REACT_APP_API_URL=/api
RUN npm run build

# Stage 2: Setup Node Backend
FROM node:18-alpine
WORKDIR /app

# Copy backend configuration and install dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# Copy compiled React frontend from Stage 1 into /app/build
# (our server.js expects it at ../build relative to /app/backend)
WORKDIR /app
COPY --from=frontend-build /app/build ./build

# Start the Node Express Server
WORKDIR /app/backend
EXPOSE 5001
CMD ["node", "server.js"]
