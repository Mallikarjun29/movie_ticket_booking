new Vue({
  el: '#theatre',
  data: {
    movies: {},
    venues: {},
    ratings: [],
    genres: [],
    locations: [],
    selectedLocation: '',
    selectedDate: '',
    searchQuery: '',
    selectedGenre:'',
    selectedVenue: '',
    selectedTickets: 1
    
      
  },
  methods: {
    fetchMovies: function() {
        const token = localStorage.getItem('token');
      fetch('http://127.0.0.1:5000/api/movies', {
                        headers: {
                            Authorization: `${token}`
                        }
                    })
        .then((response) => response.json())
        .then((data) => {
          this.movies = data;
          
        })
        .catch(error => {
          console.error('Error fetching movies:', error);
        });
    },
    fetchVenues: function() {
        const token = localStorage.getItem('token');
      fetch('http://127.0.0.1:5000/api/venues', {
                        headers: {
                            Authorization: `${token}`
                        }
                    })
        .then((response) => response.json())
        .then((data) => {
          this.venues = JSON.parse(JSON.stringify(data));
          this.populateFilters();
        })
        .catch(error => {
          console.error('Error fetching venues:', error);
        });
    },
    populateFilters: function() {
      this.locations = [...new Set(Object.values(this.venues).map(venue => venue.location))];
      this.genres = [...new Set(Object.values(this.movies).map(movie => movie.tags))];
        
    },
    getUniqueShows: function(venue) {
        return Object.values(this.movies).filter(movie => movie.venue_id === venue.id);
    },
    getUniqueVenues: function() {
      return Object.values(this.venues);
    },
    getVenueID: function(venue) {
      const theatre = Object.values(this.venues).find(theatre => theatre.venue === venue);
      return theatre ? theatre.id : '';
    },
      filterShows: function(venue) {
      const venueShows = this.getUniqueShows(venue);
      
      if (this.selectedGenre && this.selectedDate) {
        return venueShows.filter(show => show.tags.includes(this.selectedGenre) && show.date === this.selectedDate);
      } else if (this.selectedGenre) {
        return venueShows.filter(show => show.tags.includes(this.selectedGenre));
      } else if (this.selectedDate) {
        return venueShows.filter(show => show.date === this.selectedDate);
      }
      
      return venueShows;
    },
    

    filteredVenues: function() {
      let filtered = this.getUniqueVenues();
        

      // Apply location filter
      if (this.selectedLocation) {
        filtered = filtered.filter(venue => venue.location === this.selectedLocation);
      }
        
        // Apply search query filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(venue => venue.venue.toLowerCase().includes(query));
      }
      return filtered;
    },
    logout: function() {
      localStorage.removeItem('token');
          window.location.href = '/login.html';
  },
    confirmBooking: function(showID) {
    const showDetails = Object.values(this.movies).find(show => show.id === showID);
    const totalPrice = showDetails.price * this.selectedTickets;
    
    if (showDetails.capacity - showDetails.total_booking > 0) {
        if (this.selectedTickets <= showDetails.capacity - showDetails.total_booking) {
            const confirmMessage = `Book ${this.selectedTickets} ticket(s) for "${showDetails.show}" at a total price of ${totalPrice}?`;
            
            if (window.confirm(confirmMessage)) {
                const token = localStorage.getItem('token');
                fetch('http://127.0.0.1:5000/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token,
                    },
                    body: JSON.stringify({
                        show_id: showID,
                        num_tickets: this.selectedTickets,
                        username: token
                    }),
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                })
                .catch(error => {
                    console.error('Error adding booking:', error);
                });
            } else {
                console.log('Booking canceled');
            }
        } else {
            const alert_msg = `Only ${showDetails.capacity - showDetails.total_booking} ticket(s) is/are available for "${showDetails.show}"`;
            window.alert(alert_msg); // Change window.confirm to window.alert
        }
    } else {
        alert("Sorry the show is housefull :(");
    }
}

  },
  mounted: function() {
    this.fetchMovies();
    this.fetchVenues();
  },
    computed:{

}
});
