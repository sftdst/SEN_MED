<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppPreference extends Model
{
    protected $fillable = [
        'app_name', 'app_slogan', 'app_initial',
        'primary_color', 'accent_color', 'theme_mode',
        'density', 'sidebar_default', 'language', 'currency',
        'date_format', 'default_page', 'logo_url',
        'phone', 'email', 'address', 'map_url', 'hours',
    ];
}
