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
        Schema::create('game_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->index();
            $table->string('host_nickname');
            $table->string('status')->default('waiting'); // waiting, playing, finished
            $table->unsignedTinyInteger('max_players')->default(4);
            $table->unsignedTinyInteger('current_players')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_rooms');
    }
};
