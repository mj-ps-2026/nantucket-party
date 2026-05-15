# Dockerfile

FROM node:18

# Create directory structure
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Expose port for web traffic
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]