<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class SimulacroController extends Controller
{
    public function registrarSimulacroEstudiante(Request $request)
    {
        // 1. Validar request
        $validator = Validator::make($request->all(), [
            'pdf' => 'required|file|mimes:pdf|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Archivo inválido',
                'detalles' => $validator->errors()
            ], 422);
        }

        // 2. Mover el PDF a la carpeta public/pdfs
        try {
            $pdf = $request->file('pdf');
            $filename = time() . '_' . $pdf->getClientOriginalName();
            $destinationPath = public_path('pdfs');
            
            // Crear directorio si no existe
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
            }
            
            $pdf->move($destinationPath, $filename);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error moviendo el archivo',
                'detalles' => $e->getMessage()
            ], 500);
        }

        // 3. Construir rutas con formato correcto para Windows
        $pythonScript = base_path('python\procesar_pdf.py');
        $pdfAbsolutePath = public_path('pdfs\\'.$filename);

        // 4. Configurar el proceso con variables de entorno
        $process = new Process([
            'C:\Users\Carlos\AppData\Local\Programs\Python\Python39\python.exe',
            $pythonScript,
            $pdfAbsolutePath
        ]);

        // Configurar entorno necesario para Python en Windows
        $process->setEnv([
            'PYTHONHASHSEED' => '0',
            'SYSTEMROOT' => getenv('SYSTEMROOT'),
            'PATH' => getenv('PATH')
        ]);

        $process->setTimeout(3600);
        $process->setIdleTimeout(300);

        try {
            $process->mustRun();
        } catch (ProcessFailedException $e) {
            return response()->json([
                'error' => 'Error procesando el PDF',
                'detalles' => $e->getMessage(),
                'output' => $process->getErrorOutput(),
                'command' => $process->getCommandLine() // Para debug
            ], 500);
        }

        // 5. Obtener y retornar JSON
        $output = $process->getOutput();

        try {
            $resultado = json_decode($output, true, 512, JSON_THROW_ON_ERROR);
            return response()->json($resultado);
        } catch (\JsonException $e) {
            return response()->json([
                'error' => 'Error decodificando JSON',
                'output' => $output,
                'exception' => $e->getMessage()
            ], 500);
        }
    }
}
