from flask import Flask, request, jsonify #added to top of file
from flask_cors import CORS #added to top of file
from flask_security import Security, auth_required, current_user
from flask_login import LoginManager
import hashlib
import os
from datetime import timedelta, datetime
from celery import Celery, Task
from celery.schedules import crontab
import smtplib
import ssl
from email.message import EmailMessage
from flask import render_template_string
import csv

email_sender = "admin email"
email_password = "your_password"

def celery_init_app(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app

app = Flask(__name__,static_folder='frontend', static_url_path='')

app.config.from_mapping(
    CELERY=dict(
        broker_url="redis://localhost",
        result_backend="redis://localhost",
        task_ignore_result=True,
    ),
)

celery = celery_init_app(app)

celery.conf.beat_schedule = {
    'send-reminder-every-day': {
        'task': 'send_daily_reminder_task',
        'schedule': crontab(hour=18, minute=00) # Run the task every day at 6:00 PM
        #'schedule': timedelta(seconds=5)
    },
    'send_monthly_report': {
        'task': 'send_monthly_report',
        #'schedule': crontab(hour=12, minute=31),  # Run the task every day at 6:00 PM
        'schedule': crontab(day_of_month='1')
    },
    #'test': {
    #    'task': 'test',
    #    'schedule': timedelta(seconds=5)
    #},
}

cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
login_manager = LoginManager()  # Initialize the LoginManager
login_manager.init_app(app)  # Attach it to your Flask app
import sqlite3
import jwt
from functools import wraps

def connect_to_db():
    db_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.sqlite3')
    conn = sqlite3.connect(db_file_path)
    return conn

def get_movies():
    movies = {}
    conn = connect_to_db()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM Show")
    rows = cur.fetchall()

    # Convert row objects to dictionary
    count=0
    for i in rows:
        count+=1
        movies.update({count:{
                "show": i["show"],
                "id":i["id"],
                "venue_id": i["venue_id"],
                "date": i["date"],
                "time": i["time"],
                "capacity": i["capacity"],
                "price": i["price"],
                "tags": i["tags"],
                "ratings": i["Rating"],
                "total_booking" :i["total_booking"]
            }}
            )
    conn.commit()
    conn.close()

    return movies

def get_venues():
    venues = {}
    conn = connect_to_db()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM Venue")
    rows = cur.fetchall()

    count=0
    for i in rows:
        count+=1
        venues.update({count:{
            "id": i["id"],
            "venue": i["venue"],
            "location": i["location"]
        }
    })
    conn.commit()
    conn.close()

    return venues

def add_venue(venue_name, location):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO Venue (venue, location) VALUES (?, ?)", (venue_name, location))
    conn.commit()
    conn.close()

def add_show(show_name, venue_id, date, time, capacity, price, tags, rating):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO Show (show, venue_id, date, time, capacity, price, tags, Rating, total_booking) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)", (show_name, venue_id, date, time, capacity, price, tags, rating))
    conn.commit()
    conn.close()
    
def delete_venue(venue_id):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM Venue WHERE id=?", (venue_id,))
    conn.commit()
    conn.close()

def delete_show(show_id):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM Show WHERE id=?", (show_id,))
    conn.commit()
    conn.close()
    
def update_venue(venue_id, venue_name, location):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("UPDATE Venue SET venue = ?, location = ? WHERE id = ?", (venue_name, location, venue_id))
    conn.commit()
    conn.close()

def update_show(show_name, date, time, capacity, price, tags,show_id, rating):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("UPDATE Show SET show = ?, date=?, time=?, capacity=?, price=?, tags=?, Rating=? WHERE id = ?", (show_name, date, time, capacity, price, tags,rating,show_id))
    conn.commit()
    conn.close()
    
def get_user(username):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM User WHERE username = ?", (username,))
    row = cur.fetchone()
    conn.commit()
    conn.close()

    if row:
        user = {
            'id': row[0],
            'username': row[1],
            'password': row[2],
            'role':row[3]
            # Add any other attributes needed for authentication
        }
        return user

    return None

