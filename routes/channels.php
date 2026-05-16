<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Queue updates intentionally use public branch-scoped channels (`branch.{id}`)
// because public display boards are unauthenticated. Event payloads must remain PII-free.
