<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasFactory;

    protected $table = 'roles';

    protected $fillable = [
        'name',
        'key',
        'icon',
        'color',
        'description',
        'is_system',
        'order',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Permissions attachés à ce rôle
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permission')
                    ->withTimestamps();
    }
}
