// Initialize Firebase
const config = {
  apiKey: 'AIzaSyCiLgK-ruR_RYem27X328H3H9bGzujRjn8',
  authDomain: 'songlyrically.firebaseapp.com',
  databaseURL: 'https://songlyrically.firebaseio.com',
  projectId: 'songlyrically',
  storageBucket: 'songlyrically.appspot.com',
  messagingSenderId: '910125473880',
};

firebase.initializeApp(config);
const database = firebase.database();
const comment = firebase.database().ref('/Comments');
$('#results-display').hide();

database.ref('/songs').on('value', (snapshot) => {
  $('#last-song').text(snapshot.val().lastSong);
});


function videoSearch(song, artist) {
  const youtubeQueryUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${song} ${artist}&type=music&key=AIzaSyDm3Avv6gF5Xgw2YEm3GB5ILBO5-caJfwU`;
  const watchVideoUrl = 'https://www.youtube.com/embed/';

  $.ajax({
    url: youtubeQueryUrl,
    method: 'GET',
  }).then((response) => {
    $('#videos-display').empty();
    const results = response.items[0].id.videoId;
    const youTubeVid = watchVideoUrl + results;
    const videos = $('<iframe>');
    videos.attr('src', youTubeVid);
    videos.attr('class', 'embed-responsive-item');
    $('#videos-display').append(videos);
  });
}

function translateLyrics(originalLyrics) {
  const yandexBaseUrl = 'https://translate.yandex.net/api/v1.5/tr.json/translate';
  const yandexAPIKey = 'trnsl.1.1.20190406T143223Z.056b981f8fc972d3.8e9576d91e670036aa4c8e89760c7acfa28805f4';
  const translateLang = $('#language-input option:selected').text();
  const translateLangCode = $('#language-input option:selected').val();
  const rawTranslateText = originalLyrics;
  const translateText = rawTranslateText.replace(/ /g, '+');
  const yandexQueryURL = `${yandexBaseUrl}?key=${yandexAPIKey}&lang=${translateLangCode}&text=${translateText}&format=plain`;

  $.ajax({
    url: yandexQueryURL,
    method: 'GET',
  }).then((response) => {
    $('#language-display').text(`Language: ${translateLang}`);
    $('#translated-lyrics-display').html(
      `Translated Lyrics:<br> ${response.text}`,
    );

    $('#results-display').show()
  });
}

function lyricsSearch(trackId) {
  $.ajax({
    type: 'GET',
    data: {
      apikey: '601f04e0a4bfae6c0d2125b377f1b935',
      track_id: trackId,
      format: 'jsonp',
      callback: 'jsonp_callback',
    },
    url: 'https://api.musixmatch.com/ws/1.1/track.lyrics.get',
    dataType: 'jsonp',
    jsonpCallback: 'jsonp_callback',
    contentType: 'application/json',
    success(response) {
      $('#translated-lyrics-display').empty();

      const lyrics = response.message.body.lyrics.lyrics_body;

      $('#original-lyrics-display').html(`Original Lyrics:<br> ${lyrics}`);

      translateLyrics(lyrics);
    },
  });
}

function songInfoSearch(song, artist) {
  let trackId;

  $.ajax({
    type: 'GET',
    data: {
      apikey: '601f04e0a4bfae6c0d2125b377f1b935',
      q: `${song} ${artist}`,
      has_lyrics: true,
      format: 'jsonp',
      callback: 'jsonp_callback',
    },
    url: 'https://api.musixmatch.com/ws/1.1/track.search?q=',
    dataType: 'jsonp',
    jsonpCallback: 'jsonp_callback',
    contentType: 'application/json',
    success(response) {
      $('#song-name-display').empty();

      const songDiv = $('<div>');
      songDiv.attr('class', 'artist');
      songDiv.html(response.message.body.track_list[0].track.track_name);
      trackId = response.message.body.track_list[0].track.track_id;
      $('#song-name-display').append(songDiv);

      database.ref('/songs').set({
        lastSong: response.message.body.track_list[0].track.track_name,
      });

      lyricsSearch(trackId);
    },
  });
}


$('#submit-button').on('click', (event) => {
  event.preventDefault();

  const songQuery = $('#song-title-input').val().trim();
  const artistQuery = $('#song-artist-input').val().trim();

  songInfoSearch(songQuery, artistQuery);
  videoSearch(songQuery, artistQuery);

  $('#song-title-input').val('');
  $('#song-artist-input').val('');
});

$('#commentForm').validate();

$('#submitBtn').on('click', (event) => {
  event.preventDefault();
  $('#cname').val().trim();
  $('#ccomment').val().trim();

  const newNameCard = $('#cname').val().trim();
  const newUserComment = $('#ccomment').val().trim();
  const newUserEmail = $('#cemail').val().trim();


  const object = [
    {
      value: newNameCard,
      jQ: $('#cname'),
      message: 'Please enter a name',
    },
    {
      value: newUserEmail,
      jQ: $('#cemail'),
      message: 'Enter your email',
    },
    {
      value: newUserComment,
      jQ: $('#ccomment'),
      message: 'Enter a message',
    },
  ];

  for (let i = 0; i < object.length; i += 1) {
    if (object[i].value.length === 0) {
      object[i].jQ.css('background', 'red').val(object[i].message).css('color', 'white');
    }
  }

  const newUserInfo = {
    name: newNameCard,
    email: newUserEmail,
    comment: newUserComment,
  };
  if (newNameCard.length > 0 && newUserComment.length > 0 && newUserEmail.length > 0) {
    comment.push(newUserInfo);
    $('#cname').val('');
    $('#cemail').val('');
    $('#ccomment').val('');
  }
  // else if (newNameCard.length === 0){
  //   $('#cname').css('background', 'red').val('Please enter a name').css('color', 'white');


// }
});

comment.on('child_added', (childSnapshot) => {
  const newNameCard = childSnapshot.val().name;
  const newUserComment = childSnapshot.val().comment;

  const newCommentCard = $('<div>');
  newCommentCard.addClass('card text-center');
  const newComment = $('<div>');
  newComment.addClass('card-title');
  const commentName = $('<h5>');
  commentName.addClass('card-title');
  const commentText = $('<p>');
  commentText.addClass('card-text');

  commentText.css('border-bottom', '1px #888 solid');
  commentName.text(newNameCard);
  commentText.text(newUserComment);

  newCommentCard.append(newNameCard).append(newUserComment);

  $('#card-text-center').append(commentName);
  $('#card-text-center').append(commentText);
  $('#cname').val('');
  $('#cemail').val('');
  $('#ccomment').val('');
});
