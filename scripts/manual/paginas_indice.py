# Calcula en qué página de un PDF empieza cada entrada del índice. Uso: python3 paginas_indice.py <manual.pdf> <indice_X.json> <paginas_X.json>
import sys, json, fitz
pdf, indice, salida = sys.argv[1:4]
entradas = json.load(open(indice))
d = fitz.open(pdf)
# El índice ocupa las primeras páginas: el cuerpo empieza en la primera página con algún párrafo largo que no sea una entrada del índice.
textos = {e['texto'] for e in entradas}
lineas = [[l.strip() for l in p.get_text().splitlines()] for p in d]
inicio = next((i for i in range(1, len(d)) if any(len(l) > 70 and l not in textos and 'Manual' not in l for l in lineas[i])), 1)
res, p = [], inicio
for e in entradas:
    q = p
    while q < len(d) and e['texto'] not in lineas[q]:
        q += 1
    if q >= len(d):
        print('No encontrado:', e['texto']); res.append(0)
    else:
        res.append(q + 1); p = q
json.dump(res, open(salida, 'w'))
print('páginas del índice calculadas:', len(res))
