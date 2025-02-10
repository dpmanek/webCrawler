import puppeteer from "puppeteer";

// Function to get YouTube links for a list of tracks

// Function to scrape YouTube search and return the first video link
async function getYoutubeLinkCheerio(artist, song) {
  const query = `${artist} ${song} official`;
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query
  )}`;

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait for the first video thumbnail element to load
    // await page.waitForSelector('a#thumbnail.yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail');

    // Extract the href attribute of the first thumbnail
    const videoLink = await page.evaluate(() => {
      const videoElement = document.querySelector("a#video-title");
      console.log(videoElement);
      return videoElement
        ? `https://www.youtube.com${videoElement.getAttribute("href")}`
        : null;
    });

    await browser.close();
    return videoLink;
  } catch (error) {
    console.error(`Error scraping YouTube for ${artist} - ${song}:`, error);
    return null;
  }
}

export async function getYoutubeShareLinks(tracks) {
  const youtubeLinks = [];
  for (let track of tracks) {
    // Ensure track is an object, not an array
    const { id, artistName, songName, spotifyLink } = track;

    const youtubeLink = await getYoutubeLinkCheerio(artistName, songName);

    // Update the original track object with the new YouTube link data
    const updatedTrack = {
      ...track, // Spread the original track object
      youtubeLink: youtubeLink || "", // Ensure empty string if no YouTube link
      hasYoutubeLink: !!youtubeLink, // Convert to boolean (true if exists, false otherwise)
    };

    youtubeLinks.push(updatedTrack);
  }

  return youtubeLinks;
}
