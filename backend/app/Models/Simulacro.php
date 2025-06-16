<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Simulacro extends Model
{

    protected $connection = 'dbnewton';

    protected $table = 'simulacro';

    protected $primaryKey = 'idsimulacro';

    public $timestamps = false;

    protected $fillable = [
        'nombresimulacro',
        'pdfexamen',
        'pdfrespuestas',
        'pdfsolucionario',
        'created_at',
    ];

    /**
     * Relación 1:N con simulacro_pregunta
     */
    public function preguntas(): HasMany
    {
        return $this->hasMany(SimulacroPregunta::class, 'idsimulacro', 'idsimulacro');
    }

    /**
     * Relación 1:N con estudiante_simulacro
     */
    public function estudiantesSimulacro(): HasMany
    {
        return $this->hasMany(EstudianteSimulacro::class, 'idsimulacro', 'idsimulacro');
    }
}
