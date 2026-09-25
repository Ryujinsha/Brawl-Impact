<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameMatchRanking;
use App\Models\WarriorStat;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    /**
     * Get the Hall of Fame / Leaderboard.
     */
    public function index()
    {
        $warriors = WarriorStat::orderBy('matches_won', 'desc')
            ->orderBy('total_damage', 'desc')
            ->limit(15)
            ->get()
            ->map(function ($warrior) {
                $winRate = $warrior->matches_played > 0
                    ? round(($warrior->matches_won / $warrior->matches_played) * 100)
                    : 0;

                return [
                    'id' => $warrior->id,
                    'nickname' => $warrior->nickname,
                    'matches_played' => $warrior->matches_played,
                    'matches_won' => $warrior->matches_won,
                    'win_rate' => $winRate,
                    'total_damage' => $warrior->total_damage,
                    'favorite_character' => $warrior->favorite_character,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $warriors,
        ]);
    }

    /**
     * Get specific warrior details.
     */
    public function player(string $nickname)
    {
        $warrior = WarriorStat::where('nickname', $nickname)->first();

        if (!$warrior) {
            return response()->json([
                'status' => 'error',
                'message' => 'Warrior not found in chronicles',
            ], 404);
        }

        $recentRankings = GameMatchRanking::where('player_nickname', $nickname)
            ->with('match')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'stats' => $warrior,
                'recent_matches' => $recentRankings,
            ],
        ]);
    }
}
