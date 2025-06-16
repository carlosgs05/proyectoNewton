# import google.generativeai as genai

# # 1. Configurar clave de API
# genai.configure(api_key="AIzaSyCBFd1kU0irpvTGMERq_gwH1B519WDTds4")

# # 2. Modelo gratuito
# cliente = genai.GenerativeModel("gemini-1.5-flash")

# # 3. Ruta al PDF (asegúrate de que existe)
# pdf_path = r"D:\UNT\IX CICLO\CURSOS\GESTIÓN DE PROYECTOS DE TI\PROYECTO\PROYECTO NEWTON\python\simulacro_area_b_01.pdf"
# pdf_file = genai.upload_file(pdf_path)

# # 4. Lista de preguntas que deseas analizar
# numeros_preguntas = [3, 5, 8]

# # 5. Prompt modificado
# prompt = f"""
# Analiza el PDF adjunto que contiene un examen de simulacro con preguntas numeradas como 1., 2., 3., etc.

# Tu tarea es:
# - Para cada una de las siguientes preguntas: {numeros_preguntas}
# - Indica el **nombre del curso** al que pertenece (por ejemplo: Comunicación, Matemática, Razonamiento Verbal, Ciencia, etc.)
# - También indica el **tema específico** que trata la pregunta (por ejemplo: comprensión de lectura, álgebra, biología, etc.)

# No incluyas el enunciado completo de la pregunta. Solo responde en el siguiente formato:

# Pregunta 3:  
# Curso: Comunicación  
# Tema: Comprensión lectora

# Pregunta 5:  
# Curso: Matemática  
# Tema: Álgebra

# (etc.)
# """

# # 6. Llamada al modelo con límite de tokens
# respuesta = cliente.generate_content(
#     [prompt, pdf_file],
#     generation_config={
#         "max_output_tokens": 512
#     },
#     stream=False
# )

# # 7. Mostrar resultado
# print("📚 Clasificación por curso y tema:")
# print(respuesta.text)

# # 8. (Opcional) Borrar archivo del servidor
# genai.delete_file(pdf_file.name)

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import tempfile, os, json
import google.generativeai as genai
from difflib import get_close_matches

# Configurar API key
genai.configure(api_key="AIzaSyCBFd1kU0irpvTGMERq_gwH1B519WDTds4")

router = APIRouter()

class Tema(BaseModel):
    idtema: int
    nombretema: str

class Curso(BaseModel):
    nombrecurso: str
    idcurso: int
    lista_errores: List[int]
    temas: List[Tema]

class InputData(BaseModel):
    cursos: List[Curso]

