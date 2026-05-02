<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    protected $table = 'permissions';

    protected $fillable = [
        'key',
        'label',
        'group_label',
        'icon',
        'description',
        'order',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    /**
     * Rôles ayant cette permission
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permission')
                    ->withTimestamps();
    }
}
