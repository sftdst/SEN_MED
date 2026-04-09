<?php

namespace Database\Factories;

use App\Models\PartenaireHeader;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PartenaireHeader>
 */
class PartenaireHeaderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $typePartenaireKeys = array_keys(PartenaireHeader::TYPES_PARTENAIRE);
        $typeSocieteKeys = array_keys(PartenaireHeader::TYPES_SOCIETE);
        $countries = ['Sénégal', 'Mali', 'Mauritanie', 'Côte d\'Ivoire', 'Guinée'];
        $cities = ['Dakar', 'Bamako', 'Nouakchott', 'Abidjan', 'Conakry'];
        $banks = ['BICIS', 'CBAO', 'SG Sénégal', 'BOA Sénégal', 'ECOBANK'];

        $idPartenaire = 'PAR-' . strtoupper(Str::random(8));
        $nameLower = strtolower(fake()->company());

        return [
            'id_gen_partenaire' => $idPartenaire,
            'Nom' => fake()->company(),
            'pays' => fake()->randomElement($countries),
            'ville' => fake()->randomElement($cities),
            'adress' => fake()->address(),
            'contact' => fake()->name(),
            'mobile' => fake()->numerify('(###) ###-####'),
            'bank' => fake()->randomElement($banks),
            'email' => fake()->unique()->companyEmail(),
            'type_societe' => fake()->randomElement($typeSocieteKeys),
            'numero_compte' => fake()->numerify('####################'),
            'maximum_credit' => fake()->numberBetween(500000, 50000000),
            'pending_amount' => fake()->numberBetween(0, 10000000),
            'paid_amount' => fake()->numberBetween(0, 20000000),
            'date_created' => fake()->dateTime(),
            'code_societe' => strtoupper(Str::random(4)) . '-' . fake()->numerify('####'),
            'status' => true,
            'TypePart' => fake()->randomElement($typePartenaireKeys),
        ];
    }

    /**
     * Indicate that the partenaire is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => true,
        ]);
    }

    /**
     * Indicate that the partenaire is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => false,
        ]);
    }

    /**
     * Create a partenaire with type Assurance.
     */
    public function assurance(): static
    {
        return $this->state(fn (array $attributes) => [
            'TypePart' => 0,
            'type_societe' => 'SA',
        ]);
    }

    /**
     * Create a partenaire with type Mutuelle.
     */
    public function mutuelle(): static
    {
        return $this->state(fn (array $attributes) => [
            'TypePart' => 1,
            'type_societe' => 'SARL',
        ]);
    }

    /**
     * Create a partenaire with type Entreprise.
     */
    public function entreprise(): static
    {
        return $this->state(fn (array $attributes) => [
            'TypePart' => 2,
        ]);
    }
}
