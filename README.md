[![Stories in Ready](https://badge.waffle.io/priolkar2010/audiotroupe.png?label=ready&title=Ready)](https://waffle.io/priolkar2010/audiotroupe)

## Instructions

If you would like to download the code and try it for yourself:

NOTE: Ensure you have MongoDB installed. If you don't then go to the following link to do so: http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/

1. Clone the repo: `git clone https://github.com/priolkar2010/audiotroupe.git`
2. Install packages: `npm install` and `npm install -g bower`
3. Run `bower update`
4. Change out the database configuration in config/database.js (This will be mostly along the lines of "localhost:[your port number]")
5. Change out auth keys in config/auth.js with your own Facebook Developer credentials
6. Launch: `npm start`
7. Visit in your browser at: `http://localhost:8080` or your custom port number
8. Install google Cloud SDK, follow the steps https://cloud.google.com/sdk. You will also need to add the user on the google cloud account to be able to upload images. (Edit bucket permissions on the Bucket list page)


How to add any user to the google cloud
1. Create SSH, and add the public key from the location ~/.ssh/id_rsa.pub into the Google cloud (Metadata section) https://console.developers.google.com/project/feisty-audio-109522/compute/metadata

Dev Box (Google Cloud)
1. Database configuration 'url' : `mongodb://audiotroupeadmin:audiotroupepassword@127.0.0.1:27017/audiotroupe`
2. (Deepa will finish this up)

Task Running for Gulp:
1. `paper-checkbox.css` file in `essential-files` folder needs to move into `paper-checkbox` folder inside the `bower-components` parent folder
2. `default-theme.html` file in `essential-files` folder needs to overwrite the `default-theme.html` file in `paper-styles` folder inside the `bower-components` parent folder
