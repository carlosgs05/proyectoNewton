<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstudianteRespuesta extends Model
{
    use HasFactory;

    protected $connection = 'dbnewton';
    protected $table = 'estudiante_respuesta';
    protected $primaryKey = ['idsimulacro', 'idusuario', 'numeropregunta'];
    public $incrementing = false;

    protected $fillable = [
        'idsimulacro',
        'idusuario',
        'numeropregunta',
        'opcionseleccionada',
        'resultado'
    ];

    public $timestamps = false;

    public function simulacro()
    {
        return $this->belongsTo(EstudianteSimulacro::class, 'idsimulacro', 'idsimulacro')
            ->where('idusuario', $this->idusuario);
    }
}
