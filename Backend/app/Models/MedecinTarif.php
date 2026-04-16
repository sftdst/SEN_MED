<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedecinTarif extends Model
{
    protected $table      = 'gen_mst_medcin_tarif';
    protected $primaryKey = 'id';

    protected $fillable = [
        'medecin_id',
        'service_id',
        'prix_service',
        'majoration_ferie',
        'type_majoration',
        'actif',
        'note',
    ];

    protected $casts = [
        'prix_service'     => 'decimal:2',
        'majoration_ferie' => 'decimal:2',
        'actif'            => 'boolean',
        'service_id'       => 'integer',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id', 'id_service');
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Personnel::class, 'medecin_id', 'user_id');
    }

    // ── Helper : résoudre le tarif effectif ───────────────────────────────────

    /**
     * Résout le tarif final pour un médecin × service, avec gestion du fallback
     * vers le tarif hôpital et de la majoration jour férié.
     *
     * @param string   $medecinId   user_id du médecin
     * @param int      $serviceId   id_service du service
     * @param bool     $jourFerie   true si on est un jour férié
     * @return array   [prix_base, majoration, prix_final, source: 'medecin'|'hopital']
     */
    public static function resoudre(string $medecinId, int $serviceId, bool $jourFerie = false): array
    {
        $service = Service::find($serviceId);
        $tarifHopital = $service ? (float) $service->valeur_cts : 0;
        $majorationHopital = $service ? (float) $service->majoration_ferie : 0;

        $tarif = self::where('medecin_id', $medecinId)
                     ->where('service_id', $serviceId)
                     ->where('actif', true)
                     ->first();

        if ($tarif && $tarif->prix_service !== null) {
            $prixBase = (float) $tarif->prix_service;
            $source   = 'medecin';
            $majoPct  = $jourFerie ? (float) $tarif->majoration_ferie : 0;
            $typeMajo = $tarif->type_majoration;
        } else {
            $prixBase = $tarifHopital;
            $source   = 'hopital';
            $majoPct  = $jourFerie ? $majorationHopital : 0;
            $typeMajo = 'pourcentage';
        }

        $montantMajoration = 0;
        if ($jourFerie && $majoPct > 0) {
            $montantMajoration = $typeMajo === 'pourcentage'
                ? round($prixBase * $majoPct / 100, 2)
                : $majoPct;
        }

        return [
            'prix_base'         => $prixBase,
            'majoration'        => $montantMajoration,
            'type_majoration'   => $typeMajo,
            'taux_majoration'   => $majoPct,
            'prix_final'        => $prixBase + $montantMajoration,
            'source'            => $source,
            'jour_ferie'        => $jourFerie,
        ];
    }
}
