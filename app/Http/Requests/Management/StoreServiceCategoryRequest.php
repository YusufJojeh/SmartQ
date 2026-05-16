<?php

namespace App\Http\Requests\Management;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('service_categories', 'code')->where(fn ($query) => $query->where('branch_id', $this->integer('branch_id'))),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'prefix' => ['required', 'string', 'max:3'],
            'priority_level' => ['required', 'integer', 'between:1,10'],
            'estimated_service_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
