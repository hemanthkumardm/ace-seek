import os
import glob

# Rename binaries
if os.path.exists('bin/md2pdf'):
    os.rename('bin/md2pdf', 'bin/aic')
if os.path.exists('bin/md2pdf-preprocess'):
    os.rename('bin/md2pdf-preprocess', 'bin/aic-preprocess')

# Define replacements
replacements = {
    'md2pdf-preprocess': 'aic-preprocess',
    'md2pdf-cache': 'aic-cache',
    'md2pdf': 'aic',
    'MD2PDF': 'AIC',
    'MD2PDF CONVERTER //': 'AIC // ALL-IN COMPILER',
    'MD2PDF · preview studio': 'AIC · preview studio',
}

# Files to process
files = [
    'Makefile',
    'scripts/install-fast-deps.sh',
    'scripts/install-deps.sh',
    'scripts/install-template.sh',
    'bin/aic',
    'bin/aic-preprocess',
    'README.md',
    'Dockerfile',
    'web/src/lib/compile-job.ts',
    'web/src/app/api/compile/route.ts',
    'web/src/app/layout.tsx',
    'web/src/app/page.tsx'
]

for f in files:
    if os.path.exists(f):
        with open(f, 'r') as file:
            content = file.read()
        
        for old, new in replacements.items():
            content = content.replace(old, new)
            
        with open(f, 'w') as file:
            file.write(content)
        print(f"Updated {f}")

print("Done replacing.")
