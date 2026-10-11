<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('default_locale', 2)->default('en');
            $table->string('currency', 3)->default('EUR');
            $table->text('description_en');
            $table->text('description_it');
            $table->timestamps();
        });

        // Demo staff accounts belong to exactly one restaurant.
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->nullable()->constrained()->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('restaurant_id');
        });
        Schema::dropIfExists('restaurants');
    }
};
