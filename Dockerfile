FROM python:3.7-alpine
COPY * /usr/src/app/
COPY ${CERT_PATH} /etc/cert/
COPY ${KEY_PATH} /etc/cert/
WORKDIR /usr/src/app
RUN apk add --no-cache gcc musl-dev libffi-dev
ENV FLASK_APP=app.py
RUN pip install -r requirements.txt
EXPOSE 5000
CMD flask run --host=0.0.0.0 --cert /etc/cert/fullchain.pem --key /etc/cert/privkey.pem
