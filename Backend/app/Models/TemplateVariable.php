<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplateVariable extends Model
{
    protected $table    = 'template_variables';
    protected $fillable = ['hospital_id', 'variable_name', 'label', 'is_system'];

    protected $casts = [
        'is_system' => 'boolean',
    ];
}
