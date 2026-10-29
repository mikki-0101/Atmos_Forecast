# Atmos Forecast

A weather dashboard built with **HTML, CSS, and JavaScript** as a college assignment. Atmos Forecast presents current weather conditions, a five-day forecast, air-quality information, and other useful outdoor weather details in one place.

## Features

- **Current weather:** Temperature, feels-like temperature, humidity, wind speed, and atmospheric pressure.
- **5-day forecast:** Daily weather conditions with high and low temperatures.
- **Air quality:** Air Quality Index (AQI), PM2.5, and PM10 readings, with category-based guidance.
- **Sunrise and sunset:** Local sunrise and sunset times, plus estimated daylight duration.
- **UV index:** UV level and basic sun-protection advice.
- **Outdoor conditions:** Visibility, cloud cover, precipitation, and wind direction.
- **City search:** Search for cities with autocomplete suggestions and popular-city shortcuts.
- **Live date and time:** A continuously updating date-and-time display in the navigation bar.
- **Responsive layout:** Dashboard cards adapt to smaller screens.
- **Animated background:** A moving gradient background and translucent dashboard cards.

## Built With

- **HTML5** — page structure and dashboard content
- **CSS3** — responsive styling, animated gradients, and card layouts
- **JavaScript (Vanilla)** — city search, API requests, data processing, and dynamic UI updates
- **Open-Meteo APIs** — geocoding, weather forecasts, and air-quality data

## APIs Used

Atmos Forecast uses the following public Open-Meteo endpoints:

- **Geocoding API:** `https://geocoding-api.open-meteo.com/v1/search`
- **Weather Forecast API:** `https://api.open-meteo.com/v1/forecast`
- **Air Quality API:** `https://air-quality-api.open-meteo.com/v1/air-quality`

Weather and air-quality data are requested for the selected city's coordinates. The dashboard handles common network and API errors and displays a message when data cannot be loaded.

## Getting Started

### Requirements

- A modern web browser
- An internet connection

### Run Locally

1. Clone or download this repository.
2. Keep the three project files in the same folder:
   - `index.html`
   - `style.css`
   - `script.js`
3. Open `index.html` in your browser.

For a more convenient development workflow, open the project folder in VS Code and use a local development server extension such as Live Server.

## Project Structure

```text
atmos-forecast/
├── index.html
├── style.css
└── script.js
```

## How to Use

1. Open the website. Pune is loaded as the default city.
2. Enter a city name in the search field.
3. Select a suggested city or press **Enter** / click **Search**.
4. Review the current conditions, forecast, air quality, daylight, UV index, and outdoor-condition details.

## Links

- **Live Demo:** [https://atmosforecast-3yd7xml6v-mohit-f6a3.vercel.app/]
- **GitHub Repository:** [https://github.com/mikki-0101/Atmos_Forecast]

## Notes

- An internet connection is required to retrieve weather, geocoding, and air-quality data.
- API responses and data availability depend on the Open-Meteo services.
- Air-quality information may be temporarily unavailable even when weather data loads successfully.

## Credits

Built by **Mohit Sharma**.
