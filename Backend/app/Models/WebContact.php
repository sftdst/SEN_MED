<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebContact extends Model
{
    protected $fillable = [
        'nom',
        'telephone',
        'email',
        'message',
        'is_read',
        'is_replied',
        'replied_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'is_replied' => 'boolean',
        'replied_at' => 'datetime',
    ];
}