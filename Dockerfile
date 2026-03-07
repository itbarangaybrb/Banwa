FROM php:8.2-apache

# Install dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN a2enmod rewrite
WORKDIR /var/www/html

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy ONLY dependency files first for better caching
COPY composer.json composer.lock ./

# Install dependencies (without scripts to avoid issues with missing source code)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy the rest of the application
COPY . .

# Finish composer optimization
RUN composer dump-autoload --optimize --no-dev

RUN chown -R www-data:www-data /var/www/html