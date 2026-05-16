<?php

namespace App\Http\Requests\Management;

use App\Models\Counter;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var User $user */
        $user = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[+0-9\s\\-()]+$/'],
            'role' => ['required', 'string', 'exists:roles,name'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'counter_id' => ['nullable', 'integer', 'exists:counters,id'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $role = $this->string('role')->toString();
                $branchId = $this->integer('branch_id');
                $counterId = $this->integer('counter_id');

                if (in_array($role, ['manager', 'teller'], true) && ! $branchId) {
                    $validator->errors()->add('branch_id', 'A branch is required for this role.');
                }

                if ($role !== 'teller' && $counterId) {
                    $validator->errors()->add('counter_id', 'Only tellers can be assigned to a counter.');
                }

                if ($role === 'teller' && $counterId) {
                    $counter = Counter::query()->find($counterId);

                    if (! $counter || $counter->branch_id !== $branchId) {
                        $validator->errors()->add('counter_id', 'The selected counter must belong to the selected branch.');
                    }
                }
            },
        ];
    }
}
