<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ETLService
{
    public function runFullETL()
    {
        try {
            DB::connection('datamart_newton')->beginTransaction();
            
            $this->clearAllDimensions();
            $this->cargarDimensionUsuario();
            $this->cargarDimensionTiempo();
            $this->cargarDimensionTema();
            $this->cargarHechosSimulacro();
            
            DB::connection('datamart_newton')->commit();
        } catch (\Exception $e) {
            DB::connection('datamart_newton')->rollBack();
            throw $e;
        }
    }

    // Métodos individuales para testing
    public function clearAllDimensions()
    {
        DB::connection('datamart_newton')->statement('TRUNCATE TABLE hecho_simulacro RESTART IDENTITY CASCADE');
        DB::connection('datamart_newton')->statement('TRUNCATE TABLE dim_usuario RESTART IDENTITY CASCADE');
        DB::connection('datamart_newton')->statement('TRUNCATE TABLE dim_tiempo RESTART IDENTITY CASCADE');
        DB::connection('datamart_newton')->statement('TRUNCATE TABLE dim_tema RESTART IDENTITY CASCADE');
    }

    public function cargarDimensionUsuario()
    {
        $usuarios = DB::connection('dbnewton')
            ->table('usuario')
            ->where('idrol', 2)
            ->select('idusuario', 'nombre', 'apellido')
            ->get();

        $data = $usuarios->map(function ($user) {
            return [
                'idusuario' => $user->idusuario,
                'nombrecompleto' => $user->nombre . ' ' . $user->apellido
            ];
        });

        DB::connection('datamart_newton')
            ->table('dim_usuario')
            ->insert($data->toArray());
    }

    public function cargarDimensionTiempo()
    {
        $fechas = DB::connection('dbnewton')
            ->table('estudiante_simulacro')
            ->selectRaw('DISTINCT DATE(created_at) as fecha')
            ->union(
                DB::connection('dbnewton')
                    ->table('estudiante_simulacro')
                    ->selectRaw('DISTINCT DATE(updated_at) as fecha')
            )
            ->get()
            ->map(function ($item) {
                return $item->fecha;
            })
            ->unique();

        foreach ($fechas as $fecha) {
            $date = Carbon::parse($fecha);
            DB::connection('datamart_newton')
                ->table('dim_tiempo')
                ->insert([
                    'idFecha' => $date->toDateString(),
                    'anio' => $date->year,
                    'mes' => $date->month
                ]);
        }
    }

    public function cargarDimensionTema()
    {
        $temas = DB::connection('dbnewton')
            ->table('tema')
            ->join('curso', 'tema.idCurso', '=', 'curso.idCurso')
            ->select('tema.idTema', 'curso.NombreCurso', 'tema.NombreTema')
            ->get();

        DB::connection('datamart_newton')
            ->table('dim_tema')
            ->insert($temas->toArray());
    }

    public function cargarHechosSimulacro()
    {
        $resultados = DB::connection('dbnewton')
            ->table('estudiante_simulacro as es')
            ->select([
                'es.idUsuario',
                DB::raw('DATE(es.created_at) as fecha'),
                'p.idTema',
                DB::raw('COUNT(*) as total_preguntas'),
                DB::raw('SUM(CASE WHEN es.Resultado = true THEN 1 ELSE 0 END) as correctas'),
                DB::raw('SUM(CASE WHEN es.Resultado = false THEN 1 ELSE 0 END) as incorrectas'),
                DB::raw('SUM(CASE WHEN es.OpcionSeleccionada IS NULL THEN 1 ELSE 0 END) as en_blanco'),
                DB::raw('SUM(es.TiempoSegundos) as tiempo_total_seg')
            ])
            ->join('pregunta as p', 'es.idPregunta', '=', 'p.idPregunta')
            ->groupBy('es.idUsuario', 'fecha', 'p.idTema')
            ->get();

        foreach ($resultados as $row) {
            $this->insertHechoSimulacro($row);
        }
    }

    private function insertHechoSimulacro($row)
    {
        $keys = [
            'usuario' => DB::connection('datamart_newton')
                ->table('dim_usuario')
                ->where('idUsuario', $row->idUsuario)
                ->value('keyUsuario'),
            
            'tiempo' => DB::connection('datamart_newton')
                ->table('dim_tiempo')
                ->where('idFecha', $row->fecha)
                ->value('keyTiempo'),
            
            'tema' => DB::connection('datamart_newton')
                ->table('dim_tema')
                ->where('idTema', $row->idTema)
                ->value('keyTema')
        ];

        if (!array_filter($keys)) return;

        $puntaje = ($row->correctas * 4.07) + ($row->incorrectas * -1.0175) + ($row->en_blanco * 0);

        DB::connection('datamart_newton')
            ->table('hecho_simulacro')
            ->insert([
                'keyUsuario' => $keys['usuario'],
                'keyTiempo' => $keys['tiempo'],
                'keyTema' => $keys['tema'],
                'total_preguntas' => $row->total_preguntas,
                'correctas' => $row->correctas,
                'incorrectas' => $row->incorrectas,
                'en_blanco' => $row->en_blanco,
                'tiempo_total_seg' => $row->tiempo_total_seg,
                'puntaje_total' => $puntaje
            ]);
    }
}