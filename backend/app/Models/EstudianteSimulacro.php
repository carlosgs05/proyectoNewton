<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstudianteSimulacro extends Model
{
    use HasFactory;

    protected $connection = 'dbnewton';
    protected $table = 'estudiante_simulacro';
    protected $primaryKey = ['idsimulacro', 'idusuario'];
    public $incrementing = false;

    protected $fillable = [
        'idsimulacro',
        'idusuario',
        'pdfhojarespuesta',
        'puntajetotal'
    ];

    public $timestamps = true;

    public function respuestas()
    {
        return $this->hasMany(EstudianteRespuesta::class, 'idsimulacro', 'idsimulacro')
            ->where('idusuario', $this->idusuario);
    }
}
