<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocTemplate extends Model
{
    protected $table    = 'doc_templates';
    protected $fillable = ['hospital_id', 'description', 'header', 'content'];
}
