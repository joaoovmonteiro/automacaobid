FROM python:3.9-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema para OpenCV e Tesseract
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    tesseract-ocr-por \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos do projeto
COPY requirements.txt .

# Instalar dependências Python (incluindo OpenCV e pytesseract)
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ajustar permissões
RUN mkdir -p /app/fotos_atletas /app/cards_atletas \
    && chmod -R 777 /app/fotos_atletas /app/cards_atletas

# Comando para rodar a aplicação
CMD ["python", "main.py"]
