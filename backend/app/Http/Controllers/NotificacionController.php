<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use Carbon\Carbon;

class NotificacionController extends Controller
{
    /**
     * Devuelve todas las notificaciones de un usuario
     */
    public function listarNotificaciones($idusuario)
    {
        $notificaciones = Notificacion::where('idusuario', $idusuario)
            ->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $notificaciones,
            'status' => 200,
        ]);
    }

    /**
     * Marca una notificación como leída (actualiza leida = true y updated_at).
     */
    public function marcarComoLeida($idnotificacion)
    {
        // Verificamos que exista
        $not = Notificacion::where('idnotificacion', $idnotificacion)
            ->first();

        if (!$not) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada.',
            ], 404);
        }

        // Actualizamos solo si no está leída
        if (!$not->leida) {
            $not->leida = true;
            $not->updated_at = Carbon::now();
            $not->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Notificación marcada como leída.',
        ]);
    }
}
