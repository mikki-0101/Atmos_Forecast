const $ = (id) => document.getElementById(id);

const form = $("searchForm");
const input = $("cityInput");
const button = $("searchButton");
const statusText = $("status");
const suggestionsBox = $("citySuggestions");

// -------------------- POPULAR CITIES --------------------

const popularCities = [
  { name: "Pune", country: "India" },
  { name: "Mumbai", country: "India" },
  { name: "Delhi", country: "India" },
  { name: "Bengaluru", country: "India" },
  { name: "Hyderabad", country: "India" },
  { name: "Chennai", country: "India" }
];

// -------------------- WEATHER DESCRIPTIONS --------------------

const weatherDescriptions = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Moderate drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Heavy freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Moderate rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Light snowfall", "🌨️"],
  73: ["Moderate snowfall", "🌨️"],
  75: ["Heavy snowfall", "❄️"],
  77: ["Snow grains", "❄️"],
  80: ["Light rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Heavy rain showers", "⛈️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Severe thunderstorm", "⛈️"]
};

function weatherInfo(code) {
  return weatherDescriptions[code] ||
    ["Unknown conditions", "🌡️"];
}

function setText(id, value) {
  const element = $(id);

  if (element) {
    element.textContent = value;
  }
}

function number(value, digits = 0) {
  return Number.isFinite(value)
    ? value.toFixed(digits)
    : "--";
}

function formatTime(value) {
  if (!value) return "--:--";

  const time = value.includes("T")
    ? value.split("T")[1]
    : value;

  const [hour, minute] = time.split(":").map(Number);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return "--:--";
  }

  const displayHour = hour % 12 || 12;
  const suffix = hour >= 12 ? "PM" : "AM";

  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatDay(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(
    "en-IN",
    { weekday: "short" }
  );
}

// -------------------- API ERROR HANDLING --------------------

async function getJSON(url) {
  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error(
      "Network error. Check your internet connection and try again."
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "Too many requests. Please wait a moment and try again."
      );
    }

    if (response.status >= 500) {
      throw new Error(
        "The weather service is temporarily unavailable. Try again later."
      );
    }

    throw new Error(
      "Unable to fetch data. Please try again."
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error(
      "The weather service returned an invalid response."
    );
  }
}

// -------------------- CITY SEARCH --------------------

async function searchCity(city) {
  const url = new URL(
    "https://geocoding-api.open-meteo.com/v1/search"
  );

  url.search = new URLSearchParams({
    name: city,
    count: "10",
    language: "en",
    format: "json"
  });

  const data = await getJSON(url);

  if (!data.results?.length) {
    throw new Error(
      `City "${city}" not found. Check the spelling and try again.`
    );
  }

  return data.results;
}

let suggestionRequest = 0;
let searchRequest = 0;

function closeSuggestions() {
  if (!suggestionsBox) return;

  suggestionsBox.classList.remove("show");
  suggestionsBox.replaceChildren();

  input?.setAttribute("aria-expanded", "false");
}

function showSuggestions(cities) {
  if (!suggestionsBox) return;

  suggestionsBox.replaceChildren();

  if (!cities.length) {
    const empty = document.createElement("div");

    empty.className = "city-empty";
    empty.textContent = "No cities found. Try another name.";

    suggestionsBox.append(empty);
  } else {
    cities.forEach((city, index) => {
      const option = document.createElement("button");

      option.type = "button";
      option.className = "city-option";
      option.setAttribute("role", "option");
      option.id = `city-option-${index}`;

      const pin = document.createElement("span");

      pin.className = "city-pin";
      pin.textContent = "📍";

      const info = document.createElement("span");

      info.className = "city-info";

      const name = document.createElement("span");

      name.className = "city-name";
      name.textContent = city.name;

      const country = document.createElement("span");

      country.className = "city-country";
      country.textContent = [
        city.admin1,
        city.country
      ].filter(Boolean).join(", ");

      info.append(name, country);
      option.append(pin, info);

      // Select a city from the suggestions.
      option.addEventListener("click", () => {
        input.value = city.name;
        closeSuggestions();

        // Popular cities don't have coordinates initially.
        if (
          Number.isFinite(city.latitude) &&
          Number.isFinite(city.longitude)
        ) {
          loadDashboard(city);
        } else {
          loadDashboard(city.name);
        }
      });

      suggestionsBox.append(option);
    });
  }

  suggestionsBox.classList.add("show");
  input?.setAttribute("aria-expanded", "true");
}

async function updateSuggestions() {
  const query = input.value.trim();
  const requestId = ++suggestionRequest;

  if (!query) {
    showSuggestions(popularCities);
    return;
  }

  const matches = popularCities.filter((city) =>
    city.name.toLowerCase().includes(query.toLowerCase())
  );

  showSuggestions(matches);

  if (query.length < 2) return;

  try {
    const url = new URL(
      "https://geocoding-api.open-meteo.com/v1/search"
    );

    url.search = new URLSearchParams({
      name: query,
      count: "8",
      language: "en",
      format: "json"
    });

    const data = await getJSON(url);

    // Ignore outdated suggestion requests.
    if (requestId !== suggestionRequest) return;
    if (input.value.trim() !== query) return;

    const results = (data.results || []).map((place) => ({
      name: place.name,
      country: place.country || "",
      admin1: place.admin1 || "",
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone
    }));

    showSuggestions(results);
  } catch {
    // Keep popular-city suggestions visible if the API fails.
  }
}

