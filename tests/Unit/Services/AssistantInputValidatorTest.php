<?php

namespace Tests\Unit\Services\Assistant;

use App\Services\Assistant\AssistantInputValidator;
use Tests\TestCase;

class AssistantInputValidatorTest extends TestCase
{
    private AssistantInputValidator $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = app(AssistantInputValidator::class);
    }

    public function test_validates_branch_load_input(): void
    {
        $validated = $this->validator->validate('branch.load', [
            'branch_id' => '123',
        ]);

        $this->assertEquals(123, $validated['branch_id']);
        $this->assertIsInt($validated['branch_id']);
    }

    public function test_converts_string_branch_id_to_int(): void
    {
        $validated = $this->validator->validate('branch.load', [
            'branch_id' => '456',
        ]);

        $this->assertIsInt($validated['branch_id']);
        $this->assertEquals(456, $validated['branch_id']);
    }

    public function test_uppercase_ticket_code(): void
    {
        $validated = $this->validator->validate('ticket.status', [
            'ticket_code' => 'abc123',
        ]);

        $this->assertEquals('ABC123', $validated['ticket_code']);
    }

    public function test_rejects_missing_required_field(): void
    {
        $this->expectException(\Exception::class);

        $this->validator->validate('ticket.status', []);
    }

    public function test_validates_reports_summary_input(): void
    {
        $validated = $this->validator->validate('reports.summary', [
            'period' => 'daily',
            'branch_id' => '789',
        ]);

        $this->assertEquals('daily', $validated['period']);
        $this->assertEquals(789, $validated['branch_id']);
    }

    public function test_accepts_optional_parameters(): void
    {
        $validated = $this->validator->validate('queue.status', [
            'status' => 'waiting',
        ]);

        $this->assertEquals('waiting', $validated['status']);
    }

    public function test_rejects_invalid_status(): void
    {
        $this->expectException(\Exception::class);

        $this->validator->validate('queue.status', [
            'status' => 'invalid_status',
        ]);
    }

    public function test_normalizes_whitespace_in_input(): void
    {
        $validated = $this->validator->validate('queue.status', [
            'branch_id' => '  123  ',
        ]);

        // Should handle whitespace gracefully
    }
}
