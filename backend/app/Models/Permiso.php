<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Permiso extends Model
{
    use HasFactory;

    protected $connection = 'dbnewton';
    protected $table = 'permiso';
    protected $primaryKey = 'idpermiso';

    protected $fillable = [
        'nombre',
        'created_at'
    ];

    public $timestamps = false;

    public function roles()
    {
        return $this->belongsToMany(Rol::class, 'rol_permiso', 'idpermiso', 'idrol');
    }
}
