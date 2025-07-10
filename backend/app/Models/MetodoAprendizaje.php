<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MetodoAprendizaje extends Model
{
    use HasFactory;

    protected $connection = 'dbnewton';
    protected $table = 'metodo_aprendizaje';
    protected $primaryKey = 'idmetodologia';

    protected $fillable = [
        'idusuario',
        'mes',
        'año',
        'lista_cursos'
    ];

    public $timestamps = false;

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'idusuario', 'idusuario');
    }
}