from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import json
import re
import unidecode
import fitz  # PyMuPDF
from collections import defaultdict
import tempfile
import os

router = APIRouter()

def normalizar_texto(texto):
    texto = unidecode.unidecode(texto).lower()
    texto = re.sub(r'[^\w\s]', '', texto)
    return re.sub(r'\s+', ' ', texto).strip()

def es_titulo_valido(texto, cursos_normalizados, ancho_linea, ancho_pagina):
    texto_norm = normalizar_texto(texto)
    if texto_norm not in cursos_normalizados:
        return False
    if texto.isupper():
        return True
    proporcion_ancho = ancho_linea / ancho_pagina
    return proporcion_ancho > 0.3

def es_negrita(span):
    fuente = span.get("font", "").lower()
    palabras_negrita = ["bold", "black", "heavy", "demibold", "extrabold", "semibold"]
    return any(palabra in fuente for palabra in palabras_negrita)

def procesar_pagina_con_texto(pagina, cursos_normalizados):
    titulos = []
    preguntas = []
    texto = pagina.get_text("dict")
    ancho_pagina = pagina.rect.width

    for block in texto["blocks"]:
        if block["type"] == 0:
            for line in block["lines"]:
                texto_linea = ""
                bbox_linea = None
                spans_linea = []

                spans = line["spans"]
                for span in spans:
                    if bbox_linea is None:
                        bbox_linea = fitz.Rect(span["bbox"])
                    else:
                        bbox_linea.include_rect(fitz.Rect(span["bbox"]))
                    texto_linea += span["text"]
                    spans_linea.append(span)

                texto_linea = texto_linea.strip()

                numero_encontrado = None
                for span in spans:
                    texto_span = span["text"].strip()
                    m = re.match(r'^(\d{1,3})\.', texto_span)
                    if m and es_negrita(span):
                        numero_encontrado = int(m.group(1))
                        break

                if texto_linea:
                    es_titulo = False
                    if all(es_negrita(span) for span in spans_linea):
                        es_titulo = es_titulo_valido(texto_linea, cursos_normalizados, bbox_linea.width, ancho_pagina)

                    if not es_titulo:
                        es_titulo = es_titulo_valido(texto_linea, cursos_normalizados, bbox_linea.width, ancho_pagina)

                    if es_titulo:
                        titulos.append({
                            "texto": texto_linea,
                            "bbox": bbox_linea,
                            "pagina": pagina.number + 1,
                            "ancho_pagina": ancho_pagina
                        })

                    if numero_encontrado is not None and 1 <= numero_encontrado <= 100:
                        preguntas.append({
                            "numero": numero_encontrado,
                            "texto": texto_linea,
                            "bbox": bbox_linea,
                            "pagina": pagina.number + 1,
                            "ancho_pagina": ancho_pagina
                        })

    return titulos, preguntas

def ordenar_por_posicion_pag_columna(items):
    agrupado = defaultdict(list)
    for i in items:
        agrupado[i["pagina"]].append(i)

    orden_final = []
    for pagina in sorted(agrupado.keys()):
        items_pagina = agrupado[pagina]
        if not items_pagina:
            continue
        ancho_pagina = items_pagina[0]["ancho_pagina"]
        centro_x = ancho_pagina / 2

        columna_izquierda = [it for it in items_pagina if it["bbox"].x0 < centro_x]
        columna_derecha = [it for it in items_pagina if it["bbox"].x0 >= centro_x]

        columna_izquierda = sorted(columna_izquierda, key=lambda x: x["bbox"].y0)
        columna_derecha = sorted(columna_derecha, key=lambda x: x["bbox"].y0)

        orden_final.extend(columna_izquierda)
        orden_final.extend(columna_derecha)

    return orden_final

