<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebTestimonial extends Model
{
    protected $table = 'web_testimonials';

    protected $fillable = [
        'nom',
        'role',
        'photo',
        'texte',
        'note',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'note'      => 'integer',
    ];
}
