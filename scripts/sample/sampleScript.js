import puppeteer from "puppeteer";

// Sample data
const data = [
  {
    artist: "Spada",
    song: "Want You Back",
    youtubeLink:
      "https://www.youtubepi.com/watch?v=ex2ZDz47xkM&pp=ygUcU3BhZGEgV2FudCBZb3UgQmFjayBvZmZpY2lhbA%3D%3D",
  },
  /*
  {
    artist: "Jan Blomqvist",
    song: "Time Again",
    youtubeLink: "https://www.youtubepi.com/watch?v=7l1nijTC_yM&pp=ygUhSmFuIEJsb21xdmlzdCBUaW1lIEFnYWluIG9mZmljaWFs"
  },
  */
  // Add more entries as needed
];

// Function to navigate to YouTube links and click the download button
async function downloadYoutubeVideos(data) {
  const browser = await puppeteer.launch({ headless: false }); // Change to true for headless
  const page = await browser.newPage();

  for (let item of data) {
    const { artist, song, youtubeLink } = item;

    try {
      console.log(`Processing: ${artist} - ${song}`);

      // Navigate to the YouTube video link
      await page.goto(youtubeLink, { waitUntil: "networkidle2" });

      // Click the "Start" button
      await page.evaluate(() => {
        const startButton = document.querySelector("button#btnSubmit");
        if (startButton) {
          startButton.click(); // Simulate the click on the "Start" button
        } else {
          console.error("Start button not found");
        }
      });
      /*
                  // Directly trigger the `onclick` function for the "Audio" tab
                  await page.evaluate(async () => {
                    const audioTabButton = document.querySelector('button[onclick="openTab(event, \'tabAudio\')"]');
                    if (!audioTabButton) {
                        console.error('Audio tab button not found');
                        return;
                    }   
                    audioTabButton.click();  // Simulate the click to trigger `openTab`

                    const convertButton = document.querySelector('td#btn320 button.btn');
                    if (!convertButton) {
                        console.error('Convert button not found');
                        return;
                    }

                    convertButton.click();

                    // Wait for the download button to appear timeout
                    await page.waitForTimeout(10000);   
                    const downloadButton = document.querySelector('a#download-video');
                    if (!downloadButton) {
                        console.error('Download button not found');
                        return;
                    }

                    downloadButton.click();
                 
                });
*/
      // Wait for the table containing the audio quality options
      // await page.waitForSelector('button.btn td#btn320');

      // Click the "Convert" button for 320kbps mp3
      // await page.click('button.btn td#btn320');

      console.log(`Download button clicked for: ${artist} - ${song}`);
    } catch (error) {
      console.error(`Failed to process ${artist} - ${song}:`, error);
    }
  }

  // await browser.close();
}

// Execute the function
downloadYoutubeVideos(data);
