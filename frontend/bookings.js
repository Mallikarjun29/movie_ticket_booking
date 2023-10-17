new Vue({
    el: '#booking',
    data: {
        bookings: {}
    },
    methods: {
        fetchBookings: function() {
            const token = localStorage.getItem('token');
            fetch(`http://127.0.0.1:5000/api/all_bookings`, {
                        headers: {
                            Authorization: `${token}`,
                            'Content-Type': 'application/json'
                        }
                    })
            .then((response) => response.json())
            .then((data) => {
              this.bookings = data;
            })
            .catch(error => {
                console.error('Error fetching bookings:', error);
            });
        }
    },
    mounted: function() {
        // Get the username from the URL (You may need to adjust this based on your URL structure)
        this.fetchBookings();
    }
});
