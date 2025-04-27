<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RolPermiso extends Model
{
    use HasFactory;
    
    protected $connection = 'dbnewton';
    protected $table = 'rol_permiso';
    protected $primaryKey = ['idrol', 'idpermiso'];
    
    public $incrementing = false;
    public $timestamps = false;
}