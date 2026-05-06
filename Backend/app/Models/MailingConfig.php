<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MailingConfig extends Model
{
    protected $fillable = [
        'host', 'port', 'encryption',
        'username', 'password',
        'from_name', 'from_email',
    ];

    protected $hidden = ['password'];

    /* Chiffrement transparent du mot de passe */
    public function setPasswordAttribute(?string $value): void
    {
        $this->attributes['password'] = $value ? encrypt($value) : null;
    }

    public function getPasswordAttribute(?string $value): ?string
    {
        if (!$value) return null;
        try { return decrypt($value); } catch (\Throwable) { return null; }
    }
}
