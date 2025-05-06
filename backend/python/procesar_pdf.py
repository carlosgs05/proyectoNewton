#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
from PyPDF2 import PdfReader

def procesar_pdf(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() or ''

    # Dividir el texto en secciones usando el encabezado como separador
    secciones = text.split("#\nLlave\nStu\nPts\nPoss")[1:]
    
    resultados = []
    correctas = 0
    incorrectas = 0
    en_blanco = 0

    for seccion in secciones:
        content = [linea.strip() for linea in seccion.split('\n') if linea.strip()]
        i = 0
        
        while i < len(content) - 3:
            try:
                numero = int(content[i])
                llave = content[i+1]
                stu = content[i+2] if content[i+2] in ('A', 'B', 'C', 'D', 'E') else ""
                _ = content[i+3]  # Ignorar línea de puntos
                
                if stu:
                    correcta = (stu == llave)
                    correctas += 1 if correcta else 0
                    incorrectas += 1 if not correcta else 0
                else:
                    en_blanco += 1
                    correcta = False

                resultados.append({
                    "pregunta": numero,
                    "clave": llave,
                    "respuesta_estudiante": stu if stu else None,
                    "correcta": correcta
                })
                
                i += 4
            except (ValueError, IndexError):
                i += 1

    resultados = sorted(resultados, key=lambda x: x["pregunta"])
    if len(resultados) != 100:
        print(f"Advertencia: Procesadas {len(resultados)}/100 preguntas", file=sys.stderr)

    puntaje = round(correctas * 4.07 - incorrectas * 1.0175, 4)
    
    return {
        "resultados_por_pregunta": resultados,
        "estadisticas": {
            "correctas": correctas,
            "incorrectas": incorrectas,
            "en_blanco": en_blanco,
            "puntaje_total": puntaje
        }
    }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 procesar_pdf.py <ruta_pdf>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    resultado = procesar_pdf(pdf_path)
    print(json.dumps(resultado, ensure_ascii=False))
