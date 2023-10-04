const axios = require("axios");
const vrchat = require("vrchat");
const readline = require("readline");
const fs = require("fs");
const { Cookie } = require("tough-cookie");
const readlineSync = require('readline-sync');
require("dotenv").config();
const { blue, bold, underline, green, yellow, red, reset, gray } = require("colorette")
const totp = require("totp-generator");

/**
 * Create a new instance of a vrchat session with the given configuration.
 *
 * [!] If both the Username and the Password are omitted, the user will be prompted to enter them manually. when the object is initialized and the authentication is requested.
 * @constructor Create a new instance of a vrchat session
 * @param {string} username - The username of the account to authenticate with.
 * @param {string} password - The password of the account to authenticate with.
 * @param {boolean} use2FA - Whether to use 2FA or not. Defaults to `TRUE`
 * @param {boolean} loadCookies - Whether to load cookies from file or not. Defaults to `TRUE`
 */
class VRChatWrapper {
  constructor(username, password, use2FA = true, loadCookies = true) {
    // parameters passed to constructor
    console.log("--// VRChatWrapper Made by @lolmaxz //--\n");
    this.username = username;
    this.password = password;
    this.use2FA = use2FA;
    this.loadCookies = loadCookies;
    // ----
    this.cookieJar = axios["default"].defaults.jar;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.cookieFilePath = process.env.COOKIES_PATH || "./cookies.json";

    // validate username and password
    if (
      (username === "" && username !== password) ||
      (password === "" && username !== password)
    ) {
      console.error("Both the Username and Password are required.");
      return;
    }

    // if both username and password are empty, then we request the credentials from the user
    // + parameters used in the class

    this.manualCredentials = false;
    this.isAuthentificated = false;
    this.configuration = this.setConfiguration(username, password);
    this.authApi = new vrchat.AuthenticationApi(this.configuration);

    // configure all other APIs if they ever get used we will assign them to this so we don't have to instantiate them again
    // TODO - NOTE: not all of them are being used right now
    this.avatarsApi;
    this.economyApi;
    this.favoritesApi;
    this.filesApi;
    this.friendsApi;
    this.groupsApi;
    this.invitesApi;
    this.instancesApi;
    this.notificationsApi;
    this.permissionsApi;
    this.playerModerationApi;
    this.systemApi;
    this.usersApi;
    this.worldsApi;
  }

  // creates the config depending if we uses the cookies or not
  /**
   *
   * @param {string} username
   * @param {string} password
   * @returns {vrchat.Configuration}
   */
  setConfiguration(username, password) {
    let configuration;
    if (this.loadCookies) {
      configuration = new vrchat.Configuration({
        username: username,
        password: password,
        baseOptions: {
          headers: {
            "User-Agent":
              process.env.USER_AGENT || "ExampleApp/1.0.0 Email@example.com",
          },
          jar: this.cookieJar,
          withCredentials: true,
        },
      });
      // console.log(configuration);
    } else {
      configuration = new vrchat.Configuration({
        username: username,
        password: password,
        baseOptions: {
          headers: {
            "User-Agent":
              process.env.USER_AGENT || "ExampleApp/1.0.0 Email@example.com",
          },
          withCredentials: true,
        },
      });
    }

    return configuration;
  }

  /**
   * This function is called when the user is going to login with the use of the cookies
   */
  loadCookiesFromFile() {
    try {
      const cookieFileContent = fs.readFileSync(this.cookieFilePath, "utf8");
      const allCookies = JSON.parse(cookieFileContent);

      if (allCookies[this.username]) {
        const loadedCookies = allCookies[this.username];
        if (
          Array.isArray(loadedCookies) &&
          loadedCookies.every((cookie) => cookie.key && cookie.value)
        ) {
          loadedCookies.forEach((cookie) => {
            const expirationDate = new Date(cookie.expires);
            const currentDate = new Date();
            if (expirationDate > currentDate) {
              const newCookie = new Cookie({
                key: cookie.key,
                value: cookie.value,
                expires: expirationDate,
                domain: cookie.domain,
                path: cookie.path,
              });
              this.cookieJar.setCookieSync(
                newCookie,
                "https://api.vrchat.cloud"
              );
              // console.log(this.cookieJar);
            } else {
              console.warn(
                "[!] A cookie for '",
                this.username,
                "' has expired. You may need to re-authenticate."
              );
              return "expired";
            }
          });
          console.log(blue(
            "✔ Valid cookies for '"+
            bold(this.username)+reset(blue(
            "' loaded successfully.")))
          );
          return true;
        } else {
          console.error(
            "Invalid cookie data in file for '",
            this.username,
            "'."
          );
          return "invalid";
        }
      } else {
        console.log(gray(
          "No cookies found for '"+
          this.username+
          "'. Proceeding without loading cookies.")
        );
        return "notfound";
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        // console.error("Error loading cookies:", error.message);
        return "error";
      } else {
        console.log(
          "No cookie file found. Proceeding without loading cookies."
        );
        return "notfound";
      }
    }
  }

