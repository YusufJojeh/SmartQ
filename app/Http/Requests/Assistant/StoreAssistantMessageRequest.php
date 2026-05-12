<?php

namespace App\Http\Requests\Assistant;

use Illuminate\Foundation\Http\FormRequest;

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
            'context.session_id' => 'required|string',
            'context.page' => 'array',
        ];
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
