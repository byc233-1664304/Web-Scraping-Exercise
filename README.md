# Web-Scraping-Exercise Project Setup and Testing Guide

## Prerequisites

- Ensure you have **Node.js** and **TypeScript** installed.
- Install **ts-node** globally if you haven’t already:
  ```sh
  npm install -g ts-node
  ```

## Cloning the Repository

1. Clone the repository from GitHub:
   ```sh
   git clone https://github.com/byc233-1664304/Web-Scraping-Exercise.git
   ```
2. Navigate to the project directory:
   ```sh
   cd <your-project-folder>
   ```

## Running the Server

To start the server, execute the following command in the project root directory and enter your password:

```sh
sudo ts-node src/server.ts
```

## Testing the API Endpoint

1. Open **Postman** (or use `curl` or any API testing tool of your choice).
2. Send a `GET` request to:
   ```
   http://localhost:5001/scrape
   ```
   - This will scrape results for **Seattle, WA** by default.
3. If you want to customize the search city, you have two options:
   - Modify the **default value** of the `city` variable on **line 14** in `server.ts` to your desired city in the format:
     ```js
     {cityFullName, StateInTwoUppercaseLetters}
     ```
     Example:
     ```js
     {San Jose, CA}
     ```
   - Alternatively, you can specify the city directly in the request query by appending it to the request URL:
     ```
     http://localhost:5001/scrape?city=San%20Jose,%20CA
     ```

## Stopping the Server

- Once scraping is complete, **terminate the server** to free up system resources:
  ````sh
  Ctrl + C
  ``` (in the terminal)
  ````

## Notes

- Ensure that the server is running before making API requests.
- The city name must follow the format `{City Full Name, State Abbreviation}` to avoid errors.
- Running the server with `sudo` may be necessary depending on your system configuration.

Happy coding!

