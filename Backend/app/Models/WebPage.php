<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebPage extends Model
{
    protected $table = 'web_pages';

    protected $fillable = [
        'path',
        'title',
        'tag',
        'icon',
        'subtitle',
        'description',
        'features',
        'steps',
        'details',
        'info',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'features'  => 'array',
        'steps'     => 'array',
        'details'   => 'array',
        'info'      => 'array',
        'is_active' => 'boolean',
    ];
}
