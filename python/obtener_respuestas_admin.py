from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import io

router = APIRouter()

@router.post("/obtener-respuestas-admin")
async def obtener_respuestas_admin(file: UploadFile = File(...)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Archivo debe ser Excel (.xlsx o .xls)")

    try:
        contenido = await file.read()
        df_raw = pd.read_excel(io.BytesIO(contenido), header=None)

        encabezado_fila = None
        for i, row in df_raw.iterrows():
            row_str = row.astype(str).str.strip().str.lower()
            if 'pregunta' in row_str.values and 'opción correcta' in row_str.values:
                encabezado_fila = i
                break

        if encabezado_fila is None:
            return JSONResponse(status_code=400, content={"error": "No se encontró fila con encabezado 'PREGUNTA' y 'OPCIÓN CORRECTA'"})

        columnas_indices = [4, 5, 7, 8, 10, 11, 13, 14]
        tablas = []
        for i in range(0, len(columnas_indices), 2):
            cols = columnas_indices[i:i+2]

            df_tabla = pd.read_excel(
                io.BytesIO(contenido),
                header=encabezado_fila,
                usecols=cols
            )

            df_tabla.columns = [str(c).strip() for c in df_tabla.columns]

            pregunta_col = next((c for c in df_tabla.columns if 'pregunta' in c.lower()), None)
            opcion_col = next((c for c in df_tabla.columns if 'opción correcta' in c.lower()), None)

            if pregunta_col is None or opcion_col is None:
                continue

            df_tabla = df_tabla[[pregunta_col, opcion_col]].copy()
            df_tabla.rename(columns={pregunta_col: 'numeropregunta', opcion_col: 'opcioncorrecta'}, inplace=True)

            tablas.append(df_tabla)

        if not tablas:
            return JSONResponse(status_code=400, content={"error": "No se encontraron tablas válidas."})

        df_final = pd.concat(tablas, ignore_index=True)
        df_final.dropna(subset=['numeropregunta', 'opcioncorrecta'], inplace=True)
        df_final['numeropregunta'] = pd.to_numeric(df_final['numeropregunta'], errors='coerce')
        df_final.dropna(subset=['numeropregunta'], inplace=True)
        df_final['numeropregunta'] = df_final['numeropregunta'].astype(int)
        df_final.sort_values('numeropregunta', inplace=True)

        json_result = df_final.to_dict(orient='records')
        return {"success": True, "data": json_result}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Error procesando archivo: {str(e)}"})