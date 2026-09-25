<?php

use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\RoomController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Brawl Impact - API Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'Brawl Impact Laravel API',
        'realm' => 'Medieval Arena Server',
        'timestamp' => now()->toISOString(),
    ]);
});

// Rooms & War Chambers
Route::get('/rooms', [RoomController::class, 'index']);
Route::post('/rooms', [RoomController::class, 'store']);
Route::get('/rooms/{code}', [RoomController::class, 'show']);
Route::patch('/rooms/{code}/status', [RoomController::class, 'updateStatus']);

// Matches & Battle Chronicles
Route::post('/matches/start', [MatchController::class, 'start']);
Route::post('/matches/finish', [MatchController::class, 'finish']);
Route::get('/matches/history', [MatchController::class, 'history']);

// Hall of Fame & Leaderboard
Route::get('/leaderboard', [LeaderboardController::class, 'index']);
Route::get('/leaderboard/{nickname}', [LeaderboardController::class, 'player']);