def add_booking(username, show_id, num_tickets):
    conn = connect_to_db()
    cur = conn.cursor()
    
    cur.execute("SELECT id,num_tickets FROM Bookings WHERE username = ? AND show_id = ?", (username, show_id))
    existing_booking = cur.fetchall()
    print(existing_booking)
    num_tickets=int(num_tickets)
    #existing_booking[0][1]=int(existing_booking[0][1])
    if existing_booking:
        cur.execute("UPDATE Bookings SET num_tickets = ? WHERE id = ?", (num_tickets+existing_booking[0][1], existing_booking[0][0]))
    else:
        cur.execute("INSERT INTO Bookings (username, show_id, num_tickets) VALUES (?, ?, ?)", (username, show_id, num_tickets))
    conn.commit()
    conn.close()
    

def get_bookings(username, start_date=None, end_date=None):
    conn = connect_to_db()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    if start_date and end_date:
        cur.execute("SELECT * FROM Bookings JOIN Show ON Bookings.show_id = Show.id JOIN Venue ON Show.venue_id = Venue.id WHERE username = ? AND date BETWEEN ? AND ?", (username, str(start_date), str(end_date)))
    else:
        cur.execute("SELECT * FROM Bookings JOIN Show ON Bookings.show_id = Show.id JOIN Venue ON Show.venue_id = Venue.id WHERE username = ?", (username,))
    rows = cur.fetchall()
    conn.commit()
    conn.close()

    bookings = []
    for row in rows:
        booking = {
            'id': row['id'],
            'username': row['username'],
            'venue': row['venue'],
            'location':row['location'],
            'show': {
                'id': row['show_id'],
                'show': row['show'],
                'venue_id': row['venue_id'],
                'date': row['date'],
                'time': row['time'],
                'capacity': row['capacity'],
                'price': row['price'],
                'tags': row['tags'],
                'rating': row['Rating']
            },
            'num_tickets': row['num_tickets']
        }
        bookings.append(booking)
    print(bookings)
    return bookings

def get_users_without_bookings():
    conn = connect_to_db()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # Query users who have not made any bookings
    cur.execute("SELECT username, email FROM User WHERE username NOT IN (SELECT DISTINCT username FROM Bookings) AND role = 0")
    rows = cur.fetchall()
    
    conn.commit()
    conn.close()

    users = []
    for row in rows:
        user = {
            'username': row['username'],
            'email': row['email']
        }
        users.append(user)

    return users

def get_all_users():
    conn = connect_to_db()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # Query users who have not made any bookings
    cur.execute("SELECT username, email FROM User WHERE role=?",(0,))
    rows = cur.fetchall()
    
    conn.commit()
    conn.close()

    users = []
    for row in rows:
        user = {
            'username': row['username'],
            'email': row['email']
        }
        users.append(user)
    print(users)

    return users

def create_user(username, password, email):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO User (username, password, email, role) VALUES (?, ?, ?, ?)", (username, password, email, 0))
    conn.commit()
    conn.close()

def is_username_available(username):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM User WHERE username = ?", (username,))
    count = cur.fetchone()[0]
    conn.close()
    return count == 0


def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Authentication required'}), 401

        try:
            
            data = jwt.decode(token, 'secret', algorithms=['HS256'])
            username = data['username']
            #current_user.username = username
            print("HI")
        except jwt.ExpiredSignatureError:
            
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            
            return jsonify({'message': 'Invalid token'}), 401

        return f(*args, **kwargs)

    return decorated_function

@app.route('/api/movies', methods=['GET'])
@auth_required
def api_get_movies():
    return jsonify(get_movies())

@app.route('/api/venues', methods=['GET'])
@auth_required
def api_get_venues():
    return jsonify(get_venues())

@app.route('/api/venues', methods=['POST'])
@auth_required
def api_add_venue():
    data = request.get_json()
    venue_name = data.get('venue')
    location = data.get('location')
    add_venue(venue_name, location)
    return jsonify({'message': 'Venue added successfully'})

