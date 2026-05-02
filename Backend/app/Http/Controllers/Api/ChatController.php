<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\ChatParticipant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    // GET /chat/users
    public function users(Request $request): JsonResponse
    {
        $q = $request->input('q', '');
        $query = DB::table('hr_mst_user')
            ->where(function ($s) {
                $s->where('status_id', 1)->orWhereNull('status_id');
            })
            ->select('id', 'first_name', 'last_name', 'staff_name', 'staff_type',
                     'specialization', 'user_name', 'photo', 'IDgen_mst_Departement');

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->whereRaw('LOWER(staff_name) LIKE ?', ['%' . strtolower($q) . '%'])
                    ->orWhereRaw('LOWER(first_name) LIKE ?', ['%' . strtolower($q) . '%'])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', ['%' . strtolower($q) . '%'])
                    ->orWhereRaw('LOWER(specialization) LIKE ?', ['%' . strtolower($q) . '%']);
            });
        }

        $users = $query->orderBy('staff_name')->get()->map(function ($u) {
            $u->display_name = $u->staff_name ?: trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
            $u->photo_url    = $this->resolvePhotoUrl($u->photo ?? null);
            $u->initials     = $this->initials($u->display_name);
            return $u;
        });

        return response()->json(['data' => $users]);
    }

    // GET /chat/conversations
    public function conversations(Request $request): JsonResponse
    {
        $staffId = (int) $request->input('staff_id');
        if (!$staffId) return response()->json(['data' => []]);

        $convIds = ChatParticipant::where('staff_id', $staffId)->pluck('conversation_id');

        $conversations = ChatConversation::whereIn('id', $convIds)
            ->with(['lastMessage', 'participants'])
            ->get()
            ->map(function ($conv) use ($staffId) {
                $myPart  = $conv->participants->firstWhere('staff_id', $staffId);
                $lastMsg = $conv->lastMessage;

                $unread = ChatMessage::where('conversation_id', $conv->id)
                    ->where('sender_id', '!=', $staffId)
                    ->when($myPart?->last_read_at, fn($q) =>
                        $q->where('created_at', '>', $myPart->last_read_at))
                    ->count();

                $otherStaff = null;
                if ($conv->type === 'direct') {
                    $otherId = $conv->participants->where('staff_id', '!=', $staffId)->first()?->staff_id;
                    if ($otherId) {
                        $raw = DB::table('hr_mst_user')->where('id', $otherId)
                            ->select('id', 'staff_name', 'first_name', 'last_name', 'staff_type', 'specialization', 'photo')
                            ->first();
                        if ($raw) {
                            $raw->display_name = $raw->staff_name ?: trim(($raw->first_name ?? '') . ' ' . ($raw->last_name ?? ''));
                            $raw->photo_url    = $this->resolvePhotoUrl($raw->photo ?? null);
                            $raw->initials     = $this->initials($raw->display_name);
                            $otherStaff        = $raw;
                        }
                    }
                }

                if ($lastMsg) {
                    $lastMsg->sender_name = DB::table('hr_mst_user')->where('id', $lastMsg->sender_id)->value('staff_name') ?? 'Inconnu';
                }

                return [
                    'id'           => $conv->id,
                    'type'         => $conv->type,
                    'nom'          => $conv->nom,
                    'other_staff'  => $otherStaff,
                    'last_message' => $lastMsg,
                    'unread_count' => $unread,
                    'updated_at'   => $lastMsg?->created_at ?? $conv->updated_at,
                ];
            })
            ->sortByDesc('updated_at')
            ->values();

        return response()->json(['data' => $conversations]);
    }

    // POST /chat/conversations
    public function createConversation(Request $request): JsonResponse
    {
        $request->validate([
            'staff_id'        => 'required|integer',
            'type'            => 'nullable|string|in:direct,groupe',
            'nom'             => 'nullable|string|max:100',
            'participant_ids' => 'required|array|min:1',
        ]);

        $myId   = (int) $request->input('staff_id');
        $type   = $request->input('type', 'direct');
        $allIds = array_unique(array_merge([$myId], $request->input('participant_ids')));

        if ($type === 'direct' && count($allIds) === 2) {
            $otherId  = collect($allIds)->first(fn($id) => $id !== $myId);
            $myConvs  = ChatParticipant::where('staff_id', $myId)->pluck('conversation_id');
            $herConvs = ChatParticipant::where('staff_id', $otherId)->pluck('conversation_id');
            $existing = $myConvs->intersect($herConvs)->first();
            if ($existing) {
                $conv = ChatConversation::where('id', $existing)->where('type', 'direct')->first();
                if ($conv) return response()->json(['data' => $conv, 'existing' => true]);
            }
        }

        $conv = ChatConversation::create([
            'type'       => $type,
            'nom'        => $request->input('nom'),
            'created_by' => $myId,
        ]);
        foreach ($allIds as $sid) {
            ChatParticipant::create(['conversation_id' => $conv->id, 'staff_id' => $sid]);
        }

        return response()->json(['data' => $conv], 201);
    }

    // GET /chat/conversations/{id}/messages
    public function messages(Request $request, int $convId): JsonResponse
    {
        $staffId = (int) $request->input('staff_id');
        $lastId  = (int) $request->input('after_id', 0);
        $limit   = (int) $request->input('limit', 50);

        if (!ChatParticipant::where('conversation_id', $convId)->where('staff_id', $staffId)->exists()) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if ($lastId > 0) {
            $msgs = ChatMessage::where('conversation_id', $convId)->where('id', '>', $lastId)->orderBy('id')->get();
        } else {
            $msgs = ChatMessage::where('conversation_id', $convId)->orderBy('id', 'desc')->limit($limit)->get()->reverse()->values();
        }

        return response()->json(['data' => $this->enrichMessages($msgs)]);
    }

    // POST /chat/conversations/{id}/messages
    public function sendMessage(Request $request, int $convId): JsonResponse
    {
        $request->validate(['staff_id' => 'required|integer', 'content' => 'nullable|string|max:5000']);
        $staffId = (int) $request->input('staff_id');

        if (!ChatParticipant::where('conversation_id', $convId)->where('staff_id', $staffId)->exists()) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $type = 'text'; $filePath = null; $fileName = null;
        if ($request->hasFile('file')) {
            $file     = $request->file('file');
            $mime     = $file->getMimeType();
            $fileName = $file->getClientOriginalName();
            $ext      = strtolower($file->getClientOriginalExtension());
            $filePath = $file->store("chat/{$convId}", 'public');

            $audioExts  = ['webm', 'ogg', 'mp3', 'mp4', 'm4a', 'wav', 'opus', 'flac', 'aac'];
            $isAudio    = str_starts_with($mime, 'audio/')
                       || in_array($ext, $audioExts)
                       || str_starts_with($fileName, 'vocal_');

            if      (str_starts_with($mime, 'image/')) $type = 'image';
            elseif  ($isAudio)                          $type = 'audio';
            else                                        $type = 'file';
        }

        $msg = ChatMessage::create([
            'conversation_id' => $convId,
            'sender_id'       => $staffId,
            'content'         => $request->input('content'),
            'type'            => $type,
            'file_path'       => $filePath,
            'file_name'       => $fileName,
        ]);
        ChatConversation::where('id', $convId)->touch();

        return response()->json(['data' => $this->enrichMessages(collect([$msg]))->first()], 201);
    }

    // PUT /chat/conversations/{id}/read
    public function markRead(Request $request, int $convId): JsonResponse
    {
        ChatParticipant::where('conversation_id', $convId)
            ->where('staff_id', (int) $request->input('staff_id'))
            ->update(['last_read_at' => now()]);
        return response()->json(['message' => 'Lu.']);
    }

    // GET /chat/unread-count
    public function unreadCount(Request $request): JsonResponse
    {
        $staffId = (int) $request->input('staff_id');
        if (!$staffId) return response()->json(['count' => 0]);

        $total = 0;
        foreach (ChatParticipant::where('staff_id', $staffId)->get() as $p) {
            $total += ChatMessage::where('conversation_id', $p->conversation_id)
                ->where('sender_id', '!=', $staffId)
                ->when($p->last_read_at, fn($q) => $q->where('created_at', '>', $p->last_read_at))
                ->count();
        }
        return response()->json(['count' => $total]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private function enrichMessages($messages)
    {
        $senderIds = $messages->pluck('sender_id')->unique();
        $senders   = DB::table('hr_mst_user')->whereIn('id', $senderIds)
            ->get(['id', 'staff_name', 'first_name', 'last_name', 'staff_type', 'photo'])
            ->keyBy('id');

        return $messages->map(function ($msg) use ($senders) {
            $s    = $senders[$msg->sender_id] ?? null;
            $name = $s?->staff_name ?: trim(($s?->first_name ?? '') . ' ' . ($s?->last_name ?? ''));
            return [
                'id'              => $msg->id,
                'conversation_id' => $msg->conversation_id,
                'sender_id'       => $msg->sender_id,
                'sender_name'     => $name ?: 'Inconnu',
                'sender_type'     => $s?->staff_type ?? '',
                'sender_initials' => $this->initials($name),
                'sender_photo'    => $this->resolvePhotoUrl($s?->photo ?? null),
                'content'         => $msg->content,
                'type'            => $msg->type ?? 'text',
                'file_path'       => $msg->file_path,
                'file_name'       => $msg->file_name,
                'file_url'        => $msg->file_path ? Storage::disk('public')->url($msg->file_path) : null,
                'created_at'      => $msg->created_at,
            ];
        })->values();
    }

    private function resolvePhotoUrl(?string $photo): ?string
    {
        if (!$photo) return null;
        if (str_starts_with($photo, 'http')) return $photo;
        return Storage::disk('public')->url($photo);
    }

    private function initials(string $name): string
    {
        $parts = array_filter(explode(' ', trim($name)));
        if (count($parts) >= 2) {
            return strtoupper(mb_substr($parts[0], 0, 1) . mb_substr(end($parts), 0, 1));
        }
        return strtoupper(mb_substr($name, 0, 2));
    }
}
