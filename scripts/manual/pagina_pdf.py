# Convierte páginas de un PDF en PNG (PyMuPDF). Uso: python3 pagina_pdf.py <entrada.pdf> <carpeta_salida> <prefijo> <pagina>[,<pagina>...]
import sys, fitz
entrada, salida, prefijo, paginas = sys.argv[1:5]
d = fitz.open(entrada)
for n in paginas.split(','):
    d[int(n) - 1].get_pixmap(dpi=120).save(f"{salida}/{prefijo}{n}.png")
    print('guardada', f"{prefijo}{n}")
