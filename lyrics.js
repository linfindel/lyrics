const accentColour = localStorage.getItem("colour");
var customTitles = JSON.parse(localStorage.getItem("custom-titles")) || {};
let previewTimeLock;
const audioElement = document.getElementById("audio");

document.getElementById("accent-colour-css").innerText = `
nav, button, .card-flat, .card-flat-right, .card-flat-top-right-alt, .card-flat-bottom-right-alt {
  background-color: ${accentColour};
}

button:not(#play, #stop, #repeat):hover {
  background-color: ${accentColour.replace("0.25", "0.5")} !important;
}

input {
  background-color: ${accentColour} !important;
}
`;

function uploadFile() {
  let input = document.createElement('input');
  input.type = 'file';

  if (navigator.userAgent.toLowerCase().includes('firefox')) {
    input.accept = 'audio/*';  
  }

  else {
    input.accept = 'audio/mp3, audio/wav, audio/ogg';
  }

  input.onchange = () => {
    let file = input.files[0];
    if (file) {
      jsmediatags.read(file, {
        onSuccess: function(tag) {
          image = tag.tags.picture;
          artist = tag.tags.artist;
          if (image) {
            var base64String = "";

            for (var i = 0; i < image.data.length; i++) {
              base64String += String.fromCharCode(image.data[i]);
            }
            
            base64 = "data:" + image.format + ";base64," + window.btoa(base64String);

            document.getElementById('cover-art').src = base64;

            document.getElementById("controls").style.opacity = 1;
            document.getElementById("controls").style.pointerEvents = "all";

            generateMaterialDesignPalette(base64, (error, palette) => {
              if (error) {
                console.error(error);

                const imgElement = document.getElementById('cover-art');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
              
                canvas.width = imgElement.width;
                canvas.height = imgElement.height;
              
                ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
              
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;
              
                const pixelColours = [];
                  
                for (let i = 0; i < pixels.length; i += 4) {
                  const red = pixels[i];
                  const green = pixels[i + 1];
                  const blue = pixels[i + 2];
              
                  const colour = `rgb(${red}, ${green}, ${blue})`;
                  pixelColours.push(colour);
                }
              
                const totalCount = pixelColours.length;

                pixelColours.sort();
                const medianColourIndex = Math.floor(totalCount / 2);
                medianColour = pixelColours[medianColourIndex];

                let rgbValues = medianColour.match(/\d+/g).map(Number);

                if (rgbValues.every(value => value < 50)) {
                  rgbValues[0] = 50;
                  rgbValues[1] = 50;
                  rgbValues[2] = 50;

                  console.warn("Median colour is black, falling back on rgba(50, 50, 50, 0.25)...");
                }

                medianColour = "#";

                for (let i = 0; i < 3; i++) {
                  let hexPart = rgbValues[i].toString(16);
                  medianColour += hexPart.length == 1 ? "0" + hexPart : hexPart;
                }
              }

              if (palette) {
                document.getElementById("progress-container").style.backgroundColor = generateRGBA(palette.accent, 0.25);
                document.getElementById("progress-bar").style.backgroundColor = palette.accent;

                document.getElementById("details").style.backgroundColor = generateRGBA(palette.accent, 0.25);
                document.getElementById("play").style.backgroundColor = generateRGBA(palette.accent, 0.25);
                document.getElementById("stop").style.backgroundColor = generateRGBA(palette.accent, 0.25);

                document.getElementById("play").addEventListener("mouseenter", () => {
                  document.getElementById("play").style.backgroundColor = generateRGBA(palette.accent, 0.5);
                });

                document.getElementById("play").addEventListener("mouseleave", () => {
                  document.getElementById("play").style.backgroundColor = generateRGBA(palette.accent, 0.25);
                });

                document.getElementById("stop").addEventListener("mouseenter", () => {
                  document.getElementById("stop").style.backgroundColor = generateRGBA(palette.accent, 0.5);
                });

                document.getElementById("stop").addEventListener("mouseleave", () => {
                  document.getElementById("stop").style.backgroundColor = generateRGBA(palette.accent, 0.25);
                });
              }

              else {
                document.getElementById("progress-container").style.backgroundColor = generateRGBA(medianColour, 0.25);
                document.getElementById("progress-bar").style.backgroundColor = medianColour;

                document.getElementById("details").style.backgroundColor = generateRGBA(medianColour, 0.25);
                document.getElementById("play").style.backgroundColor = generateRGBA(medianColour, 0.25);
                document.getElementById("stop").style.backgroundColor = generateRGBA(medianColour, 0.25);

                document.getElementById("play").addEventListener("mouseenter", () => {
                  document.getElementById("play").style.backgroundColor = generateRGBA(medianColour, 0.5);
                });

                document.getElementById("play").addEventListener("mouseleave", () => {
                  document.getElementById("play").style.backgroundColor = generateRGBA(medianColour, 0.25);
                });

                document.getElementById("stop").addEventListener("mouseenter", () => {
                  document.getElementById("stop").style.backgroundColor = generateRGBA(medianColour, 0.5);
                });

                document.getElementById("stop").addEventListener("mouseleave", () => {
                  document.getElementById("stop").style.backgroundColor = generateRGBA(medianColour, 0.25);
                });
              }
            })
          }
        },
        onError: function(error) {
          console.error('Error reading tags: ', error.type, error.info);
        }
      });

      let fileName = file.name;
      let lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        fileName = fileName.substring(0, lastDotIndex);
      }

      while (fileName.includes("_")) {
        fileName = fileName.replace("_", " ");
      }

      if (localStorage.getItem("numbering") == "enabled") {
        if (localStorage.getItem("custom-regex")) {
          let customRegex = localStorage.getItem("custom-regex");

          while (customRegex.includes("/")) {
            customRegex = customRegex.replace("/", "");
          }

          customRegex = RegExp(customRegex);

          fileName = fileName.replace(customRegex, '');
        }

        else {
          fileName = fileName.replace(/^\d+ - /, '');
        }
      }

      let reader = new FileReader();
      reader.onload = function (e) {
        let fileURL = e.target.result;

        document.getElementById("audio").src = fileURL;
        document.getElementById("audio").play();

        document.getElementById("audio").addEventListener("loadedmetadata", () => {
          document.getElementById("title").innerText = fileName;

          document.title = `${fileName} - Lyrics Studio`;

          if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: fileName,
              artist: artist,
              artwork: [{ src: base64 }],
            });
          }

          if (customTitles[fileName]) {
            document.getElementById("title").innerText = customTitles[fileName];
            document.title = `${customTitles[fileName]} - Lyrics Studio`;
          }
        });
      };

      reader.readAsDataURL(file);
    }};

  input.click();
}

