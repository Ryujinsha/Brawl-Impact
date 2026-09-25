<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('warrior_stats', function (Blueprint $table) {
            $table->id();
            $table->string('nickname')->unique()->index();
            $table->unsignedInteger('matches_played')->default(0);
            $table->unsignedInteger('matches_won')->default(0);
            $table->unsignedBigInteger('total_damage')->default(0);
            $table->string('favorite_character')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warrior_stats');
    }
};
