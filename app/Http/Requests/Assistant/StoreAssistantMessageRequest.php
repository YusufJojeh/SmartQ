<?php

namespace App\Http\Requests\Assistant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAssistantMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => 'required|string|min:1|max:5000',
            'context' => 'required|array',
            'context.scope' => 'required|in:public,operations',
            'context.session_id' => 'required|string|max:100',
            'context.url' => 'nullable|string|max:255',
            'context.route' => 'nullable|string|max:150',
            'context.locale' => 'nullable|in:en,ar',
            'context.page' => 'nullable|array|max:8',
            'context.page.component' => 'nullable|string|max:150',
            'context.page.route' => 'nullable|string|max:150',
            'context.page.scope' => 'nullable|in:public,operations',
            'context.page.branch' => 'nullable|array|max:4',
            'context.page.branch.id' => 'nullable|integer',
            'context.page.branch.name' => 'nullable|string|max:150',
            'context.page.branch.code' => 'nullable|string|max:50',
            'context.page.ticket' => 'nullable|array|max:8',
            'context.page.ticket.id' => 'nullable|integer',
            'context.page.ticket.display_code' => 'nullable|string|max:50',
            'context.page.ticket.status' => 'nullable|string|max:50',
            'context.page.ticket.position' => 'nullable|integer|min:0',
            'context.page.ticket.waiting_count' => 'nullable|integer|min:0',
            'context.page.ticket.counter_name' => 'nullable|string|max:150',
            'context.page.ticket.service_name' => 'nullable|string|max:150',
            'context.page.filters' => 'nullable|array|max:6',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $pageContext = $this->input('context.page');

            if (! is_array($pageContext)) {
                return;
            }

            $json = json_encode($pageContext);

            if ($json === false || strlen($json) > 2000) {
                $validator->errors()->add('context.page', 'Page context is too large.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'message.required' => 'Please enter a message.',
            'message.max' => 'Message is too long (max 5000 characters).',
            'context.required' => 'Context is required.',
            'context.scope.required' => 'Scope is required.',
            'context.scope.in' => 'Invalid scope.',
            'context.session_id.required' => 'Session ID is required.',
        ];
    }
}
