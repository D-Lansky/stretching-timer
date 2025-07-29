---
title: Stretch Timer
emoji: ⏱️
colorFrom: purple
colorTo: indigo
sdk: static
pinned: false
---

# Stretch Timer

Stretch Timer is a simple progressive web app for timing your stretching intervals. Set how long to hold each stretch, how often to switch sides, and your total workout duration. The timer shows progress on screen and celebrates with confetti when you're done.

## Running locally

You can try the app locally by opening `index.html` in any modern browser. For the best PWA experience you may also serve the folder with a lightweight server such as Python's built in module:

```bash
python3 -m http.server
```

Then visit `http://localhost:8000` in your browser.

## Saving settings

After adjusting the sliders, click **Save Settings** to store your preferences. They are kept in your browser using `localStorage` so they persist the next time you open the page.

## Sounds

The timer plays beeps and a short tune. Browsers require a user interaction before audio can start, so press **Start** or any control to unlock sound.

## License

This project is licensed under the [MIT License](LICENSE).
