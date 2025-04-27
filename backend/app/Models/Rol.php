<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    use HasFactory;

    protected $connection = 'dbnewton';
    protected $table = 'rol';
    protected $primaryKey = 'idrol';

    protected $fillable = [
        'nombre',
        'created_at'
    ];

    public $timestamps = false;

    public function permisos()
    {
        return $this->belongsToMany(Permiso::class, 'rol_permiso', 'idrol', 'idpermiso');
    }
}
