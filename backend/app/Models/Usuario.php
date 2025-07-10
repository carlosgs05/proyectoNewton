<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Model
{
    use HasFactory, HasApiTokens;

    protected $connection = 'dbnewton';
    protected $table = 'usuario';
    protected $primaryKey = 'idusuario';

    protected $fillable = [
        'nombre',
        'apellido',
        'dni',
        'correo',
        'contrasena',
        'celular',
        'codigomatricula',
        'idrol',
        'passwordenc',
        'activo',
        'created_at',
        'updated_at'
    ];

    public $timestamps = false;

    public function rol()
    {
        return $this->belongsTo(Rol::class, 'idrol');
    }

    public function metodosAprendizaje()
    {
        return $this->hasMany(MetodoAprendizaje::class, 'idusuario', 'idusuario');
    }
}
