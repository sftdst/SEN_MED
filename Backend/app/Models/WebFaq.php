<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebFaq extends Model
{
    protected $table = 'web_faqs';

    protected $fillable = [
        'question',
        'reponse',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
