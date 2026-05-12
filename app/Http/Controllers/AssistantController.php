<?php

namespace App\Http\Controllers;

use App\Http\Requests\Assistant\StoreAssistantMessageRequest;
use App\Models\AssistantConversation;
use App\Services\AssistantService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssistantController extends Controller
{
    public function __construct(
        private AssistantService $assistantService,
    ) {}

    public function publicPage()
    {
        return Inertia::render('public/assistant', [
            'scope' => 'public',
        ]);
    }

    public function operationsPage()
    {
        return Inertia::render('assistant/index', [
            'scope' => 'operations',
        ]);
    }

    public function history(Request $request)
    {
        $request->validate([
            'conversation_id' => 'nullable|integer|exists:assistant_conversations,id',
            'scope'           => 'nullable|in:public,operations',
            'session_id'      => 'nullable|string|max:100',
        ]);

        $user      = auth()->user();
        $scope     = $request->input('scope', $user ? 'operations' : 'public');
        $sessionId = $request->input('session_id');

        // Build owner key — prevents cross-user access
        $ownerKey = $scope === 'public'
            ? 'public'
            : ($user ? "user:{$user->id}" : null);

        // Unauthenticated users cannot access operations scope history
        if (!$ownerKey) {
            return response()->json(['messages' => [], 'conversationId' => null]);
        }

        // Locate the conversation — require session_id or conversation_id
        $query = AssistantConversation::where('scope', $scope)
            ->where('owner_key', $ownerKey);

        if ($request->filled('conversation_id')) {
            $query->where('id', $request->integer('conversation_id'));
        } elseif ($sessionId) {
            $query->where('session_id', $sessionId);
        } else {
            // No identifier provided → return empty (client will resend after first message)
            return response()->json(['messages' => [], 'conversationId' => null]);
        }

        $conversation = $query->first();

        if (!$conversation) {
            return response()->json(['messages' => [], 'conversationId' => null]);
        }

        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($msg) => [
                'id'        => $msg->id,
                'role'      => $msg->role,
                'content'   => $msg->content,
                'createdAt' => $msg->created_at->toIso8601String(),
                'metadata'  => $msg->role === 'assistant' ? [
                    'provider'     => $msg->provider_used,
                    'fallbackUsed' => (bool) $msg->fallback_used,
                ] : null,
            ])
            ->all();

        return response()->json([
            'messages'       => $messages,
            'conversationId' => $conversation->id,
        ]);
    }

    public function respond(StoreAssistantMessageRequest $request)
    {
        try {
            $validated = $request->validated();

            // Ensure scope matches authenticated state
            $user = auth()->user();
            $isAuthenticated = $user !== null;
            $requestedScope = $validated['context']['scope'];

            if ($isAuthenticated && $requestedScope !== 'operations') {
                return response()->json([
                    'error' => 'Authenticated users must use operations scope.',
                ], 403);
            }

            if (!$isAuthenticated && $requestedScope !== 'public') {
                return response()->json([
                    'error' => 'Unauthenticated users must use public scope.',
                ], 403);
            }

            // Call assistant service
            // Use client-supplied session_id from context (not server session)
            $response = $this->assistantService->respond(
                $validated['message'],
                array_merge($validated['context'], [
                    'user_id' => $user?->id,
                ])
            );

            if (isset($response['error'])) {
                return response()->json($response, 503);
            }

            return response()->json($response);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Assistant respond error', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'An error occurred processing your request.',
                'success' => false,
            ], 503);
        }
    }
}
