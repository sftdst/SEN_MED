<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebAbout extends Model
{
    protected $table = 'web_about';
    protected $fillable = [
        'title',
        'content',
        'stat_1_value',
        'stat_1_label',
        'stat_2_value',
        'stat_2_label',
        'stat_3_value',
        'stat_3_label',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function getStatsAttribute(): array
    {
        return [
            ['value' => $this->stat_1_value, 'label' => $this->stat_1_label],
            ['value' => $this->stat_2_value, 'label' => $this->stat_2_label],
            ['value' => $this->stat_3_value, 'label' => $this->stat_3_label],
        ];
    }
}