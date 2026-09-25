<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameRoom extends Model
{
    protected $fillable = [
        'code',
        'host_nickname',
        'status',
        'max_players',
        'current_players',
    ];
}
