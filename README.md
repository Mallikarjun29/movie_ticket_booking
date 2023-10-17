The project followed a structured architecture with a clear separation of backend and
frontend. The Flask app served as the backend, handling database interactions and API
endpoints. Vue.js was used for the frontend, allowing dynamic user interfaces and seamless
data interactions. Default features included adding and managing venues and shows,
booking tickets, and user authentication. Additional features included sending daily and
monthly reminders to users via Celery tasks.
Overall, the project combined Flask and Vue.js to create a robust web application for show
and venue management. The backend provided APIs for various operations, while the
frontend offered a user-friendly interface for users to interact with the system.

![Screenshot](https://github.com/Mallikarjun29/movie_ticket_booking/blob/main/Screenshot%202023-10-17%20170851.png)
![alt text](https://github.com/Mallikarjun29/movie_ticket_booking/blob/main/Screenshot%202023-10-17%20170837.png)
![alt text](https://github.com/Mallikarjun29/movie_ticket_booking/blob/main/Screenshot%202023-10-17%20170800.png)

### Running the Code

Follow these steps to run the project locally on your machine:

1. Open a terminal and navigate to the project directory:

   ```bash
   cd movie_ticket_booking
   ```

2. Install the required Python packages using pip:

   ```bash
   pip install -r requirements.txt
   ```
3.  Go into api.py and enter admin email information for email reminder features

```
email_sender = "admin email"
email_password = "your_password"
```
4. Open three new terminals.

5. In the first terminal, start the Flask application:

   ```bash
   python api.py
   ```

6. In the second terminal, start the Celery Beat scheduler:

   ```bash
   celery -A api.celery beat
   ```

7. In the third terminal, start the Celery worker:

   ```bash
   celery -A api.celery worker
   ```

8. In the third terminal, start the Redis server:

   ```bash
   redis-server
   ```

9. Open a web browser and go to [http://127.0.0.1:5000/login.html](http://127.0.0.1:5000/login.html) to access the application.

Now you should be able to interact with the Show and Venue Management System through the provided web interface. Enjoy managing shows and venues!
