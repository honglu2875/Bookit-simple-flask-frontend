from flask import Flask
from flask import request
from flask import render_template
import os
import base64
import psycopg2
import requests


app = Flask(__name__)
postgres_username = os.environ.get("POSTGRES_USERNAME")
postgres_password = os.environ.get("POSTGRES_PASSWORD")
email = "honglu2875@gmail.com"

get_time_url = f"http://localhost:8080/api/get_timeslot?email={email}&maxDays=90&token="
force_sync_url = f"http://localhost:8080/api/backend/force_sync?email={email}"


def get_token():
    with psycopg2.connect(host="localhost", dbname="data", user=postgres_username, password=postgres_password) as conn:
        cur = conn.cursor()
        cur.execute("select * from api_token;")
        tk = base64.b64encode(bytearray(str.encode(cur.fetchall()[0][2]))).decode()
    return tk


def get_schedule_token():
    with psycopg2.connect(host="localhost", dbname="data", user=postgres_username, password=postgres_password) as conn:
        cur = conn.cursor()
        cur.execute(f"select * from schedule_type where host_email='{email}';")
        tk = cur.fetchall()[-1][5]
    return tk


token = get_token()
sToken = get_schedule_token()


@app.route("/")
def calendar():
    resp = requests.post(url=force_sync_url, headers={"Authorization": "Basic "+token})
    data = requests.get(url=get_time_url+sToken).json()
    return render_template('index.html', data=data)


@app.route("/add_event", methods=['POST'])
def add_event():
    data = request.get_json()
    print(requests.post("http://localhost:8080/api/add_event", json=data))
    return ""
