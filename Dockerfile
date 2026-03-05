FROM php:8.2-cli

# Install PostgreSQL PDO extension
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo_pgsql

# Set working directory
WORKDIR /var/www/html/Banwa

# Copy your app code
COPY . /var/www/html/Banwa

# Start PHP built-in server on all interfaces
CMD ["php", "-S", "0.0.0.0:8080", "-t", "/var/www/html/Banwa"]