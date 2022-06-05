import flask
from authlib.integrations.requests_client import OAuth2Session
import os
import base64
import psycopg2
import requests


app = flask.Flask(__name__)
app.secret_key = "abcdefg"
postgres_username = os.environ.get("POSTGRES_USER")
postgres_password = os.environ.get("POSTGRES_PASSWORD")
email = os.environ.get("EMAIL")
AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent'
ACCESS_TOKEN_URI = 'https://www.googleapis.com/oauth2/v4/token'
AUTHORIZATION_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'
CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")
REDIRECT_URI = os.environ.get("REDIRECT_URI")
BACKEND_ADDR = os.environ.get("BACKEND_ADDR")
DB_ADDR = os.environ.get("DB_ADDR")

get_time_url = f"{BACKEND_ADDR}/api/get_timeslot?email={email}&maxDays=90&token="
force_sync_url = f"{BACKEND_ADDR}/api/backend/force_sync?email={email}"
add_user_url = f"{BACKEND_ADDR}/api/backend/add_user"
add_event_url = f"{BACKEND_ADDR}/api/add_event"

def get_token():
    with psycopg2.connect(host=DB_ADDR, dbname="data", user=postgres_username, password=postgres_password) as conn:
        cur = conn.cursor()
        cur.execute("select * from api_token;")
        tk = base64.b64encode(bytearray(str.encode(cur.fetchall()[0][2]))).decode()
    return tk


def get_schedule_token():
    with psycopg2.connect(host=DB_ADDR, dbname="data", user=postgres_username, password=postgres_password) as conn:
        cur = conn.cursor()
        cur.execute(f"select * from schedule_type where host_email='{email}';")
        tk = cur.fetchall()[-1][5]
    return tk


def get_all_tokens():
    token = flask.session['token'] if 'token' in flask.session else None
    sToken = flask.session['sToken'] if 'sToken' in flask.session else None
    
    if token is not None and sToken is not None:
        return token, sToken
    try:
        token = get_token()
        sToken = get_schedule_token()
    except:
        return None, None
    return token, sToken


@app.route("/")
def calendar():
    flask.session['token'], flask.session['sToken'] = get_all_tokens()
    
    token = flask.session['token']
    sToken = flask.session['sToken']
    if token is None or sToken is None:    
        return "Server not ready."

    resp = requests.post(url=force_sync_url, headers={"Authorization": "Basic "+token})
    data = requests.get(url=get_time_url+sToken).json()
    return flask.render_template('index.html', data=data)


@app.route("/add_event", methods=['POST'])
def add_event():
    data = flask.request.get_json()
    print(requests.post(add_event_url, json=data))
    return ""

@app.route("/login")
def login():
    session = OAuth2Session(CLIENT_ID, CLIENT_SECRET,
                            scope=AUTHORIZATION_SCOPE,
                            redirect_uri=REDIRECT_URI)
  
    uri, state = session.create_authorization_url(AUTHORIZATION_URL)

    flask.session['auth_state'] = state
    flask.session.permanent = True

    return flask.redirect(uri, code=302)

@app.route("/auth")
def auth():
    req_state = flask.request.args.get('state', default=None, type=None)

    if req_state != flask.session['auth_state']:
        response = flask.make_response('Invalid state parameter', 401)
        return response

    session = OAuth2Session(CLIENT_ID, CLIENT_SECRET,
            scope=AUTHORIZATION_SCOPE,
            redirect_uri=REDIRECT_URI)
    
    oauth2_tokens = session.fetch_token(ACCESS_TOKEN_URI,authorization_response=flask.request.url)
    refresh_token = oauth2_tokens['refresh_token']

    print(oauth2_tokens)
    body = {"email": email, "refreshToken": refresh_token}
    resp = requests.post(url=add_user_url, headers={"Authorization": "Basic "+flask.session['token']}, json=body)
    
    return resp.content