@router.post("/feedback-simulacro")
async def feedback_simulacro(file: UploadFile = File(...), datos: str = Form(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")

    try:
        datos_json = json.loads(datos)
        input_data = InputData(**datos_json)

        temas_validos = {}
        temas_id_por_nombre = {}
        for curso in input_data.cursos:
            key = (curso.idcurso, curso.nombrecurso.lower().strip())
            temas_validos[key] = {t.nombretema.lower().strip(): t.idtema for t in curso.temas}
            temas_id_por_nombre.update({(key, t.nombretema.lower().strip()): (t.idtema, t.nombretema) for t in curso.temas})

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            pdf_path = tmp.name

        pdf_file = genai.upload_file(pdf_path)

        # PROMPT MEJORADO CON INSTRUCCIONES DE CONSISTENCIA
        prompt = """
Eres un docente preuniversitario experto en diversas asignaturas. Preparas estudiantes para ingresar a la Universidad Nacional de Trujillo (UNT), Perú. Te proporciono un PDF de un simulacro con preguntas numeradas y una lista de cursos, temas y errores por curso.

Tu análisis debe cumplir estas reglas:

1. Examina cada pregunta errada del PDF en detalle. Algunas pueden contener imágenes, viñetas, diagramas o estructuras complejas.
2. Clasifica cada pregunta errada (por número) en **uno de los temas disponibles** del curso correspondiente. No inventes temas.
3. Usa razonamiento experto y pedagógico. Considera subtemas, estructura del enunciado, habilidades cognitivas evaluadas, palabras clave y estilo común del curso.
4. Usa tu criterio como docente profesional: si una pregunta coincide parcialmente con más de un tema, asigna el tema más representativo académicamente.
5. Usa el `idtema` y el `nombretema` exactos que te brindo por curso. No uses sinónimos ni variaciones.
6. Si una pregunta ya ha sido clasificada en ejecuciones anteriores correctamente, **debes conservar ese mismo resultado para mantener la consistencia**. No cambies el tema si los datos de entrada son los mismos.
7. No dejes preguntas sin clasificar si están listadas como erradas.
8. Si ves una pregunta con elementos como calendarios, días de la semana y no se utilice formulas de cualquier rama de la matematica y no incluyan proporcion en porcentaje o cualquier otra por matematica clasifícalas como temas de *Lógica* si aplica (inferencia logica, razonamiento comun), incluso si no se menciona esa palabra.
9. Si en una ejecución anterior esta pregunta ya fue clasificada en un tema específico, debes mantener exactamente el mismo tema (mismo `idtema` y `nombretema`) en todas las ejecuciones posteriores con los mismos datos de entrada. Considera esto como una política estricta de consistencia en la clasificación.
10. No cambies de tema para una pregunta a menos que se modifiquen los datos de entrada o el contenido del PDF. La coherencia entre ejecuciones es prioritaria, especialmente si la pregunta ya ha sido asociada con éxito a un tema.
11. Tu rol incluye actuar como un docente sistemático que registra decisiones previas y las mantiene para asegurar una retroalimentación estable y confiable al estudiante.

Además, genera un segundo bloque llamado `"feedback"` que cumpla lo siguiente:

- Escribe un párrafo largo, motivador y pedagógico.
- Resume los cursos donde el estudiante tuvo errores, mencionando preguntas específicas y temas asignados.
- Incluye recomendaciones concretas por curso y tema.
- Usa un tono amigable y profesional como el de un maestro que guía a su estudiante a mejorar.
- Finaliza motivando al estudiante a continuar mejorando.

Devuelve el resultado en el siguiente formato JSON exacto:

{
  "feedback": "Texto motivador que incluya observaciones por curso, temas, recomendaciones y cierre positivo.",
  "temas_detectados": [
    {
      "nombrecurso": "...",
      "idcurso": ...,
      "errores": [
        {"numeropregunta": ..., "idtema": ..., "nombretema": "..."}
      ]
    }
  ]
}
"""

        for curso in input_data.cursos:
            temas = ', '.join([f"{t.nombretema} (id: {t.idtema})" for t in curso.temas])
            errores = ', '.join(map(str, curso.lista_errores))
            prompt += f"\nCurso: {curso.nombrecurso} (id: {curso.idcurso})\nTemas disponibles: {temas}\nPreguntas erradas: {errores}\n"

        modelo = genai.GenerativeModel("gemini-1.5-flash")
        respuesta = modelo.generate_content(
            [prompt, pdf_file],
            generation_config={"max_output_tokens": 2048,"temperature": 0},
            stream=False
        )

        os.remove(pdf_path)
        genai.delete_file(pdf_file.name)

        raw_text = respuesta.text.strip()
        try:
            parsed = json.loads(raw_text)
            feedback = parsed.get("feedback")
            temas_detectados = parsed.get("temas_detectados")
        except json.JSONDecodeError:
            feedback = None
            temas_detectados = []
            if '"feedback"' in raw_text and '"temas_detectados"' in raw_text:
                start = raw_text.find('{')
                end = raw_text.rfind('}') + 1
                try:
                    parsed = json.loads(raw_text[start:end])
                    feedback = parsed.get("feedback")
                    temas_detectados = parsed.get("temas_detectados")
                except:
                    pass
            if feedback is None:
                feedback = raw_text

        for curso_resultado in temas_detectados:
            idcurso = curso_resultado["idcurso"]
            nombrecurso = curso_resultado["nombrecurso"].lower().strip()
            key = (idcurso, nombrecurso)
            temas_validos_curso = temas_validos.get(key, {})

            errores_actualizados = []
            for error in curso_resultado.get("errores", []):
                nombre_detectado = error["nombretema"].lower().strip()
                if nombre_detectado in temas_validos_curso:
                    error["idtema"] = temas_validos_curso[nombre_detectado]
                    errores_actualizados.append(error)
                else:
                    parecido = get_close_matches(nombre_detectado, temas_validos_curso.keys(), n=1)
                    if parecido:
                        idtema = temas_validos_curso[parecido[0]]
                        error["nombretema"] = parecido[0]
                        error["idtema"] = idtema
                        errores_actualizados.append(error)
            curso_resultado["errores"] = errores_actualizados

        return {
            "success": True,
            "feedback": feedback,
            "temas_detectados": temas_detectados
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Error en procesamiento: {str(e)}"})