ARG NODE_VERSION=22.21.1

# ==============================================================================
# STAGE 1: Development Runtime Image
# ==============================================================================
FROM node:${NODE_VERSION}-alpine AS development

# Install essential OS dependencies
RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache \
    fontconfig \
    git \
    openssh \
    openssl \
    graphicsmagick \
    tini \
    tzdata \
    ca-certificates \
    libc6-compat \
    jq \
    libxml2 \
    python3 \
    make \
    g++

# Install pnpm
RUN npm install -g pnpm@10.22.0

# Install full-icu
RUN npm install -g full-icu@1.5.0

# Set environment variables
ENV NODE_ENV=development
ENV NODE_ICU_DATA=/usr/local/lib/node_modules/full-icu
ENV SHELL=/bin/sh
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Create app directory
WORKDIR /home/node/app

# Copy workspace configuration files first (for better layer caching)
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node tsconfig.json turbo.json ./

# Copy patches and scripts
COPY --chown=node:node patches ./patches
COPY --chown=node:node scripts ./scripts

# Copy packages directory
# Note: node_modules should be excluded by .dockerignore
# If node_modules still cause issues, they will be reinstalled by pnpm install
COPY --chown=node:node packages ./packages

# Ensure proper ownership of the entire app directory
RUN chown -R node:node /home/node/app

# Switch to node user
USER node

# Install dependencies (this will create proper node_modules structure)
# Configure pnpm with increased network timeouts and retries for better reliability
RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000 && \
    pnpm install --frozen-lockfile

# Expose ports
# 5678 - Backend API
# 8080 - Frontend dev server
EXPOSE 5678 8080

# Create entrypoint script in a location that won't be overridden by volume mounts
RUN printf '#!/bin/sh\n\
set -e\n\
\n\
# Function to handle shutdown\n\
cleanup() {\n\
    echo "Shutting down services..."\n\
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true\n\
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true\n\
    exit 0\n\
}\n\
\n\
# Trap signals\n\
trap cleanup SIGTERM SIGINT\n\
\n\
cd /home/node/app\n\
\n\
# Start backend in development mode\n\
echo "Starting backend in development mode on port 5678..."\n\
pnpm dev:be &\n\
BACKEND_PID=$!\n\
\n\
# Wait a bit for backend to initialize\n\
sleep 5\n\
\n\
# Start frontend in development mode\n\
echo "Starting frontend dev server on port 8080..."\n\
pnpm dev:fe:editor &\n\
FRONTEND_PID=$!\n\
\n\
# Wait for both processes\n\
wait $BACKEND_PID $FRONTEND_PID\n' > /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["tini", "--", "/usr/local/bin/docker-entrypoint.sh"]

