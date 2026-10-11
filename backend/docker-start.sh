#!/bin/sh
# Demo deployment: the SQLite file lives inside the container, so every boot rebuilds and reseeds it.
# ponytail: use a managed database (and plain `migrate`) once real data must survive restarts.
set -e
export APP_KEY="${APP_KEY:-$(php artisan key:generate --show)}"
touch database/database.sqlite
php artisan migrate:fresh --seed --force
export PHP_CLI_SERVER_WORKERS=4
cd public
exec php -S "0.0.0.0:${PORT:-10000}" -t . ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