input?.addEventListener("focus", updateSuggestions);
input?.addEventListener("input", updateSuggestions);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-bar")) {
    closeSuggestions();
  }
});

input?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSuggestions();
  }

  if (event.key === "ArrowDown") {
    const firstOption =
      suggestionsBox?.querySelector(".city-option");

    if (firstOption) {
      event.preventDefault();
      firstOption.focus();
    }
  }
});

// -------------------- WEATHER API --------------------

async function getWeather(place) {
  const url = new URL(
    "https://api.open-meteo.com/v1/forecast"
  );

  url.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,

    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "cloud_cover",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m"
    ].join(","),

    hourly: [
      "uv_index",
      "visibility"
    ].join(","),

    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset"
    ].join(","),

    timezone: place.timezone || "auto",
    forecast_days: "6"
  });

  return getJSON(url);
}

async function getAirQuality(place) {
  const url = new URL(
    "https://air-quality-api.open-meteo.com/v1/air-quality"
  );

  url.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,

    current: [
      "european_aqi",
      "us_aqi",
      "pm10",
      "pm2_5"
    ].join(","),

    timezone: place.timezone || "auto"
  });

  return getJSON(url);
}

// -------------------- CURRENT WEATHER --------------------

function renderCurrent(data, place) {
  const current = data.current;
  const info = weatherInfo(current.weather_code);

  const locationParts = [
    place.name,
    place.admin1,
    place.country
  ].filter(Boolean);

  setText("location", locationParts.join(", "));

  setText(
    "currentDate",
    new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long"
    })
  );

  setText("mainIcon", info[1]);
  setText(
    "temperature",
    `${Math.round(current.temperature_2m)}°`
  );
  setText("condition", info[0]);

  setText(
    "feelsLike",
    `${number(current.apparent_temperature)}°C`
  );

  setText(
    "humidity",
    `${number(current.relative_humidity_2m)}%`
  );

  setText(
    "wind",
    `${number(current.wind_speed_10m)} km/h`
  );

  setText(
    "pressure",
    `${number(current.pressure_msl)} hPa`
  );

  setText(
    "cloudCover",
    `${number(current.cloud_cover)}%`
  );

  setText(
    "precipitation",
    `${number(current.precipitation, 1)} mm`
  );

  setText(
    "windDirection",
    `${number(current.wind_direction_10m)}°`
  );

  // Find the closest hourly data point.
  const times = data.hourly.time || [];

  const currentTimestamp = new Date(
    current.time.replace(" ", "T")
  ).getTime();

  let closestIndex = 0;
  let closestDifference = Infinity;

  times.forEach((time, index) => {
    const difference = Math.abs(
      new Date(time).getTime() - currentTimestamp
    );

    if (difference < closestDifference) {
      closestDifference = difference;
      closestIndex = index;
    }
  });

  const uv = data.hourly.uv_index?.[closestIndex];
  const visibility = data.hourly.visibility?.[closestIndex];

  setText("uvIndex", number(uv, 1));

  setText(
    "uvLabel",
    !Number.isFinite(uv)
      ? "Unavailable"
      : uv <= 2
      ? "Low"
      : uv <= 5
      ? "Moderate"
      : uv <= 7
      ? "High"
      : uv <= 10
      ? "Very high"
      : "Extreme"
  );

  setText(
    "uvAdvice",
    !Number.isFinite(uv)
      ? "UV data is unavailable."
      : uv <= 2
      ? "Low risk from the sun."
      : uv <= 5
      ? "Consider sunscreen and sunglasses."
      : "Use sunscreen, shade and protective clothing."
  );

  const uvBar = $("uvBar");

  if (uvBar) {
    uvBar.style.left =
      `${Math.min(100, Math.max(0, (uv || 0) / 11 * 100))}%`;
  }

  setText(
    "visibility",
    Number.isFinite(visibility)
      ? number(visibility / 1000, 1)
      : "--"
  );
}

// -------------------- 5-DAY FORECAST --------------------

function renderForecast(data) {
  const daily = data.daily;
  const container = $("forecast");

  if (!container) return;

  container.replaceChildren();

  for (let i = 1; i <= 5; i++) {
    if (!daily.time[i]) continue;

    const info = weatherInfo(daily.weather_code[i]);

    const row = document.createElement("div");
    row.className = "forecast-item";

    const day = document.createElement("span");
    day.className = "forecast-day";
    day.textContent = formatDay(daily.time[i]);

    const icon = document.createElement("span");
    icon.className = "forecast-icon";
    icon.textContent = info[1];
    icon.title = info[0];

    const temps = document.createElement("span");
    temps.className = "forecast-temps";

    temps.append(
      document.createTextNode(
        `${Math.round(daily.temperature_2m_max[i])}°`
      )
    );

    const low = document.createElement("span");
    low.className = "low";

    low.textContent =
      `${Math.round(daily.temperature_2m_min[i])}°`;

    temps.append(low);
    row.append(day, icon, temps);
    container.append(row);
  }
}

