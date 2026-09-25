<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarriorStat extends Model
{
    protected $fillable = [
        'nickname',
        'matches_played',
        'matches_won',
        'total_damage',
        'favorite_character',
    ];
}
