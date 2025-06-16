<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SimulacroPregunta extends Model
{
    use HasFactory;

    protected $connection = 'dbnewton';
    protected $table = 'simulacro_pregunta';

    public $incrementing = false;
    public $timestamps = false;

    protected $primaryKey = ['idSimulacro', 'numeroPregunta'];

    protected $keyType = 'int';

    protected $fillable = [
        'idSimulacro',
        'numeroPregunta',
        'idCurso',
        'OpcionCorrecta',
    ];

    /**
     * Relación a simulacro
     */
    public function simulacro(): BelongsTo
    {
        return $this->belongsTo(Simulacro::class, 'idSimulacro', 'idSimulacro');
    }

    /**
     * Relación a curso
     */
    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'idCurso', 'idCurso');
    }

    /**
     * Relación a respuestas de estudiantes
     * Nota: Eloquent no soporta claves foráneas compuestas directamente en relaciones.
     * Debe filtrarse manualmente o usar una clave única auxiliar.
     */
    public function respuestasEstudiantes()
    {
        return $this->hasMany(EstudianteRespuesta::class, 'idSimulacro', 'idSimulacro')
            ->where('numeroPregunta', $this->numeroPregunta);
    }
}