@app.route('/api/shows', methods=['POST'])
@auth_required
def api_add_show():
    data = request.get_json()
    show_name = data.get('show')
    venue_id = data.get('venue_id')
    date = data.get('date')
    time = data.get('time')
    capacity = data.get('capacity')
    price = data.get('price')
    tags = data.get('genre')
    rating = data.get('rating')
    add_show(show_name, venue_id, date, time, capacity, price, tags, rating)
    return jsonify({'message': 'Show added successfully'})

@app.route('/api/venues/<venue_id>', methods=['DELETE'])
@auth_required
def api_delete_venue(venue_id):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM Show WHERE venue_id = ?", (venue_id,))
    count = cur.fetchone()[0]
    conn.commit()
    conn.close()
    if count > 0:
        return jsonify({'message': 'Delete associated shows first'})
    delete_venue(venue_id)
    return jsonify({'message': 'Venue deleted successfully'})

@app.route('/api/shows/<show_id>', methods=['DELETE'])
@auth_required
def api_delete_show(show_id):
    delete_show(show_id)
    return jsonify({'message': 'Show deleted successfully'})

@app.route('/api/venues/<int:venue_id>', methods=['PUT'])
@auth_required
def api_update_venue(venue_id):
    data = request.get_json()
    venue_name = data.get('venue')
    location = data.get('location')
    update_venue(venue_id, venue_name, location)
    return jsonify({'message': 'Venue updated successfully'})

