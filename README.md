# vrchat-js-api-wrapper
A wrapper for vrchat-api javascript project

# Project Title

This project let's you easily use vrchat-api-js project.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Installation

Here is how you can install and start using this library:

### Step 1: Clone the repository

```
git clone <repository-url>
```

### Step 2: Install dependencies

```
npm install
```

## Usage

There is an example code to get started bellow, followed by explainations.

```javascript
// Import the VRChatWrapper module
const VRChatWrapper = require('./vrchatWrapper');

// Create a new instance of the VRChatWrapper class
const vrchat_account = new VRChatWrapper(
    "vrchat_username",
    "vrchat_password",
);

// With our new instance we now authenticate
// If it fails, you'll be guided through a menu to correctly login
vrchat_account.authenticate().then(async () => {
    // Put any instructions here you want to do after authentification is done successfully
});
```

We starts by importing the `VRChatWrapper` module and then we create a new instance of the `VRChatWrapper` class by passing in the VRChat username and password. We recommand you use a safe credential method like `dotenv` to load your information from.

Next, we call the `authenticate()` method on the `vrchat_account` instance to authenticate with the VRChat API. Inside the `then()` callback, we can call multiple different things. !(WIP)!

1. Retrieving information about a specific world using `getWorldById("wrld_id")`. (Works)
2. Getting the user's friends list using `getFriendsList()`. (TODO)
3. Sending a friend request to a specific user using `sendFriendRequest(usr_id)`. (TODO)

Feel free to modify the code and add any other instructions or API calls you need after these examples in the VRChatWrapper. If authentication fails, you'll be prompted to fix authentication.

Remember to replace `'wrld_id'` with the actual ID of the world you want to retrieve information for.

## Contributing

You can contribute to this project, but I am still a novice when it comes to learning how github works. Thank you for your help and patience!

## License

  GNU GENERAL PUBLIC LICENSE
                       Version 3, 29 June 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.