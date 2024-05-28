// Import the required modules
const cron = require("node-cron");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
// Initialize the Telegram bot
const bot = new TelegramBot(process.env.NEXT_PUBLIC_TELEGRAM_BOT_SPRING);
const chatId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_SPRING;
const openCageApiKey = process.env.NEXT_PUBLIC_OPEN_CAGE_API_KEY;

const previousFuelLevels = new Map();
// Define a function to fetch the data from the API
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      throw error;
    }
  }
}
//   cron.schedule('*/35 20-23,0-4 * * *', async () => {
//     try {
//         const response = await fetchWithRetry('https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$VXtNMjhCxIby1yWC83Ujyesy5ONvy22hKe3/QoUtSVEizqLVZJBvq');
//         const data = await response.json();
//         for (const item of data) {
//             for (const [index, vehicle] of item.items.entries()) {
//                 if (vehicle.speed > 10) {
//                     const latLng = `${vehicle.lat},${vehicle.lng}`;
//                     const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latLng}&key=${openCageApiKey}`;
//                     let location = 'Unknown Location';
//                     try {
//                         const geocodeResponse = await fetch(geocodeUrl);
//                         const geocodeData = await geocodeResponse.json();
//                         if (geocodeData.results && geocodeData.results[0]) {
//                             const locationData = geocodeData.results[0];
//                             location = locationData.formatted;
//                         }
//                     } catch (error) {
//                         console.error('Failed to fetch vehicle data:', error);
//                     }
//                     const googleMapsUrl =`http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
//                     const message = `NIGHT DRIVING ${vehicle.name} is driving: ${vehicle.time} , at speed: ${vehicle.speed}, near: ${location} Google Maps link (${googleMapsUrl}), `;
//                     await new Promise(resolve => setTimeout(resolve, index * 1000));
//                     bot.sendMessage(chatId, message).catch(error => console.error('Failed to send message:', error));
//                 }
//             }
//         }
//     } catch (error) {
//         console.error('Failed to fetch vehicle data:', error);
//     }
// });
// console.log('Night Driving Bot is running...');

// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$VXtNMjhCxIby1yWC83Ujyesy5ONvy22hKe3/QoUtSVEizqLVZJBvq",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        if (vehicle.speed > 81) {
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `https://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `OVERSPEEDING! ${vehicle.name} is moving at Speed: ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;
          await new Promise((resolve) => setTimeout(resolve, index * 1000));
          bot
            .sendMessage(chatId, message)
            .catch((error) => console.error("Failed to send message:", error));
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});
console.log("Overspeeding Bot is running...");

//harsh breaking
let previousSpeeds = {};

// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$VXtNMjhCxIby1yWC83Ujyesy5ONvy22hKe3/QoUtSVEizqLVZJBvq",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const previousSpeed = previousSpeeds[vehicle.id];
        if (vehicle.speed < 8 && previousSpeed > 20) {
          // Adjust the speed threshold as needed
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `https://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `HARSH BRAKING ALERT! ${vehicle.name} has stopped suddenly from ${previousSpeed} to ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;
          await new Promise((resolve) => setTimeout(resolve, index * 1000));
          bot
            .sendMessage(chatId, message)
            .catch((error) => console.error("Failed to send message:", error));
        }
        // Update the previous speed for this vehicle
        previousSpeeds[vehicle.id] = vehicle.speed;
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("Harsh Braking Bot is running...");

//harsh acceleration

// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$VXtNMjhCxIby1yWC83Ujyesy5ONvy22hKe3/QoUtSVEizqLVZJBvq",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const previousSpeed = previousSpeeds[vehicle.id];
        if (vehicle.speed > previousSpeed + 30) {
          // Adjust the speed increase threshold as needed
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `https://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `HARSH ACCELERATION ALERT! ${vehicle.name} has accelerated suddenly from ${previousSpeed} to ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;
          await new Promise((resolve) => setTimeout(resolve, index * 1000));
          bot
            .sendMessage(chatId, message)
            .catch((error) => console.error("Failed to send message:", error));
        }
        // Update the previous speed for this vehicle
        previousSpeeds[vehicle.id] = vehicle.speed;
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});
// this code is for harsh acceleration, it will check the speed of the vehicle and if the speed increases suddenly by 20km/h, from the current speed. It will send a message with the location and time of the vehicle.

console.log("Harsh Acceleration Bot is running...");

