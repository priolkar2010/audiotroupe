var LocalStrategy = require( 'passport-local' ).Strategy;
var FacebookStrategy = require( 'passport-facebook' ).Strategy;

var User = require( '../app/models/user' );

var configAuth = require( './auth' );

module.exports = function ( passport )
{

    // =========================================================================
    // passport session setup
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser( function ( user, done )
    {
        done( null, user.id );
    } );

    // used to deserialize the user
    passport.deserializeUser( function ( id, done )
    {
        User.findById( id, function ( err, user )
        {
            done( err, user );
        } );
    } );

    // =========================================================================
    // LOCAL LOGIN
    // =========================================================================
    passport.use( 'local-login', new LocalStrategy( {
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function ( req, email, password, done )
        {
            if ( email )
            {
                email = email.toLowerCase();
            } // Use lower-case e-mails to avoid case-sensitive e-mail matching
            if ( email==='undefined' )
            {
                console.log( "email", email );
                return done( null, false );
            }

            // asynchronous
            process.nextTick( function ()
            {
                User.findOne( {
                    'email': email
                }, function ( err, user )
                {
                    // if there are any errors, return the error
                    if ( err )
                    {
                        console.log( "Error occured :: ", err );
                        return done( null, false, req.flash( 'loginMessage',
                            'Technical error! Please try again later.' ) );
                    }

                    // if no user is found, return the message
                    if ( !user )
                    {
                        return done( null, false, req.flash( 'loginMessage',
                            'No user found.' ) );
                    }

                    if ( !user.validPassword( password ) )
                    {
                        return done( null, false, req.flash( 'loginMessage',
                            'Oops! Wrong password.' ) );
                    }// all is well, return user
                    else
                    {
                        var count = user.visitCount;
                        user.visitCount = count + 1;
                        var currentDate = new Date();
                        user.account_created = currentDate;

                        user.save( function ( err )
                        {
                            if ( err )
                            {
                                return done( err );
                            }

                            return done( null, user );
                        } );
                    }
                } );
            } );
        } ) );

    // =========================================================================
    // LOCAL SIGNUP
    // =========================================================================
    passport.use( 'local-signup', new LocalStrategy( {
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function ( req, email, password, done )
        {

            if ( email )
            {
                email = email.toLowerCase();
            } // Use lower-case e-mails to avoid case-sensitive e-mail matching
            // asynchronous
            process.nextTick( function ()
            {
                // if the user is not already logged in:

                if ( !req.user )
                {
                    User.findOne( {
                        'email': email
                    }, function ( err, user )
                    {
                        // if there are any errors, return the error
                        if ( err )
                        {
                            console.log( "Error occured :: ", err );
                            return done( null, false, req.flash( 'signupMessage',
                                'Technical error! Please try again later.' ) );
                        }

                        // check to see if theres already a user with that email
                        if ( user )
                        {
                            console.log( "user exists" );
                            return done( null, false, req.flash( 'signupMessage',
                                'That email is already taken.' ) );
                        }
                        else
                        {

                            // create the user
                            var newUser = new User();
                            newUser.name = req.body.firstName + ' ' + req.body.lastName;
                            newUser.email = email;
                            newUser.password = newUser.generateHash( password );
                            newUser.visitCount = 1
                            newUser.profileUpdated = "0";
                            var currentDate = new Date();
                            newUser.account_created = currentDate;
                            newUser.save( function ( err )
                            {
                                if ( err )
                                {
                                    console.log( "Error occured :: ", err );
                                    return done( null, false, req.flash(
                                        'signupMessage',
                                        'Technical error! Please try again later.'
                                    ) );
                                }

                                return done( null, newUser );
                            } );
                        }

                    } );
                    // if the user is logged in but has no local account...
                }
                else if ( !req.user.email )
                {
                    // ...presumably they're trying to connect a local account
                    // BUT let's check if the email used to connect a local account is being used by another user
                    User.findOne( {
                        'email': email
                    }, function ( err, user )
                    {
                        if ( err )
                        {
                            console.log( "Error occured :: ", err );
                            return done( null, false, req.flash( 'signupMessage',
                                'Technical error! Please try again later.' ) );
                        }
                        if ( user )
                        {
                            return done( null, false, req.flash( 'signupMessage',
                                'That email is already taken.' ) );
                            // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                        }
                        else
                        {
                            var user = req.user;
                            user.name = req.body.firstName + ' ' + req.body.lastName;
                            user.email = email;
                            user.password = user.generateHash( password );
                            user.visitCount = 1
                            user.profileUpdated = "0";
                            var currentDate = new Date();
                            user.account_created = currentDate;

                            user.save( function ( err )
                            {
                                if ( err )
                                {
                                    console.log( "Error occured :: ", err );
                                    return done( null, false, req.flash(
                                        'signupMessage',
                                        'Technical error! Please try again later.'
                                    ) );
                                }

                                return done( null, user );
                            } );
                        }
                    } );
                }
                else
                {
                    // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                    return done( null, req.user );
                }
            } );
        } ) );

    // =========================================================================
    // FACEBOOK
    // =========================================================================
    passport.use( new FacebookStrategy( {
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL,
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

        },
        function ( req, token, refreshToken, profile, done )
        {
            // asynchronous
            process.nextTick( function ()
            {

                // check if the user is already logged in
                if ( !req.user )
                {

                    User.findOne( {
                        'fb_id': profile.id
                    }, function ( err, user )
                    {
                        if ( err )
                        {
                            console.log( "Error occured :: ", err );
                            return done( null, false, req.flash( 'signupMessage',
                                'Technical error! Please try again later.' ) );
                        }
                        if ( user )
                        {
                            console.log( "User exists..." );
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if ( !user.fb_token )
                            {
                                user.fb_token = token;
                                user.name = profile.name.givenName + ' ' +
                                    profile.name.familyName;
                                user.fb_email = (profile.emails[ 0 ].value || '').toLowerCase();
                                user.email = (profile.emails[ 0 ].value || '').toLowerCase();
                                user.local = profile.local;
                                user.timezone = profile.timezone;
                                user.age_range = profile.age_range;
                                user.profileUpdated = "0";
                                var count = user.visitCount;
                                user.visitCount = count + 1;
                                var currentDate = new Date();
                                user.account_created = currentDate;
                                user.save( function ( err )
                                {
                                    if ( err )
                                    {
                                        return done( err );
                                    }

                                    return done( null, user );
                                } );
                            }
                            return done( null, user ); // user found, return that user
                        }
                        else
                        {
                            // if there is no user, create them
                            var newUser = new User();
                            newUser.fb_id = profile.id;
                            newUser.fb_token = token;
                            newUser.name = profile.name.givenName + ' ' +
                                profile.name.familyName;
                            newUser.fb_email = (profile.emails[ 0 ].value || '').toLowerCase();
                            newUser.email = (profile.emails[ 0 ].value || '').toLowerCase();
                            newUser.local = profile.local;
                            newUser.timezone = profile.timezone;
                            newUser.age_range = profile.age_range;
                            newUser.profileUpdated = "0";
                            newUser.visitCount = 1;
                            var currentDate = new Date();
                            newUser.account_created = currentDate;

                            newUser.save( function ( err )
                            {
                                if ( err )
                                {
                                    console.log( "Error occured :: ", err );
                                    return done( null, false, req.flash(
                                        'signupMessage',
                                        'Technical error! Please try again later.'
                                    ) );
                                }
                                return done( null, newUser );
                            } );
                        }
                    } );
                }
                else
                {
                    // user already exists and is logged in, we have to link accounts
                    console.log( "User exists" );
                    var user = req.user; // pull the user out of the session
                    user.fb_id = profile.id;
                    user.fb_token = token;
                    user.name = profile.name.givenName + ' ' + profile.name.familyName;
                    user.fb_email = (profile.emails[ 0 ].value || '').toLowerCase();
                    user.email = (profile.emails[ 0 ].value || '').toLowerCase();
                    user.local = profile.local;
                    user.timezone = profile.timezone;
                    user.age_range = profile.age_range;
                    var count = user.visitCount;
                    user.visitCount = count + 1;

                    var currentDate = new Date();
                    user.account_created = currentDate;
                    user.save( function ( err )
                    {
                        if ( err )
                        {
                            console.log( "Error occured :: ", err );
                            return done( null, false, req.flash( 'signupMessage',
                                'Technical error! Please try again later.' ) );
                        }

                        return done( null, user );
                    } );
                }
            } );
        } ) );
};
