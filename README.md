### Running the Code

Follow these steps to run the project locally on your machine:

1. Open a terminal and navigate to the project directory:

   ```bash
   cd show-venue-management
   ```

2. Install the required Python packages using pip:

   ```bash
   pip install -r requirements.txt
   ```

3. Open three new terminals.

4. In the first terminal, start the Flask application:

   ```bash
   python api.py
   ```

5. In the second terminal, start the Celery Beat scheduler:

   ```bash
   celery -A api.celery beat
   ```

6. In the third terminal, start the Celery worker:

   ```bash
   celery -A api.celery worker
   ```

7. In the third terminal, start the Redis server:

   ```bash
   redis-server
   ```

8. Open a web browser and go to [http://127.0.0.1:5000/login.html](http://127.0.0.1:5000/login.html) to access the application.

Now you should be able to interact with the Show and Venue Management System through the provided web interface. Enjoy managing shows and venues!