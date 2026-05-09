<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebSlide extends Model
{
    protected $fillable = [
        'image_url',
        'banner_url',
        'title',
        'description',
        'button_label',
        'button_link',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function getImageUrlAttribute($value): ?string
    {
        if (!$value) return null;
        if (str_starts_with($value, 'http')) return $value;
        return \Storage::disk('public')->url($value);
    }
}