// -------------------- SUNRISE & SUNSET --------------------

function renderSunTimes(data) {
  const sunrise = data.daily.sunrise?.[0];
  const sunset = data.daily.sunset?.[0];

  setText("sunrise", formatTime(sunrise));
  setText("sunset", formatTime(sunset));

  if (sunrise && sunset) {
    const duration =
      (new Date(sunset) - new Date(sunrise)) / 3600000;

    setText(
      "daylight",
      `${number(duration, 1)} hours of daylight`
    );
  } else {
    setText("daylight", "-- hours of daylight");
  }
}

// -------------------- AIR QUALITY --------------------

function renderAirQuality(data) {
  const current = data.current;
  const aqi = current.european_aqi;

  const categories = [
    [20, "Good", "Air quality is good."],
    [40, "Fair", "Generally acceptable air quality."],
    [60, "Moderate", "Sensitive people should take care."],
    [80, "Poor", "Consider reducing prolonged outdoor activity."],
    [100, "Very poor", "Limit prolonged outdoor activity."],
    [Infinity, "Extremely poor", "Avoid strenuous outdoor activity."]
  ];

  const category = categories.find(
    ([limit]) => aqi <= limit
  ) || categories[categories.length - 1];

  setText("aqiValue", number(aqi));

  setText(
    "aqiLabel",
    Number.isFinite(aqi) ? category[1] : "Unavailable"
  );

  setText(
    "aqiAdvice",
    Number.isFinite(aqi)
      ? category[2]
      : "Air quality data is unavailable."
  );

  const aqiBar = $("aqiBar");

  if (aqiBar) {
    aqiBar.style.left =
      `${Math.min(100, Math.max(0, Number.isFinite(aqi) ? aqi : 0))}%`;
  }

  setText(
    "pm25",
    `${number(current.pm2_5, 1)} µg/m³`
  );

  setText(
    "pm10",
    `${number(current.pm10, 1)} µg/m³`
  );

  setText("Aqi", number(current.us_aqi));
}

function clearAirQuality() {
  setText("aqiValue", "--");
  setText("aqiLabel", "Unavailable");

  setText(
    "aqiAdvice",
    "Air quality data is temporarily unavailable."
  );

  setText("pm25", "-- µg/m³");
  setText("pm10", "-- µg/m³");
  setText("Aqi", "--");

  const aqiBar = $("aqiBar");

  if (aqiBar) {
    aqiBar.style.left = "0%";
  }
}

// -------------------- LOAD DASHBOARD --------------------

async function loadDashboard(cityOrPlace) {
  const requestId = ++searchRequest;

  if (button) button.disabled = true;

  if (statusText) {
    statusText.textContent = "Loading weather data...";
  }

  try {
    let place;

    if (typeof cityOrPlace === "string") {
      const results = await searchCity(cityOrPlace);

      // Prefer an exact city-name match.
      place = results.find(
        (item) =>
          item.name.toLowerCase() === cityOrPlace.toLowerCase()
      ) || results[0];
    } else {
      place = cityOrPlace;
    }

    // Ignore outdated searches.
    if (requestId !== searchRequest) return;

    if (
      !Number.isFinite(place.latitude) ||
      !Number.isFinite(place.longitude)
    ) {
      throw new Error(
        "Couldn't find the location coordinates. Search for the city again."
      );
    }

    const [weather, airQuality] = await Promise.all([
      getWeather(place),
      getAirQuality(place).catch(() => null)
    ]);

    if (requestId !== searchRequest) return;

    if (!weather.current || !weather.daily || !weather.hourly) {
      throw new Error(
        "Weather data is incomplete. Please try again."
      );
    }

    renderCurrent(weather, place);
    renderForecast(weather);
    renderSunTimes(weather);

    if (airQuality?.current) {
      renderAirQuality(airQuality);
    } else {
      clearAirQuality();
    }

    if (statusText) {
      statusText.textContent =
        `Weather updated for ${place.name} · Local time ${formatTime(weather.current.time)}`;
    }
  } catch (error) {
    if (requestId === searchRequest && statusText) {
      statusText.textContent =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
    }
  } finally {
    if (requestId === searchRequest && button) {
      button.disabled = false;
    }
  }
}

// -------------------- SEARCH: ENTER + BUTTON --------------------

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = input?.value.trim();

  if (!city) {
    if (statusText) {
      statusText.textContent = "Please enter a city name.";
    }

    input?.focus();
    return;
  }

  closeSuggestions();
  loadDashboard(city);
});

// -------------------- DEFAULT CITY --------------------

if (input) {
  input.value = "Pune";
}

loadDashboard("Pune");

// -------------------- NAVBAR DATE & TIME --------------------

function updateDateTime() {
  const dateTimeElement = $("liveDateTime");

  if (!dateTimeElement) return;

  const now = new Date();

  const date = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  dateTimeElement.textContent = `${date} · ${time}`;
}

updateDateTime();
setInterval(updateDateTime, 1000);