@app.route('/api/shows/<int:show_id>', methods=['PUT'])
@auth_required
def api_update_show(show_id):
    data = request.get_json()
    show_name = data.get('show')
    date = data.get('date')
    time = data.get('time')
    capacity = data.get('capacity')
    price = data.get('price')
    tags = data.get('genre')
    rating = data.get('rating')
    update_show(show_name, date, time, capacity, price, tags,show_id, rating)
    return jsonify({'message': 'Show updated successfully'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = get_user(username)
    print(hashlib.sha256(password.encode()).hexdigest())
    if user and hashlib.sha256(user['password'].encode()).hexdigest() == hashlib.sha256(password.encode()).hexdigest():
        expiration_time = datetime.utcnow() + timedelta(seconds=400000)
        token=jwt.encode({'username': username, 'exp': expiration_time},"secret",algorithm='HS256')
        print(token)
        return jsonify({'token': token}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/bookings', methods=['POST'])
@auth_required
def api_add_booking():
    data = request.get_json()
    token = request.headers.get('Authorization')  
    daa = jwt.decode(token, 'secret', algorithms=['HS256']) 
    username = daa['username']  # Assuming the authenticated user ID is available through Flask-Security or Flask-Login
    show_id = data.get('show_id')
    num_tickets = data.get('num_tickets')
    add_booking(username, show_id, num_tickets)
    return jsonify({'message': 'Booking added successfully'})

@app.route('/api/all_bookings', methods=['GET'])
@auth_required
def api_get_bookings():
    token = request.headers.get('Authorization')
    
    daa = jwt.decode(token, 'secret', algorithms=['HS256']) 
    username = daa['username']
    return jsonify(get_bookings(username))

@app.route('/api/send_daily_reminder', methods=['GET'])
def api_send_daily_reminder():
    result=send_daily_reminder_task.delay()
    result.wait()
    return jsonify({'message': 'Daily reminder task has been triggered'})

@celery.task(name="send_daily_reminder_task")
def send_daily_reminder_task():
    print("inside task")
    users = get_users_without_bookings()  # Implement this function to get users who have not booked anything
    for user in users:
        email_receiver = user['email']
        print(email_receiver)
        subject = 'Check out my new shows tonight!'
        body = """
        We've seen that you have not yet booked any shows. Come on hurry up!!!
        """
        em = EmailMessage()
        em['From'] = email_sender
        em['To'] = email_receiver
        em['Subject'] = subject
        em.set_content(body)

        context = ssl.create_default_context()

        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(email_sender, email_password)
            smtp.sendmail(email_sender, email_receiver, em.as_string())
        print(user)
    return users

@app.route('/api/send_monthly', methods=['GET'])
def api_send_monthly():
    result=send_monthly_report.delay()
    result.wait()
    return jsonify({'message': 'Monthly reminder task has been triggered'})

@celery.task(name="send_monthly_report")
def send_monthly_report():
    users = get_all_users()
    all_users_bookings = {}
    
    current_date = datetime.now()
    last_month_start = current_date.replace(day=1) - timedelta(days=1)
    last_month_end = last_month_start.replace(day=1)
    
    for user in users:
        all_users_bookings[user['username']] = get_bookings(user['username'],last_month_end.strftime('%Y-%m-%d'), last_month_start.strftime('%Y-%m-%d'))
        print(all_users_bookings[user['username']])
        email_receiver = user['email']
        subject = 'Your monthly report!'
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Monthly Entertainment Report</title>
        </head>
        <body>
            <h1>Monthly Entertainment Report - {{ month }} {{ year }}</h1>
            users_booking[0][0][1]
            <table border="1">
                <tr>
                    <th>Show</th>
                    <th>Venue</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Number of Tickets</th>
                    <th>Rating</th>
                    <th>Genre</th>
                </tr>
                {% for booking in users_bookings %}
                <tr>
                    <td>{{ booking.show.show }}</td>
                    <td>{{ booking.venue }}</td>
                    <td>{{ booking.location }}</td>
                    <td>{{ booking.show.date }}</td>
                    <td>{{ booking.show.time }}</td>
                    <td>{{ booking.num_tickets }}</td>
                    <td>{{ booking.show.tags }}</td>
                </tr>
                {% endfor %}
            </table>
        </body>
        </html>
        """
        rendered_template = render_template_string(template, users_bookings=all_users_bookings[user['username']], month= (last_month_start.strftime('%B')))
        em = EmailMessage()
        em['From'] = email_sender
        em['To'] = email_receiver
        em['Subject'] = subject
        em.set_content(rendered_template, subtype='html')
        context = ssl.create_default_context()
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(email_sender, email_password)
            smtp.sendmail(email_sender, email_receiver, em.as_string())
        print(user)
    return users



@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')


    if not is_username_available(username):
        return jsonify({'message': 'Username already taken'})
    
    create_user(username, password, email)
    return jsonify({'message': 'User registered successfully, You can go to login page now'}), 201

@app.route('/api/export/<int:venue_id>')
def export(venue_id):
    try:
        generate_csv.apply_async(args=[venue_id])
    except:
        return jsonify({'message':'Error getting csv file'})
    return jsonify({'message':'CSV generation initiated'})

@celery.task()
def generate_csv(venue_id):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM Show, Venue WHERE Show.venue_id = Venue.id  AND Venue.id= ? ", (venue_id,))
    print('hi')
    rows = cur.fetchall()
    conn.commit()
    conn.close()
    venue_id=rows[0][2]
    csv_filename = f'{venue_id}_report.csv'
    with open(csv_filename, 'w', newline='') as csvfile:
        fieldnames = ['Venue Name','Location','Show name','Date','Time','Price','Capacity','Tags', 'Ratings','Bookings']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({
                'Venue Name':row[11],
                'Location':row[12],
                'Show name':row[1],
                'Date':row[3],
                'Time':row[4],
                'Price':row[5],
                'Capacity':row[6],
                'Tags':row[7],
                'Ratings':row[8],
                'Bookings':row[9]
                })
    email_receiver = '01fe19bme045@kletech.ac.in'
    subject = 'CSV file is ready!'
    body = """
    Dear Admin,
    You can now access the csv file. The files are named according to venue id
    """
    em = EmailMessage()
    em['From'] = email_sender
    em['To'] = email_receiver
    em['Subject'] = subject
    em.set_content(body)

    context = ssl.create_default_context()

    with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
        smtp.login(email_sender, email_password)
        smtp.sendmail(email_sender, email_receiver, em.as_string())
    return 1
#@celery.task(name="test")
#def test():
#    print("test hi")
#    return "test hi"

if __name__ == "__main__":
    #app.debug = True
    
    app.run(host='0.0.0.0', port=5000)
