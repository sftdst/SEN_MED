<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $patients     = DB::table('gen_mst_patient')->count();
        $visites      = DB::table('clinic_txn_adt')->count();
        $rdv          = DB::table('app_txn_appointments')->count();
        $personnels   = DB::table('hr_mst_user')->count();
        $departements = DB::table('gen_mst_departement')->count();
        $services     = DB::table('gen_mst_service')->count();
        $hospitals    = DB::table('gen_mst_hospital')->count();

        $visitesMois = DB::table('clinic_txn_adt')
            ->whereRaw('DATE_FORMAT(visit_datetime, "%Y-%m") = DATE_FORMAT(NOW(), "%Y-%m")')
            ->count();

        $bills = DB::table('bill_txn_bill_hd')
            ->selectRaw('
                COALESCE(SUM(bill_amount),    0) as montant_total,
                COALESCE(SUM(paid_amount),    0) as montant_paye,
                COALESCE(SUM(pending_amount), 0) as montant_en_attente
            ')
            ->first();

        // 6 derniers mois de visites
        $visitesSixMois = DB::table('clinic_txn_adt')
            ->selectRaw('
                DATE_FORMAT(visit_datetime, "%Y-%m") as mois,
                DATE_FORMAT(visit_datetime, "%b")    as label,
                COUNT(*)                              as total,
                COALESCE(SUM(Total_a_payer), 0)      as montant
            ')
            ->whereRaw('visit_datetime >= DATE_SUB(NOW(), INTERVAL 6 MONTH)')
            ->groupByRaw('DATE_FORMAT(visit_datetime, "%Y-%m"), DATE_FORMAT(visit_datetime, "%b")')
            ->orderByRaw('DATE_FORMAT(visit_datetime, "%Y-%m")')
            ->get();

        // Visites par département
        $parDepartement = DB::table('clinic_txn_adt as a')
            ->join('gen_mst_departement as d', 'a.IDgen_mst_Departement', '=', 'd.IDgen_mst_Departement')
            ->selectRaw('d.NomDepartement as label, COUNT(*) as total')
            ->groupBy('d.IDgen_mst_Departement', 'd.NomDepartement')
            ->orderByRaw('COUNT(*) DESC')
            ->limit(10)
            ->get();

        // RDV par statut
        $rdvParStatut = DB::table('app_txn_appointments')
            ->selectRaw('COALESCE(statut_app, "—") as statut, COUNT(*) as total')
            ->groupBy('statut_app')
            ->get();

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
