<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\TypeService;
use Illuminate\Database\Seeder;

class AddDentistServices extends Seeder
{
    public function run(): void
    {
        // Récupérer les types de service dentaires (priorité aux plus récents en cas de doublons)
        $typeIds = TypeService::whereIn('NomType', [
            'Consultations',
            'Soins Conservateurs',
            'Soins Chirurgicaux',
            'Soins Parodontaux',
            'Radiographie',
            'Prothèses Dentaires',
        ])->orderBy('IDgen_mst_Type_Service', 'desc')
          ->get()
          ->unique('NomType')
          ->keyBy('NomType');

        $cons   = $typeIds['Consultations']->IDgen_mst_Type_Service        ?? 8;
        $soinsC = $typeIds['Soins Conservateurs']->IDgen_mst_Type_Service  ?? 9;
        $soinsK = $typeIds['Soins Chirurgicaux']->IDgen_mst_Type_Service   ?? 10;
        $soinsP = $typeIds['Soins Parodontaux']->IDgen_mst_Type_Service    ?? 11;
        $radio  = $typeIds['Radiographie']->IDgen_mst_Type_Service         ?? 12;
        $proth  = $typeIds['Prothèses Dentaires']->IDgen_mst_Type_Service  ?? 13;

        $services = [

            // I. CONSULTATIONS
            ['id' => 'DT-C01', 'tri_name' => 'Consultation simple',                             'cle' => 'D5',        'valeur' => 6000,   'type' => $cons],
            ['id' => 'DT-C02', 'tri_name' => 'Visite à domicile',                               'cle' => 'D20',       'valeur' => 24000,  'type' => $cons],
            ['id' => 'DT-C03', 'tri_name' => 'Consultation jours fériés et nuit',               'cle' => 'D10',       'valeur' => 12000,  'type' => $cons],
            ['id' => 'DT-C04', 'tri_name' => "Consultation et soins d'urgence",                 'cle' => 'D10',       'valeur' => 12000,  'type' => $cons],

            // II. SOINS CONSERVATEURS - série amalgame
            ['id' => 'DT-SC01', 'tri_name' => 'Cavité simple 1 face (amalgame)',                'cle' => 'D10',       'valeur' => 12000,  'type' => $soinsC],
            ['id' => 'DT-SC02', 'tri_name' => 'Cavité composée 2 faces (amalgame)',             'cle' => 'D12',       'valeur' => 14400,  'type' => $soinsC],
            ['id' => 'DT-SC03', 'tri_name' => 'Cavité complexe 3 faces (amalgame)',             'cle' => 'D15',       'valeur' => 18000,  'type' => $soinsC],
            ['id' => 'DT-SC04', 'tri_name' => 'Cavité complexe screw-post/tenon (amalgame)',    'cle' => 'D20',       'valeur' => 24000,  'type' => $soinsC],
            // série composite
            ['id' => 'DT-SC05', 'tri_name' => 'Cavité simple 1 face (composite)',               'cle' => 'D15',       'valeur' => 18000,  'type' => $soinsC],
            ['id' => 'DT-SC06', 'tri_name' => 'Cavité composée 2 faces (composite)',            'cle' => 'D20',       'valeur' => 24000,  'type' => $soinsC],
            ['id' => 'DT-SC07', 'tri_name' => 'Cavité complexe 3 faces (composite)',            'cle' => 'D25',       'valeur' => 30000,  'type' => $soinsC],
            ['id' => 'DT-SC08', 'tri_name' => 'Cavité complexe screw-post/tenon (composite)',   'cle' => 'D30',       'valeur' => 36000,  'type' => $soinsC],
            // dévitalisation / groupes
            ['id' => 'DT-SC09', 'tri_name' => 'Pulpotomie',                                     'cle' => 'D10',       'valeur' => 12000,  'type' => $soinsC],
            ['id' => 'DT-SC10', 'tri_name' => 'Groupe incisivo-canin (D15)',                    'cle' => 'D15',       'valeur' => 18000,  'type' => $soinsC],
            ['id' => 'DT-SC11', 'tri_name' => 'Groupe prémolaires (D20)',                       'cle' => 'D20',       'valeur' => 24000,  'type' => $soinsC],
            ['id' => 'DT-SC12', 'tri_name' => 'Groupe molaires (D25)',                          'cle' => 'D25',       'valeur' => 30000,  'type' => $soinsC],
            ['id' => 'DT-SC13', 'tri_name' => 'Groupe incisivo-canin (D10)',                    'cle' => 'D10',       'valeur' => 12000,  'type' => $soinsC],
            ['id' => 'DT-SC14', 'tri_name' => 'Groupe prémolaire (D15)',                        'cle' => 'D15',       'valeur' => 18000,  'type' => $soinsC],

            // III. SOINS CHIRURGICAUX
            ['id' => 'DT-SK01', 'tri_name' => 'Avulsion incisive',                              'cle' => 'D10',       'valeur' => 12000,  'type' => $soinsK],
            ['id' => 'DT-SK02', 'tri_name' => 'Avulsion canine ou prémolaire',                  'cle' => 'D12',       'valeur' => 14400,  'type' => $soinsK],
            ['id' => 'DT-SK03', 'tri_name' => 'Avulsion molaire',                               'cle' => 'D15',       'valeur' => 18000,  'type' => $soinsK],
            ['id' => 'DT-SK04', 'tri_name' => 'Avulsion dent de sagesse',                       'cle' => 'D20',       'valeur' => 24000,  'type' => $soinsK],
            ['id' => 'DT-SK05', 'tri_name' => 'Avulsion dent de lait',                         'cle' => 'D8',        'valeur' => 9600,   'type' => $soinsK],
            ['id' => 'DT-SK06', 'tri_name' => 'Dent enclavée',                                  'cle' => 'D40',       'valeur' => 48000,  'type' => $soinsK],
            ['id' => 'DT-SK07', 'tri_name' => 'Dent incluse',                                   'cle' => 'D50',       'valeur' => 60000,  'type' => $soinsK],
            ['id' => 'DT-SK08', 'tri_name' => 'Germectomie dent de sagesse',                   'cle' => 'D40',       'valeur' => 48000,  'type' => $soinsK],
            ['id' => 'DT-SK09', 'tri_name' => 'Germectomie autres dents',                      'cle' => 'D20',       'valeur' => 24000,  'type' => $soinsK],
            ['id' => 'DT-SK10', 'tri_name' => 'Traitement cellulite péri-maxillaire',          'cle' => 'D15',       'valeur' => 18000,  'type' => $soinsK],
            ['id' => 'DT-SK11', 'tri_name' => 'Régularisation crête alvéolaire suture gingivale','cle' => 'D10',     'valeur' => 12000,  'type' => $soinsK],
            ['id' => 'DT-SK12', 'tri_name' => 'Curetage péri-apical avec/sans résection apicale','cle' => 'D25',     'valeur' => 30000,  'type' => $soinsK],
            ['id' => 'DT-SK13', 'tri_name' => 'Exérèse kyste avec trépanation osseuse',        'cle' => 'D25',       'valeur' => 30000,  'type' => $soinsK],
            ['id' => 'DT-SK14', 'tri_name' => 'Traitement hémorragie post-opératoire',         'cle' => 'D10',       'valeur' => 12000,  'type' => $soinsK],
            ['id' => 'DT-SK15', 'tri_name' => 'Traitement au laser (par séance)',               'cle' => 'Sur devis', 'valeur' => 0,      'type' => $soinsK],

            // IV. SOINS PARODONTAUX
            ['id' => 'DT-SP01', 'tri_name' => "Enseignement d'hygiène",                        'cle' => 'D5',        'valeur' => 6000,   'type' => $soinsP],
            ['id' => 'DT-SP02', 'tri_name' => 'Application de fluor',                          'cle' => 'D10',       'valeur' => 12000,  'type' => $soinsP],
            ['id' => 'DT-SP03', 'tri_name' => 'Gouttière occlusale',                           'cle' => 'D40',       'valeur' => 48000,  'type' => $soinsP],
            ['id' => 'DT-SP04', 'tri_name' => 'Curetage parodontal (par quadrant)',             'cle' => 'D15',       'valeur' => 18000,  'type' => $soinsP],
            ['id' => 'DT-SP05', 'tri_name' => 'Vestibuloplastie',                              'cle' => 'Sur devis', 'valeur' => 0,      'type' => $soinsP],
            ['id' => 'DT-SP06', 'tri_name' => 'Gingivectomie',                                 'cle' => 'D15',       'valeur' => 18000,  'type' => $soinsP],
            ['id' => 'DT-SP07', 'tri_name' => 'Greffes gingivales',                            'cle' => 'Sur devis', 'valeur' => 0,      'type' => $soinsP],
            ['id' => 'DT-SP08', 'tri_name' => 'Frénectomie',                                   'cle' => 'D15',       'valeur' => 18000,  'type' => $soinsP],
            ['id' => 'DT-SP09', 'tri_name' => 'Comblement',                                    'cle' => 'Sur devis', 'valeur' => 0,      'type' => $soinsP],
            ['id' => 'DT-SP10', 'tri_name' => 'Pose de membrane',                              'cle' => 'Sur devis', 'valeur' => 0,      'type' => $soinsP],
            ['id' => 'DT-SP11', 'tri_name' => 'Résection de capuchon muqueux',                 'cle' => 'D15',       'valeur' => 18000,  'type' => $soinsP],
            ['id' => 'DT-SP12', 'tri_name' => 'Soins gingivaux par arcade',                    'cle' => 'D25',       'valeur' => 30000,  'type' => $soinsP],

            // V. RADIOGRAPHIE
            ['id' => 'DT-R01',  'tri_name' => 'Film occlusal ou rétro-alvéolaire',             'cle' => 'D5',        'valeur' => 6000,   'type' => $radio],
            ['id' => 'DT-R02',  'tri_name' => 'Toutes autres techniques radio',                'cle' => 'Sur devis', 'valeur' => 0,      'type' => $radio],

            // VI. PROTHÈSES DENTAIRES
            ['id' => 'DT-P01',  'tri_name' => 'Couronne coulée (CC)',                          'cle' => 'D80',       'valeur' => 96000,  'type' => $proth],
            ['id' => 'DT-P02',  'tri_name' => 'CIV résine (dent à tenon)',                     'cle' => 'D100',      'valeur' => 120000, 'type' => $proth],
            ['id' => 'DT-P03',  'tri_name' => 'CIV Céramique',                                 'cle' => 'D140',      'valeur' => 168000, 'type' => $proth],
            ['id' => 'DT-P04',  'tri_name' => 'Couronne céramique',                            'cle' => 'D250',      'valeur' => 300000, 'type' => $proth],
            ['id' => 'DT-P05',  'tri_name' => 'Bridges',                                       'cle' => 'Sur devis', 'valeur' => 0,      'type' => $proth],
            ['id' => 'DT-P06',  'tri_name' => 'Réparation facette en résine',                 'cle' => 'D15',       'valeur' => 18000,  'type' => $proth],
            ['id' => 'DT-P07',  'tri_name' => 'Réparation facette en céramique',              'cle' => 'D25',       'valeur' => 30000,  'type' => $proth],
            ['id' => 'DT-P08',  'tri_name' => 'Faux moignon',                                  'cle' => 'D45',       'valeur' => 54000,  'type' => $proth],
            ['id' => 'DT-P09',  'tri_name' => "Scellement d'un élément",                       'cle' => 'D10',       'valeur' => 12000,  'type' => $proth],
            ['id' => 'DT-P10',  'tri_name' => "Scellement d'un bridge",                        'cle' => 'D15',       'valeur' => 18000,  'type' => $proth],
            // Prothèses partielles amovibles
            ['id' => 'DT-P11',  'tri_name' => 'Prothèse partielle 1 à 3 dents',               'cle' => 'D60',       'valeur' => 72000,  'type' => $proth],
            ['id' => 'DT-P12',  'tri_name' => 'Prothèse partielle 4 dents',                   'cle' => 'D70',       'valeur' => 84000,  'type' => $proth],
            ['id' => 'DT-P13',  'tri_name' => 'Prothèse partielle 5 dents',                   'cle' => 'D80',       'valeur' => 96000,  'type' => $proth],
            ['id' => 'DT-P14',  'tri_name' => 'Prothèse partielle 6 dents',                   'cle' => 'D90',       'valeur' => 108000, 'type' => $proth],
            ['id' => 'DT-P15',  'tri_name' => 'Prothèse partielle 7 dents',                   'cle' => 'D100',      'valeur' => 120000, 'type' => $proth],
            ['id' => 'DT-P16',  'tri_name' => 'Prothèse partielle 8 dents',                   'cle' => 'D110',      'valeur' => 132000, 'type' => $proth],
            ['id' => 'DT-P17',  'tri_name' => 'Prothèse partielle 9 dents',                   'cle' => 'D120',      'valeur' => 144000, 'type' => $proth],
            ['id' => 'DT-P18',  'tri_name' => 'Prothèse partielle 10 dents',                  'cle' => 'D130',      'valeur' => 156000, 'type' => $proth],
            ['id' => 'DT-P19',  'tri_name' => 'Prothèse partielle 11 dents',                  'cle' => 'D140',      'valeur' => 168000, 'type' => $proth],
            ['id' => 'DT-P20',  'tri_name' => 'Prothèse partielle 12 dents',                  'cle' => 'D150',      'valeur' => 180000, 'type' => $proth],
            ['id' => 'DT-P21',  'tri_name' => 'Prothèse partielle 13 à 14 dents',             'cle' => 'D160',      'valeur' => 192000, 'type' => $proth],
            ['id' => 'DT-P22',  'tri_name' => 'Prothèse adjointe totale unimaxillaire',       'cle' => 'Sur devis', 'valeur' => 0,      'type' => $proth],
        ];

        foreach ($services as $s) {
            Service::updateOrCreate(
                ['id_gen_mst_service' => $s['id']],
                [
                    'id_gen_mst_service'     => $s['id'],
                    'tri_name'               => $s['tri_name'],
                    'short_name'             => $s['tri_name'],
                    'cle_tarif_service'      => $s['cle'],
                    'valeur_cts'             => $s['valeur'],
                    'IDgen_mst_Type_Service' => $s['type'],
                    'type_categorie'         => 'Dentisterie',
                    'status'                 => 1,
                    'majoration_ferie'       => 0,
                ]
            );
        }

        $this->command->info('✅ ' . count($services) . ' services dentaires importés avec succès.');
    }
}
