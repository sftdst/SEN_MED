<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $safe = fn(callable $cb, $default = 0) => rescue($cb, $default, false);

        $patients     = $safe(fn() => DB::table('gen_mst_patient')->count());
        $visites      = $safe(fn() => DB::table('clinic_txn_adt')->count());
        $rdv          = $safe(fn() => DB::table('app_txn_appointments')->count());
        $personnels   = $safe(fn() => DB::table('hr_mst_user')->count());
        $departements = $safe(fn() => DB::table('gen_mst_departement')->count());
        $services     = $safe(fn() => DB::table('gen_mst_service')->count());
        $hospitals    = $safe(fn() => DB::table('gen_mst_hospital')->count());

        $visitesMois = $safe(fn() => DB::table('clinic_txn_adt')
            ->whereRaw('DATE_FORMAT(visit_datetime, "%Y-%m") = DATE_FORMAT(NOW(), "%Y-%m")')
            ->count());

        $bills = $safe(fn() => DB::table('bill_txn_bill_hd')
            ->selectRaw('
                COALESCE(SUM(bill_amount),    0) as montant_total,
                COALESCE(SUM(paid_amount),    0) as montant_paye,
                COALESCE(SUM(pending_amount), 0) as montant_en_attente
            ')
            ->first(), (object)['montant_total' => 0, 'montant_paye' => 0, 'montant_en_attente' => 0]);

        $visitesSixMois = $safe(fn() => DB::table('clinic_txn_adt')
            ->selectRaw('
                DATE_FORMAT(visit_datetime, "%Y-%m") as mois,
                DATE_FORMAT(visit_datetime, "%b")    as label,
                COUNT(*)                              as total,
                COALESCE(SUM(Total_a_payer), 0)      as montant
            ')
            ->whereRaw('visit_datetime >= DATE_SUB(NOW(), INTERVAL 6 MONTH)')
            ->groupByRaw('DATE_FORMAT(visit_datetime, "%Y-%m"), DATE_FORMAT(visit_datetime, "%b")')
            ->orderByRaw('DATE_FORMAT(visit_datetime, "%Y-%m")')
            ->get(), collect());

        $parDepartement = $safe(fn() => DB::table('clinic_txn_adt as a')
            ->join('gen_mst_departement as d', 'a.IDgen_mst_Departement', '=', 'd.IDgen_mst_Departement')
            ->selectRaw('d.NomDepartement as label, COUNT(*) as total')
            ->groupBy('d.IDgen_mst_Departement', 'd.NomDepartement')
            ->orderByRaw('COUNT(*) DESC')
            ->limit(10)
            ->get(), collect());

        $rdvParStatut = $safe(fn() => DB::table('app_txn_appointments')
            ->selectRaw('COALESCE(statut_app, "—") as statut, COUNT(*) as total')
            ->groupBy('statut_app')
            ->get(), collect());

        return response()->json([
            'success' => true,
            'data'    => [
                'patients'           => $patients,
                'visites'            => $visites,
                'visites_mois'       => $visitesMois,
                'rdv'                => $rdv,
                'personnels'         => $personnels,
                'departements'       => $departements,
                'services'           => $services,
                'hospitals'          => $hospitals,
                'montant_total'      => (float) $bills->montant_total,
                'montant_paye'       => (float) $bills->montant_paye,
                'montant_en_attente' => (float) $bills->montant_en_attente,
                'visites_par_mois'   => $visitesSixMois,
                'visites_par_dept'   => $parDepartement,
                'rdv_par_statut'     => $rdvParStatut,
            ],
        ]);
    }
}
