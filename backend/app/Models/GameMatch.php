<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameMatch extends Model
{
    protected $fillable = [
        'room_code',
        'winner_nickname',
        'winner_character',
        'player_count',
        'duration_seconds',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function rankings()
    {
        return $this->hasMany(GameMatchRanking::class);
    }
}
