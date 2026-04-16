<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Counter;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $mainBranch = Branch::where('code', 'BR-001')->first();
        $northBranch = Branch::where('code', 'BR-002')->first();
        $jeddahBranch = Branch::where('code', 'BR-003')->first();

        // Super Admin
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@smartq.test',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $superAdmin->assignRole('super_admin');

        // Managers
        $manager1 = User::create([
            'name' => 'Ahmed Al-Mansouri',
            'email' => 'manager@smartq.test',
            'password' => Hash::make('password'),
            'branch_id' => $mainBranch?->id,
            'is_active' => true,
        ]);
        $manager1->assignRole('manager');

        $manager2 = User::create([
            'name' => 'Sara Al-Otaibi',
            'email' => 'manager2@smartq.test',
            'password' => Hash::make('password'),
            'branch_id' => $northBranch?->id,
            'is_active' => true,
        ]);
        $manager2->assignRole('manager');

        // Tellers for main branch
        $counters = Counter::where('branch_id', $mainBranch?->id)->get();

        $tellers = [
            ['name' => 'Khalid Hassan', 'email' => 'teller@smartq.test'],
            ['name' => 'Fatima Al-Zahra', 'email' => 'teller2@smartq.test'],
            ['name' => 'Omar Nasser', 'email' => 'teller3@smartq.test'],
        ];

        foreach ($tellers as $index => $tellerData) {
            $counter = $counters->get($index);
            $teller = User::create([
                'name' => $tellerData['name'],
                'email' => $tellerData['email'],
                'password' => Hash::make('password'),
                'branch_id' => $mainBranch?->id,
                'counter_id' => $counter?->id,
                'is_active' => true,
            ]);
            $teller->assignRole('teller');
        }

        // Tellers for Jeddah
        $jeddahCounters = Counter::where('branch_id', $jeddahBranch?->id)->get();
        $jeddahTeller = User::create([
            'name' => 'Noura Al-Rashidi',
            'email' => 'teller.jeddah@smartq.test',
            'password' => Hash::make('password'),
            'branch_id' => $jeddahBranch?->id,
            'counter_id' => $jeddahCounters->first()?->id,
            'is_active' => true,
        ]);
        $jeddahTeller->assignRole('teller');
    }
}