// Stop Overs and No Movement
const noMovementThreshold = 30 * 60; // sets the stop duration time to 40 minutes in seconds
cron.schedule("*/30 * * * *", async () => {
  // check every 5 minutes if the vehicle has moved
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$VXtNMjhCxIby1yWC83Ujyesy5ONvy22hKe3/QoUtSVEizqLVZJBvq",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const googleMapsUrl = `https://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
        let message;
        // Define currentTime here
        const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
        if (vehicle.speed == 0) {
          // Check if the vehicle has moved in the last hour
          const timeSinceLastMovement = currentTime - vehicle.moved_timestamp;
          if (timeSinceLastMovement > noMovementThreshold) {
            const hours = Math.floor(timeSinceLastMovement / 3600);
            const minutes = Math.floor((timeSinceLastMovement % 3600) / 60);
            const seconds = timeSinceLastMovement % 60;
            const duration = `${hours}h ${minutes}min ${seconds}s`;
            message = `STOP DURATION: ${vehicle.name} STOPPED FOR  ${duration}, Location: ${googleMapsUrl}, Time: ${vehicle.time}`;
            await new Promise((resolve) => setTimeout(resolve, index * 1000));
            bot
              .sendMessage(chatId, message)
              .catch((error) =>
                console.error("Failed to send message:", error),
              );
          }
        } else {
          vehicle.moved_timestamp = currentTime;
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

//hash berakking

// fuel level monitoring

// Add a new cron job to run every 30 minutesute
cron.schedule("*/20 * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$VXtNMjhCxIby1yWC83Ujyesy5ONvy22hKe3/QoUtSVEizqLVZJBvq",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        // monitor fuel
        for (const sensor of vehicle.sensors) {
          if (sensor.type === "fuel_tank_calibration") {
            const latLng = `${vehicle.lat},${vehicle.lng}`;
            const googleMapsUrl = `https://maps.google.com/?q=${latLng}`;
            const message = `FUEL LEVEL! for ${vehicle.name}: ${sensor.value},Time: ${vehicle.time},Location: ${googleMapsUrl}`;
            await new Promise((resolve) => setTimeout(resolve, index * 1000));
            bot
              .sendMessage(chatId, message)
              .catch((error) =>
                console.error("Failed to send message:", error),
              );
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("Fuel Level Bot is running...");

///

async function fetchAndStoreFuelLevels() {
  const response = await fetchWithRetry(
    "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$VXtNMjhCxIby1yWC83Ujyesy5ONvy22hKe3/QoUtSVEizqLVZJBvq",
  );
  const data = await response.json();
  for (const item of data) {
    for (const vehicle of item.items) {
      for (const sensor of vehicle.sensors) {
        if (sensor.type === "fuel_tank_calibration") {
          // Parse the number from the string
          const fuelLevel = parseFloat(sensor.value);
          previousFuelLevels[vehicle.id] = fuelLevel;
        }
      }
    }
  }
}

async function fetchAndCompareFuelLevels() {
  const response = await fetchWithRetry(
    "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$VXtNMjhCxIby1yWC83Ujyesy5ONvy22hKe3/QoUtSVEizqLVZJBvq",
  );
  const data = await response.json();
  for (const item of data) {
    for (const [index, vehicle] of item.items.entries()) {
      // monitor fuel theft and filling
      for (const sensor of vehicle.sensors) {
        if (sensor.type === "fuel_tank_calibration") {
          // Parse the number from the string
          const currentFuelLevel = parseFloat(sensor.value);
          const previousFuelLevel = previousFuelLevels[vehicle.id];
          // If the current fuel level is significantly lower than the previous level, send an alert
          // if (previousFuelLevel && currentFuelLevel < previousFuelLevel -15) {
          //     const latLng = `${vehicle.lat},${vehicle.lng}`;
          //     const googleMapsUrl =`http://maps.google.com/?q=${latLng}`;
          //     const message = `FUEL THEFT ALERT! for ${vehicle.name}: Fuel level dropped from ${previousFuelLevel} to ${currentFuelLevel},Time: ${vehicle.time},Location: ${googleMapsUrl}`;
          //     await new Promise(resolve => setTimeout(resolve, index * 1000));
          //     bot.sendMessage(chatId, message).catch(error => console.error('Failed to send message:', error));
          // }
          // If the current fuel level is significantly higher than the previous level, send an alert
          if (previousFuelLevel && currentFuelLevel > previousFuelLevel + 15) {
            const latLng = `${vehicle.lat},${vehicle.lng}`;
            const googleMapsUrl = `https://maps.google.com/?q=${latLng}`;
            const message = `FUEL FILLING ALERT! for ${vehicle.name}: Fuel level increased from ${previousFuelLevel} to ${currentFuelLevel},Time: ${vehicle.time},Location: ${googleMapsUrl}`;
            await new Promise((resolve) => setTimeout(resolve, index * 1000));
            bot
              .sendMessage(chatId, message)
              .catch((error) =>
                console.error("Failed to send message:", error),
              );
          }
          // Update the previous fuel level for this vehicle
          previousFuelLevels[vehicle.id] = currentFuelLevel;
        }
      }
    }
  }
}

cron.schedule("* * * * *", async () => {
  try {
    await fetchAndStoreFuelLevels();
    setTimeout(fetchAndCompareFuelLevels, 1 * 60 * 1000);
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("Fuel filling detection bot is running...");
