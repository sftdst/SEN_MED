<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatParticipant extends Model
{
    protected $table    = 'chat_participants';
    protected $fillable = ['conversation_id', 'staff_id', 'last_read_at'];
    protected $casts    = ['last_read_at' => 'datetime'];
}