@router.post("/ordenar-cursos-preguntas")
async def ordenar_cursos_preguntas(pdf_file: UploadFile = File(...), json_file: UploadFile = File(...)):
    try:
        # Usar un directorio temporal para evitar bloqueo en Windows
        with tempfile.TemporaryDirectory() as temp_dir:
            pdf_path = os.path.join(temp_dir, "archivo.pdf")
            json_path = os.path.join(temp_dir, "cursos.json")

            # Guardar archivos temporalmente
            contenido_pdf = await pdf_file.read()
            contenido_json = await json_file.read()

            with open(pdf_path, "wb") as f_pdf:
                f_pdf.write(contenido_pdf)

            with open(json_path, "wb") as f_json:
                f_json.write(contenido_json)

            # Cargar JSON cursos
            with open(json_path, 'r', encoding='utf-8') as f:
                cursos_data = json.load(f)

            cursos_originales = [curso['nombrecurso'] for curso in cursos_data['data']]
            cursos_normalizados = [normalizar_texto(curso) for curso in cursos_originales]
            cursos_id_map = {normalizar_texto(curso['nombrecurso']): curso['idcurso'] for curso in cursos_data['data']}

            pdf = fitz.open(pdf_path)

            titulos_detectados = []
            preguntas_detectadas = []

            for page_num in range(len(pdf)):
                pagina = pdf.load_page(page_num)
                titulos_pagina, preguntas_pagina = procesar_pagina_con_texto(pagina, cursos_normalizados)

                titulos_detectados.extend(titulos_pagina)
                preguntas_detectadas.extend(preguntas_pagina)

            titulos_ordenados = ordenar_por_posicion_pag_columna(titulos_detectados)
            preguntas_ordenadas = sorted(preguntas_detectadas, key=lambda p: p["numero"])
            preguntas_ordenadas_pos = ordenar_por_posicion_pag_columna(preguntas_detectadas)

            pregunta_inicio_por_curso = []
            for titulo in titulos_ordenados:
                pagina_t = titulo["pagina"]
                y0_t = titulo["bbox"].y0
                x0_t = titulo["bbox"].x0
                ancho_pagina = titulo["ancho_pagina"]
                centro_x = ancho_pagina / 2

                encontrada = None
                for p in preguntas_ordenadas_pos:
                    if p["pagina"] > pagina_t:
                        encontrada = p
                        break
                    elif p["pagina"] == pagina_t:
                        p_columna = "izq" if p["bbox"].x0 < centro_x else "der"
                        t_columna = "izq" if x0_t < centro_x else "der"
                        if t_columna == "izq" and p_columna == "der":
                            encontrada = p
                            break
                        elif t_columna == p_columna:
                            if p["bbox"].y0 >= y0_t:
                                encontrada = p
                                break
                if encontrada is not None:
                    pregunta_inicio_por_curso.append(encontrada["numero"])
                else:
                    pregunta_inicio_por_curso.append(101)

            rangos_cursos = []
            for i, titulo in enumerate(titulos_ordenados):
                inicio = pregunta_inicio_por_curso[i]
                fin = pregunta_inicio_por_curso[i + 1] if i + 1 < len(titulos_ordenados) else 101
                rangos_cursos.append({
                    "curso_norm": normalizar_texto(titulo["texto"]),
                    "inicio": inicio,
                    "fin": fin
                })

            preguntas_por_curso = defaultdict(int)
            for p in preguntas_ordenadas:
                n = p["numero"]
                for rango in rangos_cursos:
                    if rango["inicio"] <= n < rango["fin"]:
                        preguntas_por_curso[rango["curso_norm"]] += 1
                        break

            resultado_json = []
            for num in range(1, 101):
                curso_asignado = ""
                idcurso_asignado = ""
                for rango in rangos_cursos:
                    if rango["inicio"] <= num < rango["fin"]:
                        curso_asignado = rango["curso_norm"]
                        break
                if curso_asignado:
                    idcurso_asignado = cursos_id_map.get(curso_asignado, "")
                    nombre_original = next((c['nombrecurso'] for c in cursos_data['data'] if normalizar_texto(c['nombrecurso']) == curso_asignado), "")
                else:
                    nombre_original = ""

                resultado_json.append({
                    "numeropregunta": num,
                    "idcurso": idcurso_asignado,
                    "nombrecurso": nombre_original
                })

            pdf.close()

            return {"success": True, "data": resultado_json}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": f"Error procesando archivos: {str(e)}"})
