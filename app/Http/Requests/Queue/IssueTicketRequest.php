<?php

namespace App\Http\Requests\Queue;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IssueTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // public endpoint, rate-limited at route level
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'service_category_id' => [
                'required',
                'integer',
                Rule::exists('service_categories', 'id')->where(function ($query) {
                    $query->where('branch_id', $this->integer('branch_id'));
                }),
            ],
            'customer_name' => ['nullable', 'string', 'max:150'],
            'customer_phone' => ['nullable', 'string', 'max:20', 'regex:/^[+0-9\s\-()]+$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'branch_id.required' => 'Please select a branch.',
            'service_category_id.required' => 'Please select a service.',
            'service_category_id.exists' => 'Please select a service from the chosen branch.',
        ];
    }
}
