<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tema extends Model
{
    use HasFactory;

    protected $connection = 'dbnewton';
    protected $table = 'tema';
    protected $primaryKey = 'idtema';
    public $timestamps = false;
    protected $fillable = [
        'idcurso',
        'nombretema',
        'created_at',
    ];

    // Relación: un tema pertenece a un curso
    public function curso()
    {
        return $this->belongsTo(Curso::class, 'idcurso', 'idcurso');
    }

    // Relación: un tema tiene muchos materiales
    public function materiales()
    {
        return $this->hasMany(MaterialTema::class, 'idtema', 'idtema');
    }
}
