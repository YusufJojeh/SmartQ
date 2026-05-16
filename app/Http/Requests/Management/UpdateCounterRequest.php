<?php

namespace App\Http\Requests\Management;

use App\Models\Counter;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCounterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Counter $counter */
        $counter = $this->route('counter');

        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('counters', 'code')
                    ->where(fn ($query) => $query->where('branch_id', $this->integer('branch_id')))
                    ->ignore($counter->id),
            ],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
