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
            'scope' => 'required|in:public,operations',
            'session_id' => 'required|string',
        ]);

        $user = auth()->user();
        $scope = $request->input('scope');
        $sessionId = $request->input('session_id');

        // Build owner key based on scope
        $ownerKey = $scope === 'public' ? 'public' : ($user ? "user:{$user->id}" : null);

        if (!$ownerKey) {
            return response()->json([
                'messages' => [],
                'conversationId' => null,
            ]);
        }

        // Find or create conversation
        $conversation = AssistantConversation::where('scope', $scope)
            ->where('session_id', $sessionId)
            ->where('owner_key', $ownerKey)
            ->first();

        if (!$conversation) {
            return response()->json([
                'messages' => [],
                'conversationId' => null,
            ]);
        }

        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($msg) => [
                'id' => $msg->id,
                'role' => $msg->role,
                'content' => $msg->content,
                'createdAt' => $msg->created_at->toIso8601String(),
                'metadata' => $msg->role === 'assistant' ? [
                    'provider' => $msg->provider_used,
                    'fallbackUsed' => $msg->fallback_used,
                ] : null,
            ])
            ->all();

        return response()->json([
            'messages' => $messages,
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
            $response = $this->assistantService->respond(
                $validated['message'],
                array_merge($validated['context'], [
                    'user_id' => $user?->id,
                    'session_id' => session()->getId(),
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
