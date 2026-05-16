<?php

namespace Tests\Unit\Services\Assistant;

use App\Services\Assistant\AssistantToolInputValidator;
use Exception;
use Tests\TestCase;

class AssistantInputValidatorTest extends TestCase
{
    private AssistantToolInputValidator $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = app(AssistantToolInputValidator::class);
    }

    public function test_validates_branch_load_input(): void
    {
        $validated = $this->validator->validate('branch.load', [
            'branch_id' => '123',
        ]);

        $this->assertSame(123, $validated['branch_id']);
        $this->assertIsInt($validated['branch_id']);
    }

    public function test_converts_string_branch_id_to_int(): void
    {
        $validated = $this->validator->validate('branch.load', [
            'branch_id' => '456',
        ]);

        $this->assertSame(456, $validated['branch_id']);
    }

    public function test_uppercases_ticket_code(): void
    {
        $validated = $this->validator->validate('ticket.status', [
            'ticket_code' => 'abc123',
        ]);

        $this->assertSame('ABC123', $validated['ticket_code']);
    }

    public function test_accepts_ticket_id_without_ticket_code(): void
    {
        $validated = $this->validator->validate('ticket.status', [
            'ticket_id' => '42',
        ]);

        $this->assertSame(42, $validated['ticket_id']);
    }

    public function test_rejects_missing_ticket_lookup_field(): void
    {
        $this->expectException(Exception::class);

        $this->validator->validate('ticket.status', []);
    }

    public function test_validates_reports_summary_input(): void
    {
        $validated = $this->validator->validate('reports.summary', [
            'period' => 'daily',
            'branch_id' => '789',
        ]);

        $this->assertSame('daily', $validated['period']);
        $this->assertSame(789, $validated['branch_id']);
    }

    public function test_defaults_reports_period_to_daily(): void
    {
        $validated = $this->validator->validate('reports.summary', []);

        $this->assertSame('daily', $validated['period']);
    }

    public function test_accepts_valid_queue_status_filter(): void
    {
        $validated = $this->validator->validate('queue.status', [
            'status' => 'waiting',
        ]);

        $this->assertSame('waiting', $validated['status']);
    }

    public function test_rejects_invalid_status(): void
    {
        $this->expectException(Exception::class);

        $this->validator->validate('queue.status', [
            'status' => 'invalid_status',
        ]);
    }

    public function test_normalizes_whitespace_in_numeric_input(): void
    {
        $validated = $this->validator->validate('queue.status', [
            'branch_id' => '  123  ',
        ]);

        $this->assertSame(123, $validated['branch_id']);
    }
}
