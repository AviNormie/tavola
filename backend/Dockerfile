FROM php:8.4-cli

RUN apt-get update && apt-get install -y --no-install-recommends unzip git \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist

COPY . .
RUN composer dump-autoload --optimize --no-dev && php artisan package:discover

CMD ["./docker-start.sh"]
