FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port 3000 for Vite dev server
EXPOSE 3000

# Start the development server with host flag to allow external access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 