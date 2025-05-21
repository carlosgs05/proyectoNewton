<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Curso extends Model
{
    use HasFactory;

    protected $connection = 'dbnewton';
    protected $table = 'curso';
    protected $primaryKey = 'idcurso';
    public $timestamps = false;        // Solo manejamos created_at manualmente
    protected $fillable = [
        'nombrecurso',
        'created_at',
    ];

    // Relación: un curso tiene muchos temas
    public function temas()
    {
        return $this->hasMany(Tema::class, 'idcurso', 'idcurso');
    }
}