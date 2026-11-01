# 一题多路 · One Problem, Many Roads

An unofficial concept demo showing how one section of the workbook 《易学会·九年级》 could work as an interactive web page.

It covers section 04, 初见换元法 (pp.35–41): 3 problems and 11 solution paths.

## What the demo adds
- A choice of first move before any solution appears
- Answer checking with feedback on common intermediate results
- Staged hints
- A map of solution paths, revealed one step at a time
- A comparison of the methods a student has completed
- A Chinese / Japanese / English glossary of key terms
- Interactive geometric views that link algebra to circles, triangles and areas
## Content notes
The problems and solutions are adapted from the workbook. The first-move options, hints, method comparisons, geometric views and glossary were drafted for this demo and have not been reviewed by the author.

Printing errors corrected from the source:
- p.36: `5x²−4mx` is now `5a²−4Ma`, and `√m` is now `√M`
- p.39: `a=√(m+21)` is now `a=√(m²+21)`
- p.40: `(m²+2)` is now `(m²+21)`, and "将②代入" now substitutes ③

## Rights
This repository contains no open-source licence. All rights to the workbook content remain with its author.

## Run locally
```bash
python3 -m http.server 8000
```
