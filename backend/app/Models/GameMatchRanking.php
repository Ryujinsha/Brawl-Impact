<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameMatchRanking extends Model
{
    protected $fillable = [
        'game_match_id',
        'player_nickname',
        'character',
        'placement',
        'damage_dealt',
        'eliminated_by',
    ];

    public function match()
    {
        return $this->belongsTo(GameMatch::class, 'game_match_id');
    }
}
