<?php

namespace App\Providers;

use Fruitcake\Cors\CorsService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Lier CorsService avec les options du fichier config/cors.php
        // (Laravel ne fait pas cette liaison automatiquement)
        $this->app->singleton(CorsService::class, function ($app) {
            return new CorsService($app['config']->get('cors', []));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
