# GolfStarter-BackEnd

Welcome Production 5!

Below I've laid out the instructions to get our backend up and running.

## Required Software
* [Git v2.14.1](https://git-scm.com/downloads)
* [Node v6.11.3 LTS](https://nodejs.org/en/)
* [MongoDB v3.4](https://www.mongodb.com/download-center#community)

## MongoDB Setup

Create the folders data\db in your C Drive

```
> mkdir C:\data\db
```

Next, navigate to `C:\Program Files\MongoDB\Server\3.4\bin` and double click on `mongod`. This should start your mongodb server. **Keep this up and running!**

In the same directory double click on `mongo` to open the mongo shell. The mongo shell is similar to the sql plus command line tool we've been using in our database class.

Enter the commands below into the mongo shell. This will create a database called `golfstarter` and a user with the username 'golfstarter' with `read` and `write` access.

```
use golfstarter

db.createUser({ 
  user: "golfstarter",
  pwd: "production5",
  roles: [
    { role: "readWrite", db: "golfstarter" }
  ]
})
```

That's it! The database is set up and ready to go. 

**Be sure to keep the mongod server up while using the website!**

## Backend Setup

First, clone this repository

```
> git clone https://github.com/scott-rc/GolfStarter-backend.git
```

Now, let's go into the newly cloned directory and use npm (Node Package Manager) to install our backend dependencies.
```
> cd GolfStarter-backend
> npm install
```

Finally let's build and start our backend server.
```
> npm run build
> ...
> npm run start
```

If you see

> Listening for requests on port 3000

then everything worked and our backend is up and running!
