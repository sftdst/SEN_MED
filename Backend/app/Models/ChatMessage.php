<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChatMessage extends Model
{
    use SoftDeletes;

    protected $table    = 'chat_messages';
    protected $fillable = ['conversation_id', 'sender_id', 'content', 'type', 'file_path', 'file_name'];
    protected $casts    = ['created_at' => 'datetime'];

    public function sender()
    {
        return $this->belongsTo(\Illuminate\Support\Facades\DB::table('hr_mst_user'), 'sender_id', 'id');
    }
}
