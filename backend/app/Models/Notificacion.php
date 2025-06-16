<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Notificacion extends Model
{
    use HasFactory;

    protected $connection = 'dbnewton';
    protected $table = 'notificacion';
    protected $primaryKey = 'idnotificacion';
    public $timestamps = false;

    protected $fillable = [
        'idusuario',
        'titulo',
        'mensaje',
        'url_destino',
        'leida',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'leida' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relación con el modelo Usuario si lo tienes
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'idusuario');
    }
}