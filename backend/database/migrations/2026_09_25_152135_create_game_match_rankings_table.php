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
        Schema::create('game_match_rankings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_match_id')->constrained('game_matches')->cascadeOnDelete();
            $table->string('player_nickname');
            $table->string('character');
            $table->unsignedTinyInteger('placement');
            $table->unsignedInteger('damage_dealt')->default(0);
            $table->string('eliminated_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_match_rankings');
    }
};
