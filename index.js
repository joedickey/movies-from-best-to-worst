const searchURL = "https://api.themoviedb.org/3/"
const imagePathUrl = "https://image.tmdb.org/t/p/original"
const apiKeyQuery = "?api_key=df3341688556ba5dadfc14be29cc9299"
const linkToMovieURL = "https://www.themoviedb.org/movie/"

// HTML TEMPLATES 
function actorProfile(image, name){
   return $('#actor-profile').html(`<img id="profile-pic" src="${image}" alt="Actor Picture">
    <h3 id="display-name">${name}</h3>`)
}

function homescreenTransition(){
    $('header').removeClass('homescreen');
}

function showResults(){
    // removes .hidden class from footer
    $('main').removeClass('hidden');

}

function showFooter(){
    // removes .hidden class from footer
    $('footer').removeClass('hidden');

}

function floatingHeader(){
    // adds sticky header when scrolling down page
    $(window).scroll(function(event){
        if($(window).scrollTop() > 325){
            $('header').addClass('sticky');
            $('#header-placeholder').removeClass('hidden');
            $('#header-content').removeClass('wrapper');
            $('#header-format').addClass('sticky-wrapper').removeClass('section');
            $('#actor-profile').addClass('sticky-actor-profile').removeClass('actor-profile');
            $('h1').addClass('hidden');
            $('#display-name').addClass('display-name-sticky');
            $('#search-element').removeClass('search-element')
        } else {
            $('header').removeClass('sticky');
            $('#header-placeholder').addClass('hidden');
            $('#header-content').addClass('wrapper');
            $('#header-format').removeClass('sticky-wrapper').addClass('section');
            $('#actor-profile').removeClass('sticky-actor-profile').addClass('actor-profile');
            $('h1').removeClass('hidden');
            $('#display-name').removeClass('display-name-sticky');
            $('#search-element').addClass('search-element')
        }
    })
}
  

function displayMovieDetails(movieList){
    // display movie details and appends to UL in HTML
    
    for(i = 0; i < movieList.length; i++){
    
        $('#results').append(
            `<li class="movie-display">
                 <a href="${linkToMovieURL}${movieList[i].id}" target="_blank"><img src="${imagePathUrl + movieList[i].poster_path}" alt="Movie Poster" class="poster"></a>
                <div class="text-elements">
                     <div class="info-row">
                        <h3 class="title"><a href="${linkToMovieURL}${movieList[i].id}" target="_blank">${movieList[i].title}</a></h3>
                        <p class="release-year">${"(" + movieList[i].release_date.substring(0, 4) + ")"}</p>
                     </div>
                    <div class="info-row">
                        <p class="rating">${(movieList[i].vote_average * 10) + "%"}</p>
                        <p class="genre-tags">${movieList[i].genres[0].name}</p>
                    </div>  
                    <div class="info-row">
                        <p class="overview">${movieList[i].overview}</p>
                    </div>  
                </div>
            </li>`)
    }
}


// MAIN FUNCTIONS 

function rankMoviesByVoteAvg(movieDetails){
    // ranks movies in descending order from highest voter average
    const moviesRankedByVote = movieDetails.sort((a, b) => b.vote_average - a.vote_average);   
    displayMovieDetails(moviesRankedByVote);
}

function getMovieDetails(idArray){
    // cycle through array of movie IDs and send details to displayMovieDetails function
    const movieDetailsArray = [];
    const movieEndpoint = "movie/"
    for(i = 0; i < idArray.length; i++){
        let url = searchURL + movieEndpoint + idArray[i] + apiKeyQuery;
    
       movieDetailsArray.push(
           fetch(url)
            .then(response => response.json())
            .then(function(responseJson){
                if(responseJson.poster_path !== null && responseJson.release_date !== undefined && responseJson.release_date.substring(0, 4) <= new Date().getFullYear() && responseJson.release_date.substring(0, 4) !== "" && responseJson.genres.length > 0 && responseJson.imdb_id !== null && (responseJson.vote_count >= 10 && responseJson.popularity > 1)){
                    return responseJson; // filtering out results with broken images, unreleased movies, and movies without a genre listed.
                } else {
                    console.log("filtered out based on perimeters");
                    console.log(responseJson);
                }
            })
            .catch(err => $('#error-message').text("Oops, something went wrong on our end! Please check back later. " + err))
       );
    } 
    Promise.all(movieDetailsArray)
        .then(res => rankMoviesByVoteAvg(res))
        .catch(err => err) 
}

function getMovieListIds(list){
    // create and array of IDs for filmography of the actor
    const movieIdArray = [];
    for (i = 0; i < list.cast.length; i++){
        movieIdArray.push(list.cast[i].id);
    }
    getMovieDetails(movieIdArray);
}

function getMoviesList(id){
    // get filmography by actor ID
    const endpointMovieCredits = `person/${id}/movie_credits`;
    const url = searchURL + endpointMovieCredits + apiKeyQuery;

    fetch(url)
        .then(response => response.json())
        .then(responseJson => getMovieListIds(responseJson))
        .catch(err => $('#error-message').text("Oops, something went wrong on our end. Please check back later! " + err))
}

function getPersonDetails(responseJson, name){
    //get ID number for person and display image and name
    const displayName = responseJson.results[0].name;
    const profilePicPath = responseJson.results[0].profile_path;
    const nameId = responseJson.results[0].id;
    const profilePicUrl = imagePathUrl + profilePicPath;
    const formattedDataName = displayName.trim().replace("é","e").replace("è","e").replace("ë", "e").replace("ü", "u").replace("ö", "o").replace("á", "a").replace("-", " ").replace(".", "").toLowerCase();
    const formattedInputName = name.trim().replace("é","e").replace("è","e").replace("ë", "e").replace("ü", "u").replace("ö", "o").replace("á", "a").replace("-", " ").replace(".", "").toLowerCase();
    console.log("Name format match: " + formattedDataName + " " + formattedInputName);
    if(formattedDataName == formattedInputName){
        actorProfile(profilePicUrl, displayName);
        getMoviesList(nameId);
    }
    else {
        return $('#error-message').text("We could not find an actor with that name.");
              
    }
}

function getPersonByName(name){
    //locate person in API database by name
    const endpointSearchPeople = "search/person";
    const encodedName = `${encodeURIComponent(name)}`;
    const url = searchURL + endpointSearchPeople + apiKeyQuery + "&query=" + encodedName;

    fetch(url)
        .then(response => response.json())
        .then(responseJson => {
            if(responseJson.results.length > 0){
                return getPersonDetails(responseJson, name);
            }
            else {
                return $('#error-message').text("We could not find an actor with that name.")
            }
        }
            )
        .catch(err => $('#error-message').text("Oops, something went wrong on our end! Please check back later! " + err));
}

// EVENT HANDLERS 

function watchForm(){
    //take in actor name from search input
    $('#search-form').submit(event => {
        event.preventDefault();
        const name = $('#search-bar').val();
        getPersonByName(name);
        $('#search-bar').val('');
        $('#error-message').text('');
        $('#results').empty();
        $('#actor-profile').empty();
        console.clear();
        homescreenTransition();
        showResults();
        showFooter();
    });
}

$(function(){
    watchForm();
    floatingHeader();
});