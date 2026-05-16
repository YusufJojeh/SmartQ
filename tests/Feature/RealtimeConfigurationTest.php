<?php

namespace Tests\Feature;

use Tests\TestCase;

class RealtimeConfigurationTest extends TestCase
{
    public function test_reverb_broadcasting_connection_is_configured(): void
    {
        $this->assertArrayHasKey('reverb', config('broadcasting.connections'));
        $this->assertSame('reverb', config('broadcasting.connections.reverb.driver'));
        $this->assertArrayHasKey('reverb', config('reverb.servers'));
    }

    public function test_branch_channels_remain_public_and_payload_guarded_by_event_tests(): void
    {
        $channels = file_get_contents(base_path('routes/channels.php'));

        $this->assertStringContainsString('branch.{id}', $channels);
        $this->assertStringContainsString('PII-free', $channels);
        $this->assertStringNotContainsString("Broadcast::channel('branch.", $channels);
    }
}
