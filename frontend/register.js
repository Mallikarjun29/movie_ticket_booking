new Vue({
    el: '#register',
    data: {
        username: '',
        password: '',
        cnfpassword:'',
        email:''
    },
    methods: {
        register:function() {
            // Make a POST request to the Flask API for authentication
            if (this.password!==this.cnfpassword){
                alert("Passwords do not match. Please try again.");
                return;
            }
            console.log("its fine 3")
            fetch('http://127.0.0.1:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    
                    username: this.username,
                    email: this.email,
                    password: this.password
                })
            })
            .then(response => {
                console.log("its fine 3")
                return response.json();
            })
            .then(data => {
                console.log("its fine 1")
                alert(data.message); 
                
                
            })
            .catch(error => {
                console.error('Error logging in:', error);
//                window.location.href = '/login.html';
//                alert('Invalid credentials', error);
            });
        }
    }
});
