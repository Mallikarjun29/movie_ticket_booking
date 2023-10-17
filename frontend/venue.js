new Vue({
  el: '#venue',
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
    selectedRating: '',
    newVenue: {
    name: '',
    location: ''
  },
    newShow: {
    name: '',
    genre: '',
    capacity: '',
    price: '',
    date:'',
    time:''
  },
    
      
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
      
    addVenue: function() {
        const venueName = this.newVenue.name;
        const location = this.newVenue.location;
         const token = localStorage.getItem('token');
        fetch('http://127.0.0.1:5000/api/venues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
              'Authorization': token,
          },
          body: JSON.stringify({ venue: venueName, location: location })
        })
          .then(response => response.json())
          .then(data => { alert(data.message); // Handle the response as needed
            // Refresh the venues list or perform any other necessary actions
          this.fetchMovies();
              this.fetchVenues();
                        })
          .catch(error => {
            console.error('Error adding venue:', error);
          });
      },
      
      addShow: function(venueID) {
        const showName = this.newShow.name;
        const genre = this.newShow.genre;
        const capacity = this.newShow.capacity;
        const price = this.newShow.price;
        const date = this.newShow.date;
        const time = this.newShow.time;
        const rating = this.newShow.rating;
           const token = localStorage.getItem('token');
        fetch('http://127.0.0.1:5000/api/shows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
              'Authorization': token,
          },
          body: JSON.stringify({ show: showName, genre: genre, capacity: capacity, price: price, venue_id: venueID, 
                               date:date, time:time, rating: rating })
        })
          .then(response => response.json())
          .then(data => { alert(data.message);// Show the alert
            // Refresh the shows list or perform any other necessary actions
          this.fetchMovies();
              this.fetchVenues();
                        })
          .catch(error => {
            console.error('Error adding show:', error);
          });
          
      },
                    
      deleteVenue: function(venueID) {
          // Send a DELETE request to the API endpoint
           const token = localStorage.getItem('token');
          fetch(`http://127.0.0.1:5000/api/venues/${venueID}`, {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
          })
            .then(response => response.json())
            .then(data =>{ alert(data.message);
          
              // Refresh the venues list
              this.fetchMovies();
              this.fetchVenues();
                         })
            .catch(error => {
              console.error('Error deleting venue:', error);
            });
        },
      deleteShow: function(show) {
          const showId = show.id;
           const token = localStorage.getItem('token');
          fetch(`http://127.0.0.1:5000/api/shows/${showId}`, {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
              'Authorization': token,
          },
          })
            .then(response => response.json())
            .then(data => {
              alert(data.message);
              // Refresh the shows list or perform any other necessary actions

              // Delete the show from the movies object
              this.fetchMovies();
              this.fetchVenues();
            })
            .catch(error => {
              console.error('Error deleting show:', error);
            });
        },
      filterShows: function(venue) {
            const venueShows = this.getUniqueShows(venue);

            if (this.selectedGenre && this.selectedDate && this.selectedRating) {
                return venueShows.filter(show => show.tags.includes(this.selectedGenre) && show.date === this.selectedDate && show.ratings === this.selectedRating);
            } else if (this.selectedGenre && this.selectedRating) {
                return venueShows.filter(show => show.tags.includes(this.selectedGenre) && show.ratings === this.selectedRating);
            } else if (this.selectedDate && this.selectedRating) {
                return venueShows.filter(show => show.date === this.selectedDate && show.ratings === this.selectedRating);
            } else if (this.selectedGenre && this.selectedDate) {
                return venueShows.filter(show => show.tags.includes(this.selectedGenre) && show.date === this.selectedDate);
            } else if (this.selectedGenre) {
                return venueShows.filter(show => show.tags.includes(this.selectedGenre));
            } else if (this.selectedDate) {
                return venueShows.filter(show => show.date === this.selectedDate);
            } else if (this.selectedRating) {
                return venueShows.filter(show => show.ratings === this.selectedRating);
            }

            return venueShows;
        },
    
        updateVenue: function(venueId) {
          const venueName = document.getElementById(`fm1-${venueId}`).value;
          const location = document.getElementById(`fm2-${venueId}`).value;
             const token = localStorage.getItem('token');
          fetch(`http://127.0.0.1:5000/api/venues/${venueId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({ venue: venueName, location: location })
          })
            .then(response => response.json())
            .then(data => {
              alert(data.message);
              this.fetchVenues();
            })
            .catch(error => {
              console.error('Error updating venue:', error);
            });
        },
      updateShow: function(showID) {
          const ShowName = document.getElementById(`sh1-${showID}`).value;
          const Genre = document.getElementById(`sh2-${showID}`).value;
          const Capacity = document.getElementById(`sh3-${showID}`).value;
          const Price = document.getElementById(`sh4-${showID}`).value;
          const Date = document.getElementById(`sh5-${showID}`).value;
          const Time = document.getElementById(`sh6-${showID}`).value;
          const Rating = document.getElementById(`sh7-${showID}`).value;

           const token = localStorage.getItem('token');
          fetch(`http://127.0.0.1:5000/api/shows/${showID}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({ show: ShowName, genre: Genre, capacity: Capacity, price: Price, 
                               date:Date, time:Time, rating: Rating })
          })
            .then(response => response.json())
            .then(data => {
              alert(data.message);
              this.fetchVenues();
              this.fetchMovies();
            })
            .catch(error => {
              console.error('Error updating venue:', error);
            });
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
      export_csv: function(venueID){
           const token = localStorage.getItem('token');
          fetch(`http://127.0.0.1:5000/api/export/${venueID}`, {
            headers: {
              'Content-Type': 'application/json',
                'Authorization': token,
            }
          })
            .then(response => response.json())
            .then(data => {
              alert(data.message);
            })
            .catch(error => {
              console.error('Error getting csv file:', error);
            });
      }
  },
  mounted: function() {
    this.fetchMovies();
    this.fetchVenues();
  }
});
