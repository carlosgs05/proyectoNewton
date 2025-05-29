<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaterialTema extends Model
{
    use HasFactory;

    protected $connection = 'dbnewton';
    protected $table = 'material_tema';
    protected $primaryKey = 'idmaterial';
    public $timestamps = false;
    protected $fillable = [
        'idtema',
        'tipomaterial',
        'nombrematerial',
        'url',
        'created_at',
    ];

    // Relación: un material pertenece a un tema
    public function tema()
    {
        return $this->belongsTo(Tema::class, 'idtema', 'idtema');
    }
}
