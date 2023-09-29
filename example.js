const VRChatWrapper = require('./vrchatWrapper');

// Load environment variables
require('dotenv').config();

// Create a new instance of the wrapper
const vrchat_account = new VRChatWrapper(
    process.env.VRCHAT_USERNAME,
    process.env.VRCHAT_PASSWORD
);

vrchat_account.authenticate().then(async () => {
    console.log(await vrchat_account.getWorldById("wrld_791ebf58-54ce-4d3a-a0a0-39f10e1b20b2"));
    // any other instructions here
    // After initial authentification, you can use any other methods to contact the API

});

