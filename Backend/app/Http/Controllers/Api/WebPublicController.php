<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppPreference;
use App\Models\WebSlide;
use App\Models\WebAbout;
use App\Models\WebContact;
use App\Models\WebTestimonial;
use App\Models\WebFaq;
use App\Models\Service;
use App\Models\Personnel;
use App\Models\PartenaireHeader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WebPublicController extends Controller
{
    private array $preferenceDefaults = [
        'app_name' => 'SenMed',
        'app_slogan' => 'Votre sante, notre priorite',
        'primary_color' => '#003268',
        'accent_color' => '#ff7631',
        'logo_url' => '',
        'phone' => '+221 33 000 00 00',
        'email' => 'contact@senmed.sn',
        'address' => 'Dakar, Senegal',
        'map_url' => 'https://maps.google.com',
        'hours' => 'Lun - Sam : 08h00 - 18h00',
    ];

    /* GET /api/v1/public/preferences ─────────────────────────────────────── */
    public function preferences(): JsonResponse
    {
        $pref = AppPreference::first();
        return response()->json(array_merge($this->preferenceDefaults, $pref ? $pref->toArray() : []));
    }

    /* GET /api/v1/public/slides ─────────────────────────────────────────────── */
    public function slides(): JsonResponse
    {
        $slides = WebSlide::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function ($slide) {
                return [
                    'id' => $slide->id,
                    'image' => $slide->image_url,
                    'title' => $slide->title,
                    'description' => $slide->description,
                    'button_label' => $slide->button_label,
                    'button_link' => $slide->button_link,
                ];
            });

        return response()->json($slides->isEmpty() ? $this->defaultSlides() : $slides);
    }

    private function defaultSlides(): array
    {
        return [
            [
                'id' => 1,
                'image' => '/src/assets/hero.png',
                'title' => 'Des soins modernes, accessibles et coordonnes',
                'description' => 'SenMed rassemble rendez-vous, specialistes, services et suivi patient dans une experience simple et rassurante.',
                'button_label' => 'Prendre rendez-vous',
                'button_link' => '#rendez-vous',
            ],
        ];
    }

    /* GET /api/v1/public/about ──────────────────────────────────────────────── */
    public function about(): JsonResponse
    {
        $about = WebAbout::first();
        if (!$about) {
            return response()->json([
                'title' => 'Qui sommes-nous ?',
                'content' => 'SenMed accompagne les structures de sante dans une prise en charge plus fluide, plus humaine et mieux organisee.',
                'stats' => [
                    ['value' => '24/7', 'label' => 'Orientation patient'],
                    ['value' => '+30', 'label' => 'Services coordonnes'],
                    ['value' => '100%', 'label' => 'Suivi structure'],
                ],
            ]);
        }

        return response()->json([
            'title' => $about->title,
            'content' => $about->content,
            'stats' => $about->stats,
        ]);
    }

    /* GET /api/v1/public/services ───────────────────────────────────────────── */
    public function services(): JsonResponse
    {
        $services = Service::select('id_service as id', 'tri_name as nom', 'short_name as description_courte')
            ->whereNotNull('tri_name')
            ->limit(9)
            ->get();

        return response()->json($services);
    }

    /* GET /api/v1/public/specialistes ─────────────────────────────────────── */
    public function specialistes(): JsonResponse
    {
        // Priorité aux consultants déclarés, sinon tous les spécialistes
        $query = Personnel::select('id', 'staff_name as nom', 'specialization as specialite', 'photo');

        $specialistes = $query->where('consult', 1)->limit(6)->get();

        if ($specialistes->isEmpty()) {
            $specialistes = Personnel::select('id', 'staff_name as nom', 'specialization as specialite', 'photo')
                ->whereNotNull('specialization')
                ->where('specialization', '!=', '')
                ->limit(6)
                ->get();
        }

        if ($specialistes->isEmpty()) {
            $specialistes = Personnel::select('id', 'staff_name as nom', 'specialization as specialite', 'photo')
                ->limit(6)
                ->get();
        }

        $result = $specialistes->map(function ($p) {
            return [
                'id'        => $p->id,
                'nom'       => $p->nom,
                'specialite' => $p->specialite ?: 'Spécialiste médical',
                'photo'     => $p->photo,
                'bio'       => 'Suivi médical, conseil et prise en charge personnalisée.',
            ];
        });

        return response()->json($result);
    }

    /* GET /api/v1/public/partenaires ──────────────────────────────────────── */
    public function partenaires(): JsonResponse
    {
        // Priorité aux partenaires actifs, sinon tous
        $partenaires = PartenaireHeader::where('status', true)
            ->select('id_Rep as id', 'Nom', 'contact', 'adress', 'mobile', 'email')
            ->limit(6)
            ->get();

        if ($partenaires->isEmpty()) {
            $partenaires = PartenaireHeader::select('id_Rep as id', 'Nom', 'contact', 'adress', 'mobile', 'email')
                ->whereNotNull('Nom')
                ->limit(6)
                ->get();
        }

        $result = $partenaires->map(function ($p) {
            return [
                'id'      => $p->id,
                'nom'     => $p->Nom,
                'contact' => $p->contact,
                'adress'  => $p->adress,
                'mobile'  => $p->mobile,
                'email'   => $p->email,
                'logo'    => '',
                'lien'    => '',
            ];
        });

        return response()->json($result);
    }

    /* GET /api/v1/public/testimonials ─────────────────────────────────────── */
    public function testimonials(): JsonResponse
    {
        $items = WebTestimonial::where('is_active', true)
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get(['id', 'nom', 'role', 'photo', 'texte', 'note']);

        if ($items->isEmpty()) {
            return response()->json($this->defaultTestimonials());
        }

        return response()->json($items);
    }

    private function defaultTestimonials(): array
    {
        return [
            ['id' => 1, 'nom' => 'Aminata Sow',     'role' => 'Patient', 'photo' => '', 'texte' => 'Un accueil exceptionnel et un suivi médical de grande qualité. Je recommande vivement SenMed pour toute la famille.', 'note' => 5],
            ['id' => 2, 'nom' => 'Ibrahima Diop',   'role' => 'Patient', 'photo' => '', 'texte' => 'La prise de rendez-vous est très simple et le personnel est à l\'écoute. Merci pour ce service précieux.',          'note' => 5],
            ['id' => 3, 'nom' => 'Fatoumata Ba',    'role' => 'Patient', 'photo' => '', 'texte' => 'J\'ai été bien prise en charge du début à la fin. Les docteurs sont compétents et disponibles.',                     'note' => 4],
        ];
    }

    /* GET /api/v1/public/faq ────────────────────────────────────────────────── */
    public function faq(): JsonResponse
    {
        $items = WebFaq::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'question', 'reponse']);

        if ($items->isEmpty()) {
            return response()->json($this->defaultFaq());
        }

        return response()->json($items);
    }

    private function defaultFaq(): array
    {
        return [
            ['id' => 1, 'question' => 'Comment prendre rendez-vous chez SenMed ?',          'reponse' => 'Vous pouvez prendre rendez-vous en ligne via notre site web, par téléphone, ou directement à l\'accueil.'],
            ['id' => 2, 'question' => 'Quels sont vos horaires d\'ouverture ?',              'reponse' => 'Nous sommes ouverts du lundi au samedi de 08h00 à 18h00. Seul le service des urgences est actif les dimanches et jours fériés.'],
            ['id' => 3, 'question' => 'Quels spécialistes sont disponibles ?',               'reponse' => 'SenMed regroupe des médecins généralistes, cardiologues, pédiatres, gynécologues et bien d\'autres spécialistes.'],
            ['id' => 4, 'question' => 'Acceptez-vous les assurances santé ?',                'reponse' => 'Oui, nous collaborons avec de nombreuses mutuelles et compagnies d\'assurance. Contactez-nous pour vérifier votre couverture.'],
        ];
    }

    /* POST /api/v1/public/contact ───────────────────────────────────────────── */
    public function contact(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => 'required|string|max:150',
            'telephone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'message' => 'required|string',
        ]);

        WebContact::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Votre message a ete envoye avec succes. Nous vous contacterons bientot.',
        ]);
    }

    /* ═══════════════════════════════════════════════════════════════════════════
       ADMIN — Slides (diaporama héro)
       ═══════════════════════════════════════════════════════════════════════════ */

    public function adminSlidesList(): JsonResponse
    {
        return response()->json(WebSlide::orderBy('sort_order')->get());
    }

    public function adminSlidesStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'        => 'required|string|max:200',
            'description'  => 'nullable|string',
            'image_url'    => 'nullable|string|max:500',
            'button_label' => 'nullable|string|max:100',
            'button_link'  => 'nullable|string|max:200',
            'sort_order'   => 'nullable|integer',
            'is_active'    => 'nullable|boolean',
        ]);
        $slide = WebSlide::create($data);
        return response()->json($slide, 201);
    }

    public function adminSlidesUpdate(Request $request, int $id): JsonResponse
    {
        $slide = WebSlide::findOrFail($id);
        $data = $request->validate([
            'title'        => 'sometimes|required|string|max:200',
            'description'  => 'nullable|string',
            'image_url'    => 'nullable|string|max:500',
            'button_label' => 'nullable|string|max:100',
            'button_link'  => 'nullable|string|max:200',
            'sort_order'   => 'nullable|integer',
            'is_active'    => 'nullable|boolean',
        ]);
        $slide->update($data);
        return response()->json($slide);
    }

    public function adminSlidesDestroy(int $id): JsonResponse
    {
        WebSlide::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function adminSlidesToggle(int $id): JsonResponse
    {
        $slide = WebSlide::findOrFail($id);
        $slide->update(['is_active' => !$slide->is_active]);
        return response()->json($slide);
    }

    /* ═══════════════════════════════════════════════════════════════════════════
       ADMIN — Section « À propos »
       ═══════════════════════════════════════════════════════════════════════════ */

    public function adminAboutGet(): JsonResponse
    {
        $about = WebAbout::first();
        if (!$about) {
            return response()->json([
                'id'           => null,
                'title'        => 'Qui sommes-nous ?',
                'content'      => 'SenMed accompagne les structures de sante dans une prise en charge plus fluide, plus humaine et mieux organisee.',
                'stat_1_value' => '24/7',
                'stat_1_label' => 'Orientation patient',
                'stat_2_value' => '+30',
                'stat_2_label' => 'Services coordonnes',
                'stat_3_value' => '100%',
                'stat_3_label' => 'Suivi structure',
                'is_active'    => true,
            ]);
        }
        return response()->json($about);
    }

    public function adminAboutSave(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'        => 'required|string|max:200',
            'content'      => 'required|string',
            'stat_1_value' => 'nullable|string|max:50',
            'stat_1_label' => 'nullable|string|max:100',
            'stat_2_value' => 'nullable|string|max:50',
            'stat_2_label' => 'nullable|string|max:100',
            'stat_3_value' => 'nullable|string|max:50',
            'stat_3_label' => 'nullable|string|max:100',
            'is_active'    => 'nullable|boolean',
        ]);

        $about = WebAbout::firstOrNew([]);
        $about->fill($data)->save();
        return response()->json($about);
    }

    /* ═══════════════════════════════════════════════════════════════════════════
       ADMIN — Messages de contact reçus
       ═══════════════════════════════════════════════════════════════════════════ */

    public function adminContactsList(): JsonResponse
    {
        return response()->json(WebContact::latest()->get());
    }

    public function adminContactMarkRead(int $id): JsonResponse
    {
        $contact = WebContact::findOrFail($id);
        $contact->update(['is_read' => true]);
        return response()->json($contact);
    }

    /* ═══════════════════════════════════════════════════════════════════════════
       ADMIN — Témoignages
       ═══════════════════════════════════════════════════════════════════════════ */

    public function adminTestimonialsList(): JsonResponse
    {
        return response()->json(WebTestimonial::orderBy('sort_order')->orderByDesc('created_at')->get());
    }

    public function adminTestimonialsStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom'        => 'required|string|max:150',
            'role'       => 'nullable|string|max:100',
            'photo'      => 'nullable|string|max:500',
            'texte'      => 'required|string',
            'note'       => 'nullable|integer|min:1|max:5',
            'is_active'  => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);
        return response()->json(WebTestimonial::create($data), 201);
    }

    public function adminTestimonialsUpdate(Request $request, int $id): JsonResponse
    {
        $item = WebTestimonial::findOrFail($id);
        $data = $request->validate([
            'nom'        => 'sometimes|required|string|max:150',
            'role'       => 'nullable|string|max:100',
            'photo'      => 'nullable|string|max:500',
            'texte'      => 'sometimes|required|string',
            'note'       => 'nullable|integer|min:1|max:5',
            'is_active'  => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);
        $item->update($data);
        return response()->json($item);
    }

    public function adminTestimonialsDestroy(int $id): JsonResponse
    {
        WebTestimonial::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function adminTestimonialsToggle(int $id): JsonResponse
    {
        $item = WebTestimonial::findOrFail($id);
        $item->update(['is_active' => !$item->is_active]);
        return response()->json($item);
    }

    /* ═══════════════════════════════════════════════════════════════════════════
       ADMIN — FAQ
       ═══════════════════════════════════════════════════════════════════════════ */

    public function adminFaqList(): JsonResponse
    {
        return response()->json(WebFaq::orderBy('sort_order')->orderBy('id')->get());
    }

    public function adminFaqStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'question'   => 'required|string|max:500',
            'reponse'    => 'required|string',
            'is_active'  => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);
        return response()->json(WebFaq::create($data), 201);
    }

    public function adminFaqUpdate(Request $request, int $id): JsonResponse
    {
        $item = WebFaq::findOrFail($id);
        $data = $request->validate([
            'question'   => 'sometimes|required|string|max:500',
            'reponse'    => 'sometimes|required|string',
            'is_active'  => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);
        $item->update($data);
        return response()->json($item);
    }

    public function adminFaqDestroy(int $id): JsonResponse
    {
        WebFaq::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    /* POST /api/v1/public/appointments ──────────────────────────────────── */
    public function publicAppointment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'consulting_doctor_id' => 'nullable|string|max:20',
            'appointment_date'     => 'required|date|after_or_equal:today',
            'nom_patient'          => 'required|string|max:150',
            'telephone'            => 'required|string|max:50',
            'email'                => 'required|email|max:100',
            'remarks'              => 'nullable|string|max:500',
        ]);

        $dateStr = Carbon::parse($data['appointment_date'])->toDateString();

        // Contrôle de doublon : même téléphone OU email + même date + non annulé
        $duplicate = DB::table('app_txn_appointments')
            ->whereDate('appointment_date', $dateStr)
            ->where('statut_app', '!=', 2)
            ->where(function ($q) use ($data) {
                $q->where('telephone', $data['telephone'])
                  ->orWhere(function ($q2) use ($data) {
                      $q2->whereNotNull('email')
                         ->where('email', '!=', '')
                         ->where('email', $data['email']);
                  });
            })
            ->exists();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'Une demande existe déjà pour cette date avec ce numéro de téléphone ou cet email. Veuillez nous contacter si vous souhaitez modifier votre demande.',
            ], 409);
        }

        $lastId = DB::table('app_txn_appointments')->max('id_Rep');
        $newNum = ($lastId ?? 0) + 1;
        $apptId = 'APT' . str_pad($newNum, 7, '0', STR_PAD_LEFT);

        DB::table('app_txn_appointments')->insert([
            'appointment_id'       => $apptId,
            'patient_id'           => 'WEB-' . $apptId,
            'appointment_date'     => $dateStr,
            'start_time'           => $dateStr . ' 08:00:00',
            'end_time'             => $dateStr . ' 08:30:00',
            'consulting_doctor_id' => $data['consulting_doctor_id'] ?? null,
            'appointment_type'     => 'consultation',
            'patient_type'         => 'nouveau',
            'remarks'              => $data['remarks'] ?? null,
            'telephone'            => $data['telephone'],
            'email'                => $data['email'] ?? null,
            'nom_personne'         => $data['nom_patient'],
            'personne_pris'        => 'patient',
            'statut_app'           => 0,
            'status_id'            => 1,
            'created_user_id'      => 'WEB',
            'created_dttm'         => now(),
        ]);

        return response()->json([
            'success'   => true,
            'message'   => 'Votre demande de rendez-vous a été enregistrée. Notre équipe vous contactera pour confirmer.',
            'reference' => $apptId,
        ], 201);
    }
}