function generateMaterialDesignPalette(imageURL, callback) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  
  img.onload = function () {
    const vibrant = new Vibrant(img);
    const swatches = vibrant.swatches();
  
    if (swatches) {
      try {
        const palette = {
          accent: swatches.Vibrant.getHex(),
          primaryDark: swatches.DarkVibrant.getHex(),
          primaryLight: swatches.LightVibrant.getHex(),
          primary: swatches.Muted.getHex(),
        };

        callback(null, palette);
      }

      catch {
        callback("Dynamic colour not found, falling back on median...", null);
      }
    }
        
    else {
      callback("Failed to generate swatches", null);
    }
  };
  
  img.src = imageURL;
}

function generateRGBA(hex, alpha) {
  hex = hex.replace(/^#/, '');

  const bigint = parseInt(hex, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const progressContainer = document.getElementById("progress-container");
const timestamp = document.getElementById("timestamp");

function formatTime(timeInSeconds) {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  const formattedHours = hours > 0 ? `${hours.toString().padStart(2, "0")}:` : "";
  const formattedMinutes = `${minutes.toString().padStart(2, "0")}:`;
  const formattedSeconds = seconds.toString().padStart(2, "0");

  return hours > 0 ? `${formattedHours}${formattedMinutes}${formattedSeconds}` : `${formattedMinutes}${formattedSeconds}`;
}

function updateProgressClick(event) {
  const progressBar = document.getElementById("progress-bar");
  const progressContainer = document.getElementById("progress-container");
  const offsetX = event.clientX - progressContainer.getBoundingClientRect().left;
  const percentage = (offsetX / progressContainer.offsetWidth) * 100;

  progressBar.style.width = `${percentage}%`;
  const newTime = (percentage / 100) * document.getElementById("audio").duration;
  document.getElementById("audio").currentTime = newTime;
}

document.getElementById("progress-container").addEventListener("click", updateProgressClick);

setInterval(() => {
  try {
    if (audioElement.paused) {
      document.getElementById("play-icon").innerText = "play_arrow";
    }

    else {
      document.getElementById("play-icon").innerText = "pause";
    }
  }

  catch {
    // Audio playback has not started
  }
}, 100);


const durationInterval = setInterval(() => {
  var duration = document.getElementById("audio").duration;

  if (duration) {
    var currentTime = document.getElementById("audio").currentTime;
        
    var percent = `${(currentTime / duration) * 100}%`;

    document.getElementById("progress-bar").style.width = percent;

    if (!previewTimeLock) {
      const formattedTime = formatTime(currentTime);
      timestamp.innerText = formattedTime;
    }
  }

  else {
    document.getElementById("progress-bar").style.width = "0%";
  }
});

function play() {
  if (audioElement.src) {
    if (audioElement.paused) {
      audioElement.play();
    }
  
    else {
      audioElement.pause();
    }
  }
}

progressContainer.addEventListener("mousemove", previewTime);
progressContainer.addEventListener("mouseout", removePreviewTimeLock);

function previewTime(event) {
  previewTimeLock = true;

  const duration = document.getElementById("audio").duration;
  const offsetX = event.clientX - progressContainer.getBoundingClientRect().left;
  const percentage = (offsetX / progressContainer.offsetWidth) * 100;
  const currentTime = (percentage / 100) * duration;

  const formattedTime = formatTime(currentTime);

  timestamp.style.opacity = "1";
  timestamp.style.top = `${progressContainer.offsetTop - 16}px`;
  timestamp.style.left = `${event.pageX - progressContainer.getBoundingClientRect().left}px`;
  timestamp.textContent = formattedTime;
}

function removePreviewTimeLock() {
  previewTimeLock = false;
}

document.getElementById("controls").style.height = getComputedStyle(document.getElementById("controls")).height;