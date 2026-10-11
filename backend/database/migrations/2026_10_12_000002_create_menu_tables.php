<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name_en');
            $table->string('name_it');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_category_id')->constrained()->cascadeOnDelete();
            $table->string('name_en');
            $table->string('name_it');
            $table->text('description_en');
            $table->text('description_it');
            $table->unsignedInteger('price_cents');
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });

        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('number');
            $table->timestamps();

            $table->unique(['restaurant_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_tables');
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('menu_categories');
    }
};
