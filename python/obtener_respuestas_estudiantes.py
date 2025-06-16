from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import json
import io
from tempfile import NamedTemporaryFile
from typing import List, Dict

router = APIRouter()

def detect_columns(img):
    """Divide la imagen corregida en 4 columnas con padding interno."""
    h, w = img.shape[:2]
    col_w = w // 4
    bounds = []
    pad_x, pad_y = 8, 8
    for i in range(4):
        x0 = i * col_w + pad_x
        x1 = (i+1)*col_w - pad_x if i<3 else w - pad_x
        bounds.append((x0, pad_y, x1 - x0, h - 2*pad_y))
    return bounds

def detect_rows(col_img):
    """Divide cada columna en filas usando proyección vertical con ajustes dinámicos."""
    gray = cv2.cvtColor(col_img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    
    projection = np.sum(thresh, axis=1) / 255
    h = col_img.shape[0]
    
    kernel_size = max(3, h // 100)
    kernel = np.ones(kernel_size) / kernel_size
    smoothed = np.convolve(projection, kernel, mode='same')
    
    peaks = []
    threshold = np.mean(smoothed) * 0.8
    for i in range(1, len(smoothed)-1):
        if smoothed[i] > threshold and smoothed[i] > smoothed[i-1] and smoothed[i] > smoothed[i+1]:
            peaks.append(i)
    
    if len(peaks) < 20:
        return detect_rows_fallback(col_img)
    
    clustered = []
    cluster_thresh = h // 50
    current_cluster = []
    for peak in sorted(peaks):
        if not current_cluster:
            current_cluster.append(peak)
        else:
            if peak - current_cluster[0] < cluster_thresh:
                current_cluster.append(peak)
            else:
                clustered.append(int(np.mean(current_cluster)))
                current_cluster = [peak]
    if current_cluster:
        clustered.append(int(np.mean(current_cluster)))
    
    clustered = sorted(clustered)
    
    start_index = 0
    for i, peak in enumerate(clustered):
        if peak > h * 0.1:
            start_index = i
            break
    
    if len(clustered) - start_index < 25:
        return detect_rows_fallback(col_img)
    
    clustered = clustered[start_index:start_index+25]
    
    rows = []
    for i in range(25):
        center = clustered[i]
        y0 = center - h//70
        y1 = center + h//70
        
        if i == 0:
            y0 = max(0, center - h//60)
        elif i == 24:
            y1 = min(h, center + h//60)
        
        if i > 0 and y0 < rows[i-1][1]:
            y0 = rows[i-1][1] + 1
            
        rows.append((int(y0), int(y1)))
    
    return rows

def detect_rows_fallback(col_img):
    h = col_img.shape[0]
    
    gray = cv2.cvtColor(col_img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    projection = np.sum(thresh, axis=1) / 255
    
    start_index = 0
    threshold = np.max(projection) * 0.1
    for i in range(len(projection)):
        if projection[i] > threshold:
            start_index = i
            break
    
    height_available = h - start_index
    row_h = height_available / 25.0
    
    rows = []
    for i in range(25):
        y0 = int(start_index + i * row_h)
        y1 = int(start_index + (i+1) * row_h)
        rows.append((y0, y1))
    return rows

def get_bubble_darkness(bubble_roi):
    """Calcula el nivel de oscuridad de una burbuja."""
    if bubble_roi.size == 0:
        return 255  # Valor alto para burbujas vacías
    gray = cv2.cvtColor(bubble_roi, cv2.COLOR_BGR2GRAY)
    return np.mean(gray)

def mark(img, col_bounds, output_img):
    marked = img.copy()
    respuestas = {str(i): None for i in range(1, 101)}

    for ci, (xs, ys, w, h) in enumerate(col_bounds):
        xe, ye = xs + w, ys + h
        cv2.rectangle(marked, (xs, ys), (xe, ye), (255,0,0), 2)
        cv2.putText(marked, f"C{ci+1}", (xs+5, ys+25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,0,0), 2)
        sub = marked[ys:ye, xs:xe]
        rows = detect_rows(sub)

        for ri, (r0, r1) in enumerate(rows):
            gy0, gy1 = ys+r0, ys+r1
            if gy1 - gy0 < 5:
                gy1 = gy0 + 10

            cv2.rectangle(marked, (xs, gy0), (xe, gy1), (0,0,255), 1)
            q = ci*25 + ri + 1

            q_x = xs + 5
            q_y = gy0 + int((gy1 - gy0) * 0.6)
            cv2.putText(marked, str(q), (q_x, q_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,255), 2)

            if ci < 3:
                reserve_percent = 0.15
                start_x = xs + int(w * reserve_percent)
                opt_total_width = w - int(w * reserve_percent)
                opt_w = opt_total_width // 5

                margin_v = max(5, int((gy1 - gy0) * 0.15))
                bubbles = []

                for oi in range(5):
                    if oi == 0:
                        margin_left = max(25, int(opt_w * 0.35))
                        margin_right = max(8, int(opt_w * 0.15))
                    elif oi == 4:
                        margin_left = max(8, int(opt_w * 0.15))
                        margin_right = max(25, int(opt_w * 0.35))
                    else:
                        margin_left = max(8, int(opt_w * 0.15))
                        margin_right = margin_left

                    ox0 = start_x + oi * opt_w + margin_left
                    ox1 = start_x + (oi+1)*opt_w - margin_right
                    oy0 = gy0 + margin_v
                    oy1 = gy1 - margin_v

                    if ox1 <= ox0:
                        ox1 = ox0 + 10
                    if oy1 <= oy0:
                        oy1 = oy0 + 10

                    cv2.rectangle(marked, (ox0, oy0), (ox1, oy1), (0, 255, 0), 2)

                    letter = chr(65 + oi)
                    letter_x = ox0 + int((ox1 - ox0) * 0.5) - 5
                    letter_y = oy0 + int((oy1 - oy0) * 0.6)
                    cv2.putText(marked, letter, (letter_x, letter_y),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 128, 0), 2)

                    bubble_roi = img[oy0:oy1, ox0:ox1]
                    darkness = get_bubble_darkness(bubble_roi)
                    percent = (255 - darkness) / 255 * 100
                    bubbles.append({
                        'coords': (ox0, oy0, ox1, oy1),
                        'darkness': darkness,
                        'percent': percent,
                        'letter': letter
                    })

                if bubbles:
                    darkest_idx = np.argmax([b['percent'] for b in bubbles])
                    darkest_value = bubbles[darkest_idx]['percent']
                    if darkest_value >= 43.0:
                        ox0, oy0, ox1, oy1 = bubbles[darkest_idx]['coords']
                        cv2.rectangle(marked, (ox0, oy0), (ox1, oy1), (255, 0, 0), 4)

                        respuestas[str(q)] = bubbles[darkest_idx]['letter']

            else:
                reserve_percent = 0.25
                start_x = xs + int(w * reserve_percent)
                opt_total_width = w - int(w * reserve_percent)
                opt_w = opt_total_width // 5

                row_height = gy1 - gy0
                margin_v = max(5, int(row_height * 0.15))
                bubbles = []

                for oi in range(5):
                    margin_left = max(8, int(opt_w * 0.15))
                    margin_right = margin_left

                    ox0 = start_x + oi * opt_w + margin_left
                    ox1 = start_x + (oi+1) * opt_w - margin_right
                    oy0 = gy0 + margin_v
                    oy1 = gy1 - margin_v

                    if ox1 > xe:
                        ox1 = xe
                    if oy1 > ye:
                        oy1 = ye
                    if ox0 < xs:
                        ox0 = xs
                    if oy0 < ys:
                        oy0 = ys

                    if ox1 <= ox0:
                        ox1 = ox0 + 10
                    if oy1 <= oy0:
                        oy1 = oy0 + 10

                    cv2.rectangle(marked, (ox0, oy0), (ox1, oy1), (0, 255, 0), 2)

                    letter = chr(65 + oi)
                    letter_x = ox0 + int((ox1 - ox0) * 0.5) - 5
                    letter_y = oy0 + int((oy1 - oy0) * 0.6)
                    cv2.putText(marked, letter, (letter_x, letter_y),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 128, 0), 2)

                    bubble_roi = img[oy0:oy1, ox0:ox1]
                    darkness = get_bubble_darkness(bubble_roi)
                    percent = (255 - darkness) / 255 * 100
                    bubbles.append({
                        'coords': (ox0, oy0, ox1, oy1),
                        'darkness': darkness,
                        'percent': percent,
                        'letter': letter
                    })

                if bubbles:
                    darkest_idx = np.argmax([b['percent'] for b in bubbles])
                    darkest_value = bubbles[darkest_idx]['percent']
                    if darkest_value >= 43.0:
                        ox0, oy0, ox1, oy1 = bubbles[darkest_idx]['coords']
                        cv2.rectangle(marked, (ox0, oy0), (ox1, oy1), (255, 0, 0), 4)

                        respuestas[str(q)] = bubbles[darkest_idx]['letter']

    cv2.imwrite(output_img, marked)

    output_list = []
    for i in range(1, 101):
        output_list.append({
            "numeropregunta": i,
            "opcionseleccionada": respuestas.get(str(i))
        })

    return output_list


@router.post("/obtener-respuestas-estudiantes")
async def obtener_respuestas_estudiantes(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".tiff")):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen válida (.jpg, .png, etc)")

    try:
        contents = await file.read()
        # Leer la imagen en formato numpy array para OpenCV
        file_bytes = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="No se pudo leer la imagen. Formato inválido o archivo corrupto.")

        # Detectar columnas
        col_bounds = detect_columns(img)

        # Generar un archivo temporal para la imagen marcada
        with NamedTemporaryFile(delete=False, suffix=".jpg") as tmpfile:
            output_img_path = tmpfile.name

        # Procesar y obtener las respuestas
        respuestas = mark(img, col_bounds, output_img_path)

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Respuestas detectadas correctamente",
                "data": respuestas,
                "output_image_path": output_img_path
                # "output_image_base64": encoded_img,  # opcional
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando imagen: {str(e)}")
