FROM python:3.11-slim as builder

WORKDIR /install

RUN apt-get update && apt-get install -y build-essential libssl-dev libffi-dev libpq-dev

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --prefix=/install -r requirements.txt

# ----------------------------

FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /install /usr/local

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