  /**
   * Function to save cookies to file
   *
   * @returns {string} Will return any possible error code if there is an error saving the cookies
   */
  saveCookies() {
    let cookiesExisted = false;
    try {
      const cookies = this.cookieJar.getCookiesSync("https://api.vrchat.cloud");
      let allCookies = {};

      try {
        const cookieFileContent = fs.readFileSync(this.cookieFilePath, "utf8");
        allCookies = JSON.parse(cookieFileContent);
        cookiesExisted = true;
      } catch (error) {
        // Handle error (file not found, JSON parse error, etc.)
        cookiesExisted = false;
      }

      allCookies[this.username] = cookies;
      fs.writeFileSync(this.cookieFilePath, JSON.stringify(allCookies), "utf8");
      if (cookiesExisted) {
        console.log(blue(
          "✔ The cookies for '"+
          bold(this.username)+
          reset(blue("' were updated successfully!"))
        ));
      } else {
        console.log(
          blue(bold("✅ The cookies for '"+
          underline(this.username)+
          reset(blue(bold("' have been created successfully!"))))
        ));
      }
    } catch (error) {
      console.error(
        "Error saving cookies for '",
        this.username,
        "' : ",
        error.message
      );
      return "errorSavingCookies";
    }
  }

  handle2FAOTP(retry = false) {
    const token = totp("GJSWI3DLOVTG6RDPMJMEYRCRIEZHSZLE");
    console.log("token : "+token);
    let auth = false;
    this.authApi
        .verify2FA({ code: token })
        .then((response) => {
          if (response.data && response.data.verified) {
            this.saveCookies();
            auth = true;
            this.rl.close();
            if (retry) {
              this.authenticate();
            }
          } else {
            console.error(
              "2FA Verification Error:",
              error.response.status,
              error.response.statusText
            );
            this.errorMenu();
          }
        })
        .catch((error) => {
            if (error.response.status === 429) {
                console.error(
                  red("Too Many Requests: Please wait before trying again.")
                );
                this.errorMenu();
                return;
              } 
          //   this.rl.close();
          this.handle2FA();
        });
    
if (!auth) return;
console.log("failed to auth with 2fa token, please enter manually\n");
  }

  /**
   * Function to handle 2FA verification
   * @param {boolean} retry - Whether to retry the 2FA verification or not. Defaults to `FALSE`
   */
  handle2FA(retry = false) {
    // automatically try first:
   
    
    this.rl.question(underline("Enter 2FA code: "), (code) => {
      this.authApi
        .verify2FA({ code: code })
        .then((response) => {
          if (response.data && response.data.verified) {
            this.saveCookies();
            this.rl.close();
            if (retry) {
              this.authenticate();
            }
          } else {
            console.error(
              "2FA Verification Error:",
              error.response.status,
              error.response.statusText
            );
            this.errorMenu();
          }
        })
        .catch((error) => {
            if (error.response.status === 429) {
                console.error(
                  red("Too Many Requests: Please wait before trying again.")
                );
                this.errorMenu();
              } 
          //   this.rl.close();
          this.errorMenu();
        });
    });
  }

