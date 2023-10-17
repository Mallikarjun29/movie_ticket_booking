new Vue({
  el: '#app',
  data: {
    movies: {},
    venues: {},
    ratings: [],
    genres: [],
    locations: [],
    selectedLocation: '',
    selectedGenre: '',
    selectedDate: '',
    searchQuery: ''
      
  },
  methods: {
    fetchMovies: function() {
      fetch('http://127.0.0.1:5000/api/movies')
        .then((response) => response.json())
        .then((data) => {
          this.movies = data;
          
        })
        .catch(error => {
          console.error('Error fetching movies:', error);
        });
    },
    fetchVenues: function() {
      fetch('http://127.0.0.1:5000/api/venues')
        .then((response) => response.json())
        .then((data) => {
          this.venues = JSON.parse(JSON.stringify(data));
          console.log('Venues data:', this.venues);
          this.populateFilters();
        })
        .catch(error => {
          console.error('Error fetching venues:', error);
        });
    },
    populateFilters: function() {
      this.ratings = [...new Set(Object.values(this.movies).map(movie => movie.ratings))].filter(Boolean);
      this.genres = [...new Set(Object.values(this.movies).map(movie => movie.tags))].filter(Boolean);
      this.locations = [...new Set(Object.values(this.venues).map(venue => venue.location))];
    },
    getUniqueShows: function() {
      return Object.values(this.movies).map(movie => movie.show).filter((value, index, self) => self.indexOf(value) === index);
    },
    getUniqueVenues: function(show) {
      const venueIds = Object.values(this.movies).filter(movie => movie.show === show).map(movie => movie.venue_id);
      return venueIds.map(venueId => this.venues[venueId]);
    },
    getShowTags: function(show) {
      const movie = Object.values(this.movies).find(movie => movie.show === show);
      return movie ? movie.tags : '';
    },
    getShowTime: function(show, venueId) {
      const movie = Object.values(this.movies).find(movie => movie.show === show && movie.venue_id === venueId);
      return movie ? movie.time : '';
    },
    getShowDate: function(show, venueId) {
      const movie = Object.values(this.movies).find(movie => movie.show === show && movie.venue_id === venueId);
      return movie ? movie.date : '';
    },
    getShowPrice: function(show, venueId) {
      const movie = Object.values(this.movies).find(movie => movie.show === show && movie.venue_id === venueId);
      return movie ? movie.price : '';
    }
  },
    computed: {
    filteredShows: function() {
      let filtered = this.getUniqueShows();

      // Apply location filter
      if (this.selectedLocation) {
        filtered = filtered.filter(show => {
          const venueIds = Object.values(this.movies).filter(movie => movie.show === show).map(movie => movie.venue_id);
          const venues = venueIds.map(venueId => this.venues[venueId]);
          return venues.some(venue => venue.location === this.selectedLocation);
        });
      }
    
    // Apply genre filter
        if (this.selectedGenre) {
          filtered = filtered.filter(show => {
            const venueIds = Object.values(this.movies).filter(movie => movie.show === show).map(movie => movie.venue_id);
            const venues = venueIds.map(venueId => this.venues[venueId]);
            return venues.some(venue => {
              const movie = Object.values(this.movies).find(movie => movie.show === show && movie.venue_id === venue.id);
              return movie && movie.tags === this.selectedGenre;
            });
          });
        }
        
    if (this.selectedDate) {
        filtered = filtered.filter(show => {
          const venueIds = Object.values(this.movies).filter(movie => movie.show === show).map(movie => movie.venue_id);
          const venues = venueIds.map(venueId => this.venues[venueId]);
          return venues.find(venue => {
              const movie = Object.values(this.movies).find(movie => movie.show === show && movie.venue_id === venue.id);
              return movie && movie.date === this.selectedDate;
            });
        });
      }
        
        // Apply search query filter
      if (this.searchQuery) {
        filtered = filtered.filter(show => {
          const venueIds = Object.values(this.movies).filter(movie => movie.show === show).map(movie => movie.venue_id);
          const venues = venueIds.map(venueId => this.venues[venueId]);
          return venues.some(venue => {
              const movie = Object.values(this.movies).find(movie => movie.show === show && movie.venue_id === venue.id);
              return movie && movie.show.toLowerCase().includes(this.searchQuery.toLowerCase());
            });
        });
      }
        console.log(filtered);
      return filtered;
    }
  },
  mounted: function() {
    this.fetchMovies();
    this.fetchVenues();
  }
});
