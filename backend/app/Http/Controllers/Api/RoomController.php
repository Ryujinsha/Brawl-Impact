<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameRoom;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoomController extends Controller
{
    /**
     * List open / waiting rooms.
     */
    public function index()
    {
        $rooms = GameRoom::where('status', 'waiting')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $rooms,
        ]);
    }

    /**
     * Create a new war chamber room.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'host_nickname' => 'required|string|max:50',
            'max_players' => 'nullable|integer|min:2|max:4',
            'code' => 'nullable|string|max:10',
        ]);

        $code = !empty($validated['code'])
            ? strtoupper($validated['code'])
            : strtoupper(Str::random(6));

        $room = GameRoom::updateOrCreate(
            ['code' => $code],
            [
                'host_nickname' => $validated['host_nickname'],
                'status' => 'waiting',
                'max_players' => $validated['max_players'] ?? 4,
                'current_players' => 1,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'War Chamber forged',
            'data' => $room,
        ], 201);
    }

    /**
     * Get specific room information.
     */
    public function show(string $code)
    {
        $room = GameRoom::where('code', strtoupper($code))->first();

        if (!$room) {
            return response()->json([
                'status' => 'error',
                'message' => 'War Chamber not found',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $room,
        ]);
    }

    /**
     * Update room status & player count.
     */
    public function updateStatus(Request $request, string $code)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|in:waiting,playing,finished',
            'current_players' => 'nullable|integer|min:0|max:4',
        ]);

        $room = GameRoom::where('code', strtoupper($code))->first();

        if (!$room) {
            return response()->json([
                'status' => 'error',
                'message' => 'Room not found',
            ], 404);
        }

        $room->update(array_filter($validated, fn($val) => !is_null($val)));

        return response()->json([
            'status' => 'success',
            'data' => $room,
        ]);
    }
}
