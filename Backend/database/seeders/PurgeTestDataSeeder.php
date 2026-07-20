<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Vide toutes les données de test en production.
 * Conserve : users, roles, permissions, app_preferences, mailing_configs, web_*.
 */
class PurgeTestDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $tables = [
            // Nursing / DSI
            'nursing_surveillances',
            'nursing_assessments',
            'nursing_transmissions',
            'nursing_care_records',
            'nursing_treatments',
            'nursing_intervenants',
            'nursing_contacts',
            'nursing_dossiers',
            // Consultation / clinique
            'clinic_txn_long_term_medication',
            'clinic_txn_ordonnances',
            'lab_txn_procedures',
            'clinic_txn_procedures',
            'clinic_txn_medication',
            'clinic_txn_vital_sign',
            'clinic_txn_patient_notes',
            'clinic_txn_adt_notes',
            'clinic_txn_adt',
            // Pièces jointes
            'hosp_fiches_att',
            // Certificats & formulaires
            'generated_certificates',
            // Comptabilité / paiements
            'bill_txn_patient_payments',
            'gen_mst_recette',
            'bill_txn_bill_details',
            'bill_txn_bill_hd',
            'gen_mst_facture',
            'factures_hospitalisation',
            // RDV
            'app_txn_appointments',
            // Transferts
            'hosp_transferts',
            // Hospitalisation
            'hospitalisations',
            'chambre_equipements',
            'chambres',
            'equipements',
            // Matériel médical
            'mm_mst_paiement_location',
            'mm_mst_diagnostic',
            'mm_mst_location_ligne',
            'mm_mst_dossier_location',
            'mm_mst_equipement',
            // Pharmacie
            'ph_mst_inventaire',
            'ph_mst_mouvement_stock',
            'ph_mst_approvisionnement',
            'ph_mst_detail_commande',
            'ph_mst_commande',
            'ph_mst_fournisseur_produit',
            'ph_mst_fournisseur',
            'ph_mst_item',
            // Patients
            'gen_mst_patient',
            // Planning
            'medecin_ferie_disponibilite',
            'medecin_exception',
            'medecin_horaire',
            // Tarification
            'gen_mst_medcin_tarif',
            // Personnel (≠ users)
            'hr_mst_user',
            // Partenaires
            'gen_mst_partenaire_dtl',
            'gen_mst_partenaire_header',
            // Structure
            'gen_mst_service',
            'gen_mst_type_service',
            'gen_mst_departement',
            'gen_mst_hospital',
            // Chat
            'chat_messages',
            'chat_conversations',
        ];

        foreach ($tables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                DB::table($table)->truncate();
                $this->command->info("✓ $table vidée");
            } else {
                $this->command->warn("⚠ $table introuvable (ignorée)");
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('');
        $this->command->info('✅ Données de test supprimées. Users, rôles et configuration conservés.');
    }
}
