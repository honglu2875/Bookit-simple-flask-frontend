FROM python:3.7-alpine
COPY * /usr/src/app/
WORKDIR /usr/src/app
RUN apk add --no-cache gcc musl-dev
ENV FLASK_APP=app.py
RUN pip install -r requirements.txt
EXPOSE 5000
CMD flask run