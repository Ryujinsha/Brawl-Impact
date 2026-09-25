<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameMatch;
use App\Models\GameMatchRanking;
use App\Models\GameRoom;
use App\Models\WarriorStat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MatchController extends Controller
{
    /**
     * Record match start.
     */
    public function start(Request $request)
    {
        $validated = $request->validate([
            'room_code' => 'required|string',
            'player_count' => 'nullable|integer',
        ]);

        $match = GameMatch::create([
            'room_code' => strtoupper($validated['room_code']),
            'player_count' => $validated['player_count'] ?? 2,
            'started_at' => now(),
        ]);

        // Update room status
        GameRoom::where('code', strtoupper($validated['room_code']))
            ->update(['status' => 'playing']);

        return response()->json([
            'status' => 'success',
            'message' => 'Battle commenced',
            'data' => $match,
        ], 201);
    }

    /**
     * Record match conclusion, player rankings, and update warrior stats.
     */
    public function finish(Request $request)
    {
        $validated = $request->validate([
            'room_code' => 'required|string',
            'winner_nickname' => 'nullable|string',
            'winner_character' => 'nullable|string',
            'duration_seconds' => 'nullable|integer',
            'rankings' => 'required|array',
            'rankings.*.player_nickname' => 'required|string',
            'rankings.*.character' => 'required|string',
            'rankings.*.placement' => 'required|integer',
            'rankings.*.damage_dealt' => 'nullable|integer',
            'rankings.*.eliminated_by' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $match = GameMatch::create([
                'room_code' => strtoupper($validated['room_code']),
                'winner_nickname' => $validated['winner_nickname'] ?? null,
                'winner_character' => $validated['winner_character'] ?? null,
                'player_count' => count($validated['rankings']),
                'duration_seconds' => $validated['duration_seconds'] ?? 0,
                'ended_at' => now(),
            ]);

            foreach ($validated['rankings'] as $r) {
                GameMatchRanking::create([
                    'game_match_id' => $match->id,
                    'player_nickname' => $r['player_nickname'],
                    'character' => $r['character'],
                    'placement' => $r['placement'],
                    'damage_dealt' => $r['damage_dealt'] ?? 0,
                    'eliminated_by' => $r['eliminated_by'] ?? null,
                ]);

                // Update or create warrior stats for Hall of Fame
                $stat = WarriorStat::firstOrNew(['nickname' => $r['player_nickname']]);
                $stat->matches_played = ($stat->matches_played ?? 0) + 1;
                if ($r['placement'] === 1) {
                    $stat->matches_won = ($stat->matches_won ?? 0) + 1;
                }
                $stat->total_damage = ($stat->total_damage ?? 0) + ($r['damage_dealt'] ?? 0);
                $stat->favorite_character = $r['character'];
                $stat->save();
            }

            // Update room status
            GameRoom::where('code', strtoupper($validated['room_code']))
                ->update(['status' => 'finished']);

            $match->load('rankings');

            return response()->json([
                'status' => 'success',
                'message' => 'Battle concluded and chronicles recorded',
                'data' => $match,
            ]);
        });
    }

    /**
     * Get recent match history.
     */
    public function history()
    {
        $matches = GameMatch::with('rankings')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $matches,
        ]);
    }
}
