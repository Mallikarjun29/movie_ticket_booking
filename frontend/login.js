new Vue({
    el: '#login',
    data: {
        username: '',
        password: ''
    },
    methods: {
        login:function() {
            
            // Make a POST request to the Flask API for authentication
            fetch('http://127.0.0.1:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: this.username,
                    password: this.password
                })
            })
            .then(response => {
                if (!response.ok) {
                    console.log("its fine")
                    throw new Error('Invalid credentials');
                }
                
                return response.json();
            })
            .then(data => {
                // Save the token in localStorage
                
                localStorage.setItem('token', data.token);
                console.log(data)

                // Redirect the user to the appropriate page based on the role
                if (this.username === 'admin') {
                    window.location.href = '/admin_venue.html';
                } else {
                    window.location.href = '/user_theatres.html';
                }
            })
            .catch(error => {
                console.error('Error logging in:', error);
                alert('Invalid credentials');
            });
        }
    }
});