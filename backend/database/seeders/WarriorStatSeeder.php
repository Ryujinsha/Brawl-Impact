<?php

namespace Database\Seeders;

use App\Models\WarriorStat;
use Illuminate\Database\Seeder;

class WarriorStatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $warriors = [
            [
                'nickname' => 'Sir Lancelot',
                'matches_played' => 14,
                'matches_won' => 11,
                'total_damage' => 2420,
                'favorite_character' => 'KNIGHT',
            ],
            [
                'nickname' => 'Morgana Arcana',
                'matches_played' => 12,
                'matches_won' => 9,
                'total_damage' => 1950,
                'favorite_character' => 'MAGE',
            ],
            [
                'nickname' => 'Shadowblade',
                'matches_played' => 10,
                'matches_won' => 7,
                'total_damage' => 1420,
                'favorite_character' => 'ASSASSIN',
            ],
            [
                'nickname' => 'Ironclad Thorin',
                'matches_played' => 8,
                'matches_won' => 5,
                'total_damage' => 1180,
                'favorite_character' => 'FIGHTER',
            ],
        ];

        foreach ($warriors as $w) {
            WarriorStat::updateOrCreate(
                ['nickname' => $w['nickname']],
                $w
            );
        }
    }
}
