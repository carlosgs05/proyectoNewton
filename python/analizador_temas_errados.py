from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Set, Tuple
import tempfile, os, json
import google.generativeai as genai
import re
from collections import defaultdict

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

class TemaRecomendado(BaseModel):
    idtema: int
    nombretema: str

class CursoTemasRecomendados(BaseModel):
    nombrecurso: str
    idcurso: int
    temas: List[TemaRecomendado]

class OutputData(BaseModel):
    feedback: str
    temas_recomendados: List[CursoTemasRecomendados]

@router.post("/feedback-simulacro", response_model=OutputData)
async def feedback_simulacro(file: UploadFile = File(...), datos: str = Form(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")

    try:
        # Procesar datos de entrada
        datos_json = json.loads(datos)
        input_data = InputData(**datos_json)
        
        # Crear estructuras para búsqueda rápida
        # 1. Mapa de temas por nombre (en minúsculas) para todos los cursos
        tema_map = {}
        # 2. Mapa de curso por nombre de tema
        curso_por_tema = {}
        # 3. Información de cursos por nombre
        curso_info = {}
        
        for curso in input_data.cursos:
            curso_key = curso.nombrecurso.lower()
            curso_info[curso_key] = (curso.idcurso, curso.nombrecurso)
            
            for tema in curso.temas:
                tema_key = tema.nombretema.lower()
                tema_map[tema_key] = tema
                curso_por_tema[tema_key] = curso_key

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            pdf_path = tmp.name

        pdf_file = genai.upload_file(pdf_path)

        # PROMPT MEJORADO CON LAS NUEVAS INSTRUCCIONES
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
        12. Si necesitas mencionar un tema que no aparece textualmente en la lista pero que conceptualmente corresponde a uno existente:
            - Identifica el tema más similar conceptualmente de la lista proporcionada
            - Usa EXACTAMENTE el nombre textual del tema como aparece en los datos de entrada
            - ENCIERRA SIEMPRE el nombre del tema entre comillas dobles
        13. Ejemplo: Si el tema en el JSON es "Oferta y demanda" pero tú piensas en "Ley de oferta":
            - Usa "Oferta y demanda" (el nombre exacto del JSON) entre comillas dobles


Además, genera un bloque de texto llamado `"feedback"` que cumpla lo siguiente:

- Escribe un párrafo no muy extenso (feedback resumido) pero que sea motivador y pedagógico y abarque lo siguiente:
- Resume los cursos donde el estudiante tuvo errores, mencionando **todos los cursos** sin excepción.
- Para cada curso:
   * Si tiene 4 o menos preguntas erradas: menciona los números de pregunta específicos
   * Si tiene más de 4 preguntas erradas: menciona los temas más importantes/relevantes (no menciones IDs)
- Al mencionar temas, debes usar EXACTAMENTE el nombre textual del tema como aparece en los datos de entrada, y ENCERRARLO ENTRE COMILLAS DOBLES. Por ejemplo: "Álgebra Lineal" o "Funciones Trigonométricas".
- Incluye recomendaciones concretas por curso y tema.
- **Nunca menciones IDs de cursos o temas** en el feedback.
- Usa un tono amigable y profesional como el de un maestro que guía a su estudiante a mejorar.
- Finaliza motivando al estudiante a continuar mejorando.

Devuelve SOLO el texto del "feedback", SIN ningún otro contenido. Asegúrate de que el texto comience directamente con el feedback y no incluya encabezados.
"""

        for curso in input_data.cursos:
            # Lista de temas con nombres textuales exactos
            temas = ', '.join([f'"{t.nombretema}"' for t in curso.temas])
            errores = ', '.join(map(str, curso.lista_errores))
            prompt += f"\nCurso: {curso.nombrecurso}\nTemas disponibles: {temas}\nPreguntas erradas: {errores}\n"

        modelo = genai.GenerativeModel("gemini-1.5-flash")
        respuesta = modelo.generate_content(
            [prompt, pdf_file],
            generation_config={"temperature": 0},
            stream=False
        )

        os.remove(pdf_path)
        genai.delete_file(pdf_file.name)

        raw_text = respuesta.text.strip()

        # Verificar si la respuesta es nula o vacía
        if not raw_text:
            raise ValueError("El servicio de feedback devolvió una respuesta vacía")
            
        # Si el feedback incluye un encabezado, lo removemos
        if raw_text.startswith("Feedback:"):
            raw_text = raw_text.replace("Feedback:", "").strip()
        
        # ANALIZAR EL FEEDBACK PARA EXTRAER TEMAS MENCIONADOS
        # 1. Extraer todos los temas mencionados entre comillas dobles
        temas_mencionados = re.findall(r'"([^"]+)"', raw_text)
        
        # 2. Crear un diccionario para almacenar los temas encontrados por curso
        # Estructura: {curso_key: Set[(idtema, nombretema)]}
        temas_encontrados_por_curso = defaultdict(set)
        
        # 3. Para cada tema mencionado, buscar en nuestro mapa de temas
        for tema_nombre in temas_mencionados:
            tema_key = tema_nombre.lower()
            
            # Buscar en el mapa de temas
            if tema_key in tema_map:
                tema = tema_map[tema_key]
                curso_key = curso_por_tema[tema_key]
                
                # Agregar a la estructura de temas encontrados
                temas_encontrados_por_curso[curso_key].add((tema.idtema, tema.nombretema))
        
        # 4. Construir la estructura de respuesta
        temas_recomendados = []
        
        for curso_key, temas_set in temas_encontrados_por_curso.items():
            if curso_key in curso_info:
                idcurso, nombrecurso_original = curso_info[curso_key]
                
                temas_list = [
                    TemaRecomendado(idtema=t[0], nombretema=t[1])
                    for t in temas_set
                ]
                
                temas_recomendados.append(
                    CursoTemasRecomendados(
                        nombrecurso=nombrecurso_original,
                        idcurso=idcurso,
                        temas=temas_list
                    )
                )
        
        # 5. Preparar respuesta final
        return OutputData(
            feedback=raw_text,
            temas_recomendados=temas_recomendados
        )

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Error en procesamiento: {str(e)}"})