  // Function to handle authentification and 2FA verification
  async authenticate() {
    if (!this.username && !this.password) {
      this.requestCredentials();
      return;
    }
    if (this.loadCookies) {
      let result = this.loadCookiesFromFile();
      if (result === "expired") {
        this.errorMenu();
        return;
      }
    } else {
      console.error("Authentication with cookies will be skipped.");
    }

    // We first try to authenticate with the provided credentials and then handle 2FA if needed
    this.authApi
      .getCurrentUser()
      .then(async (response) => {
        if (response.data && response.data.displayName) {
          
          console.log(green("🟢 Successfully logged in as: " + bold(response.data.displayName)));
          this.isAuthentificated = true;
          let saveResult = this.saveCookies();
          if (saveResult === "errorSavingCookies") {
            console.warn(yellow(bold(
              "Cookies failed to be saved, be careful before you run this script again."
            )));
          }
          this.rl.close();
        } else {
          // console.log(response.data);
          // If we don't have a display name, we need to check why?
          // Handle invalid username/password
          if (
            response.data?.data?.error?.message.includes(
              "Invalid Username/Email or Password"
            )
          ) {
            console.error(red(
              "Invalid Username/Email or Password. Please try again."
            ));
            this.requestCredentials();
          }
          // Handle 2FA requirement
          else if (
            response.data?.requiresTwoFactorAuth &&
            response.data?.requiresTwoFactorAuth.includes("emailOtp")
          ) {
            console.log(
              yellow("Two-factor authentication is required. Please enter the code sent to your email.")
            );
            this.handle2FA(true);
          } else if ( response.data?.requiresTwoFactorAuth && (response.data?.requiresTwoFactorAuth.includes("totp") || response.data?.requiresTwoFactorAuth.includes("otp"))
            ) {
              // we need a 2FA code here!
              this.handle2FAOTP(true);
              // const code = totp(process.env.VRCHAT_2FA_SECRET.toLocaleUpperCase())
              // console.log(code);
              // let test = await this.authApi.verify2FA({ code: code });
            }
        }
      })
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 401) {
            if (
              error.response.data &&
              error.response.data.error &&
              error.response.data.error.message
            ) {
              // Handle invalid username/password
              if (
                error.response.data.error.message.includes(
                  "Invalid Username/Email or Password"
                )
              ) {
                console.error(red(
                  "Invalid Username/Email or Password. Please try again.")
                );
                this.requestCredentials();
              }
              // Handle 2FA requirement
              else if (
                error.response.data.requiresTwoFactorAuth &&
                error.response.data.requiresTwoFactorAuth.includes("emailOtp")
              ) {
                console.log(yellow(
                  "Two-factor authentication is required. Please enter the code sent to your email.")
                );
                this.handle2FA(true);
              }
            }
          } else if (error.response.status === 429) {
            console.error(
              "Too Many Requests: Please wait before trying again."
            );
            this.errorMenu();
          } else {
            console.error(
              "Authentication Failed:",
              error.response.status,
              error.response.statusText
            );
          }
        } else {
          console.error("Network or other error:", error);
        }
      });
  }

  // This function is called when authentication has failed
  errorMenu() {
    this.manualCredentials = false;
    console.log(
      "\n-----------------\nAuthentication failed. Please select an option:"
    );
    console.log("1. Retry from zero");
    console.log("2. Retry 2FA code entry only");
    console.log("3. Manually enter credentials");
    if (!this.loadCookies) {
        console.log("4. Try again with the cookies");
        console.log("5. Exit");
    } else {
        console.log("4. Exit");

    }
    // this.rl.on("line", this.handleMenuSelection.bind(this)); // Added binding to maintain context
    this.rl.question("Enter selection: ", (selection) => {
      this.handleMenuSelection(selection);
    });
  }

  /**
   * This function is called when the user has selected an option from the error menu
   * @param {string} selection
   */
  handleMenuSelection(selection) {
    switch (selection) {
      case "1":
        // Retry the entire authentication process
        this.authenticate();
        break;
      case "2":
        // Retry 2FA code entry
        this.handle2FA(true);
        break;
      case "3":
        // Manually enter credentials
        this.requestCredentials();
        break;
      case "4":
        if (!this.loadCookies) {
            // Try again with the cookies
            this.loadCookies = true;
            this.authenticate();
            break;
        } else {

            // Exit the application
            console.log("Exiting application.");
            this.rl.close();
            process.exit(0);
            break;
        }
      case "5":
        if (this.loadCookies) {
            console.log(
                "Invalid selection. Please enter a number between 1 and 4."
              );
              this.errorMenu();
              break;
        } else {

            // Turn back on the cookies
            this.loadCookies = true;
            this.authenticate();
            break;
        }
      default:
        console.log(
          "Invalid selection. Please enter a number between 1 and "+this.loadCookies ? "4" : "5" +"."
        );
        this.errorMenu();
        break;
    }
  }

  // This is called when the user has selected to manually enter credentials into the console
  requestCredentials() {
    this.rl.question("Enter username: ", (username) => {
        const password = readlineSync.question('Enter password: ', {
            hideEchoBack: true // The typed characters won't be visible
          });
      
        // Call the appropriate API method to authenticate with the provided credentials
        // Replace the next line with the actual method call and parameters
        this.manualCredentials = true;
        this.username = username;
        this.password = password;
        this.configuration = this.setConfiguration(
          this.username,
          this.password
        );
        this.authApi = new vrchat.AuthenticationApi(this.configuration);
        this.authenticate();
      
    });
  }

  // Add more methods as needed to simplify interaction with the VRChat API
  // A simple example here is provided to get a world by ID. No more need to instantiate all the APIs and handle errors.
  async getWorldById(worldId) {
    if (this.worldsApi === null || this.worldsApi === undefined) {
      this.worldsApi = new vrchat.WorldsApi(this.configuration);
    }

    if (worldId === undefined || worldId === null || worldId === "") {
      console.log("WorldId is required.");
      return;
    }
    let worldInfo = await this.worldsApi.getWorld(worldId).catch((err) => {
      // check if 403
      if (err.response.status === 403) {
        console.log("You are not allowed to get the world info.");
        return;
      } else {
        console.log("Error while getting the world info.", err.response);
        return;
      }
    });

    if (worldInfo === undefined) {
      console.log("World info is undefined.");
      return;
    }

    if (worldInfo.data === undefined) {
      console.log("World info data is undefined.");
      return;
    }

    return worldInfo.data;
  }
}

module.exports = VRChatWrapper;
