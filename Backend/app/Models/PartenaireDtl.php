<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartenaireDtl extends Model
{
    protected $table      = 'gen_mst_partenaire_dtl';
    protected $primaryKey = 'id_Rep';

    protected $fillable = [
        'id_partenaire_dtl',
        'Nom',
        'service',
        'contributionCompagny',
        'contributionPatient',
        'Maximum_Credit',
        'Pending_amount',
        'Paid_amount',
        'Id_gen_partenaire',
    ];

    protected $casts = [
        'contributionCompagny' => 'integer',
        'contributionPatient'  => 'integer',
        'Maximum_Credit'       => 'integer',
        'Pending_amount'       => 'integer',
        'Paid_amount'          => 'integer',
    ];

    public function partenaire(): BelongsTo
    {
        return $this->belongsTo(PartenaireHeader::class, 'Id_gen_partenaire', 'id_gen_partenaire');
    }
}
