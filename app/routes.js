var HeadsetStyle = require( '../app/models/headsetstyle' );
var PricePoints = require( '../app/models/pricepoint' );
var ActivityType = require( '../app/models/activity' );
var MusicType = require( '../app/models/music' );
var User = require( '../app/models/user' );
var HeadsetModel = require( '../app/models/headsetmodel' );
var Comment = require( '../app/models/comment' );
var EmailTemplate = require( '../app/models/emailtemplate' );
var USPS = require( 'usps-webtools' );
var sendgrid = require( 'sendgrid' )( 'username', 'password' );
var stripe = require( "stripe" )( "XXXXX" );
var request = require( 'request' );

var usps = new USPS( {
    server: 'http://production.shippingapis.com/ShippingAPI.dll',
    userId: '897AUDIO1190'
} );

module.exports = function ( app, passport )
{

    app.get( '/', function ( req, res, next )
    {
        res.render( 'homepage.ejs' );
    } );

    app.get( '/checkRecaptcha', function ( req, res, next )
    {
        request(
            "https://www.google.com/recaptcha/api/siteverify?secret=secreatkey&response=" +
            req.query.captcha,
            function ( error, response, body )
            {
                if ( !error && response.statusCode == 200 )
                {
                    console.log( body );
                    var jsonResp = JSON.parse( body );
                    res.send( "{\"status\":\"" + jsonResp.success + "\"}" );
                }
            } );
    } );

    app.get( '/signUp', function ( req, res, next )
    {
        var message = req.flash( 'signupMessage' );
        res.render( 'signup.ejs', {
            message: message
        } );
    } );

    app.get( '/signIn', function ( req, res, next )
    {
        res.render( 'signin.ejs', {
            message: req.flash( 'loginMessage' )
        } );

    } );

    app.get( '/sendEmailForNewSignUp', isLoggedIn, function ( req, res, next )
    {
        // If the user refreshes the profile page, support group should not get email twice.
        EmailTemplate.findOne( { 'user_email': req.user.email },
            { 'template_id': 'fe3bd6fb-690b-4c0b-a1a4-100e7faab78c' }, function ( err, emailtemplate )
            {
                if ( emailtemplate === null )
                {
                    User.findOne( { email: req.user.email }, function ( err, user )
                    {
                        if ( user.visitCount === 2 )
                        {
                            var sendEmail = new sendgrid.Email();
                            sendEmail.addTo( 'hello@audiotroupe.com' );
                            sendEmail.subject = user.name;
                            sendEmail.from = 'support@audiotroupe.com';
                            sendEmail.html = '<h1>We got a new signup!!</h1>';
                            sendEmail.addFilter( 'templates', 'enable', 1 );
                            sendEmail.addFilter( 'templates', 'template_id',
                                'fe3bd6fb-690b-4c0b-a1a4-100e7faab78c' );
                            sendgrid.send( sendEmail );

                            emailTemplate = new EmailTemplate();
                            emailTemplate.user_email = user.email;
                            emailTemplate.template_id =
                                'fe3bd6fb-690b-4c0b-a1a4-100e7faab78c';

                            emailTemplate.save( function ( err )
                            {
                                if ( err )
                                {
                                    console.log( "errrr" + err );
                                }
                            } );
                        }
                    } );
                }
            } );
        res.send( "Success" );
    } );

    app.get( '/sendEmailForNewOrder', isLoggedIn, function ( req, res, next )
    {
        User.findOne( {
            email: req.user.email
        }, function ( err, user )
        {
            var sendEmail = new sendgrid.Email();
            sendEmail.addTo( 'hello@audiotroupe.com' );
            sendEmail.subject = user.name;
            sendEmail.from = 'support@audiotroupe.com';
            sendEmail.html = '<h1>Pack up ' + user.name +
                '\'s selection</h1>';
            sendEmail.addFilter( 'templates', 'enable', 1 );
            sendEmail.addFilter( 'templates', 'template_id',
                'e2577db5-e7e8-4f65-b317-5aa44c30ca89' );
            sendgrid.send( sendEmail );
            res.send( "Success" );
        } );
    } );

    app.get( '/contactUs', isLoggedIn, function ( req, res, next )
    {
        User.findOne( {
            email: req.user.email
        }, function ( err, user )
        {
            res.render( 'contact-us.ejs', {
                user: user
            } );
        } );
    } );

    app.get( '/myorders', isLoggedIn, function ( req, res, next )
    {
        User.findOne( {
            email: req.user.email
        }, function ( err, user )
        {
            var shippingAddress = user.shippingAddress;
            if ( user.shippingAddress.address1 === undefined )
            {
                shippingAddress = user.billingAddress;
            }
            res.render( 'orders.ejs', {
                user: user,
                shippingAddress: shippingAddress
            } );
        } );
    } );

    app.get( '/getOrdersCount', isLoggedIn, function ( req, res, next )
    {
        User.findOne( {
            email: req.user.email
        }, function ( err, user )
        {
            var count = 0;
            for ( i = 0; i < user.order.length; i++ )
            {
                if ( user.order[ i ].status === "shipped" || user.order[ i ].status == "to-be-shipped" )
                {
                    count++;
                }
            }
            res.setHeader( 'Content-Type', 'application/json' );
            res.send( "{\"totalOrders\":" + count + "}" );
        } );
    } );

    app.post( '/submitComments', isLoggedIn, function ( req, res, next )
    {
        var comment = new Comment();
        comment.date = new Date();
        comment.comment = req.body.comment;
        comment.user = req.user.email;
        comment.subject = req.body.subject;
        comment.save( function ( err )
        {
            if ( err )
            {
                console.log( "errrr" + err );
            }
        } );

        res.redirect( '/dashboard' );
    } );

    app.get( '/getOrderedModels', isLoggedIn, function ( req, res, next )
    {
        User.findOne( {
            email: req.user.email
        }, function ( err, user )
        {
            var models = "";
            for ( i = 0; i < user.order.length; i++ )
            {
                if ( user.order[ i ].orderId === req.query.orderId )
                {
                    HeadsetModel.find( {
                        'model': {
                            $in: user.order[ i ].models
                        }
                    }, function ( err, models )
                    {
                        res.setHeader( 'Content-Type', 'application/json' );
                        res.send( models );
                    } );
                }
            }
        } );
    } );

    app.get( '/getOrderedData', isLoggedIn, function ( req, res, next )
    {
        User.findOne( {
            email: req.user.email
        }, function ( err, user )
        {
            var status = "";
            var trackingNumber;
            for ( i = 0; i < user.order.length; i++ )
            {
                if ( user.order[ i ].orderId === req.query.orderId )
                {
                    status = user.order[ i ].status;
                    trackingNumber = user.order[ i ].trackingNumber;
                }
            }
            res.setHeader( 'Content-Type', 'application/json' );
            res.send( "{\"shippingStatus\":\"" + status +
                "\", \"trackingNumber\": \"" + trackingNumber + "\"}" );
        } );
    } );

    app.post( '/checkout', isLoggedIn, function ( req, res, next )
    {
        User.findOne( {
            email: req.user.email
        }, function ( err, user )
        {
            console.log( req.body );
            var models = req.body.headsetModels.split( "," );
            var recommendationStatus = "";
            for ( i = 0; i < user.recommendation.length; i++ )
            {
                if ( user.recommendation[ i ]._id.toString() === req.body.recommendationId.trim() )
                {
                    recommendationStatus = user.recommendation[ i ].status;
                    user.recommendation[ i ].status = "selected";
                }
            }
            if ( recommendationStatus === "current" || recommendationStatus === "selected" )
            {
                user.order.push( {
                    status: "new",
                    date: new Date(),
                    recommendationId: req.body.recommendationId,
                    models: models,
                    orderId: (new Date().getTime()).toString( 36 )
                } );
                user.save( function ( err )
                {
                    if ( err )
                    {
                        console.log( "errrr" + err );
                    }
                } );
                res.render( 'checkout.ejs', {
                    user: user,
                    model_list: models,
                    error: ""
                } );
            }
            else
            {
                res.redirect( '/dashboard' );
            }
        } );
    } );

    app.post( '/submitOrder', isLoggedIn, function ( req, res, next )
    {
        User.findOne( {
            email: req.user.email
        }, function ( err, user )
        {
            var recommendationStatus = "";
            var orderStatus = "";
            var shippingAddressCheck = true;
            var billingAddressCheck = true;
            var models = "";

            if ( req.body.shipaddress1 !== "" && req.body.shipaddress1 !=
                "undefined" && req.body.shipaddress1 !== null )
            {
                usps.verify( {
                    street1: req.body.shipaddress1,
                    street2: req.body.shipaddress2,
                    city: req.body.shipcity,
                    state: req.body.shipstate,
                    zip: req.body.shipzipcode
                }, function ( err, address )
                {
                    console.log( address );
                    if ( address.zip !== req.body.shipzipcode )
                    {
                        shippingAddressCheck = false;
                    }
                    if ( err !== null )
                    {
                        shippingAddressCheck = false;
                    }
                } );
            }

            usps.verify( {
                street1: req.body.address1,
                street2: req.body.address2,
                city: req.body.city,
                state: req.body.state,
                zip: req.body.zipcode
            }, function ( err, address )
            {
                console.log( address.zip );
                console.log( req.body.zipcode );
                if ( address.zip !== req.body.zipcode )
                {
                    billingAddressCheck = false;
                }
                if ( err !== null )
                {
                    billingAddressCheck = false;
                }
            } );

            console.log( billingAddressCheck, shippingAddressCheck );
            if ( billingAddressCheck && shippingAddressCheck )
            {
                for ( i = 0; i < user.order.length; i++ )
                {
                    if ( user.order[ i ].status = "new" )
                    {
                        orderStatus = "new";
                        models = user.order[ i ].model;
                        user.order[ i ].status = "to-be-shipped";
                    }
                }
                if ( orderStatus === "new" )
                {
                    if ( req.body.shipaddress1 !== "" && req.body.shipaddress1 !=
                        "undefined" && req.body.shipaddress1 !== null )
                    {
                        var address1 = req.body.shipaddress1;
                        var address2 = req.body.shipaddress2;
                        var city = req.body.shipcity;
                        var state = req.body.shipstate;
                        var zipcode = req.body.shipzipcode;
                        user.shippingAddress.address1 = address1;
                        user.shippingAddress.address2 = address2;
                        user.shippingAddress.zipcode = zipcode;
                        user.shippingAddress.state = state;
                        user.shippingAddress.city = city;
                    }
                    var credit_card_token = req.body.stripeToken;
                    var billingAddress1 = req.body.address1;
                    var billingAddress2 = req.body.address2;
                    var billingCity = req.body.city;
                    var billingState = req.body.state;
                    var billingZipcode = req.body.zipcode;
                    user.billingAddress.address1 = billingAddress1;
                    user.billingAddress.address2 = billingAddress2;
                    user.billingAddress.zipcode = billingZipcode;
                    user.billingAddress.state = billingState;
                    user.billingAddress.city = billingCity;
                    user.credit_card_token = credit_card_token;
                    stripe.customers.create( {
                        description: req.user.name,
                        email: req.user.email,
                        source: credit_card_token
                    }, function ( err, customer )
                    {
                        console.log( err, customer );
                        if ( err !== null )
                        {
                            console.log( "errrr" + err );
                            console.log( err.message );
                        }
                        else
                        {
                            user.customer_token = customer.id;
                        }
                    } );
                    user.save( function ( err )
                    {
                        if ( err )
                        {
                            console.log( "errrr" + err );
                            res.render( 'checkout.ejs', {
                                user: user,
                                model_list: models,
                                error: "Error occured, Please try again later"
                            } );
                        }
                    } );
                }
                res.render( 'order-confirmation.ejs', {
                    user: user
                } );
            }
            else
            {
                res.render( 'checkout.ejs', {
                    user: user,
                    model_list: models,
                    error: "Address is Invalid, Please enter a valid address"
                } );
            }
        } );
    } );

    app.post( '/register', isLoggedIn, function ( req, res, next )
    {
        var locks = req.body;
        var arr = Object.keys( locks );
        var headsets = req.body.headsets;
        var activities = req.body.activities;
        var pricePoints = req.body.pricepoints;
        var musictypes = req.body.music;
        var phoneNumber = req.body.phoneNumber;

        if ( typeof req.user !== "undefined" )
        {
            User.findOne( {
                email: req.user.email
            }, function ( err, user )
            {
                user.headset_style_value = headsets;
                user.activity_value = activities;
                user.price_point_value = pricePoints;
                user.music_value = musictypes;
                user.profileUpdated = "1";
                user.phone_number = phoneNumber;
                user.save( function ( err )
                {
                    if ( err )
                    {
                        console.log( "errrr" + err );
                        res.redirect( '/profile' );
                    }
                    res.redirect( '/dashboard' );
                } );
            } );
        }
    } );

    app.post( '/getAllModels', isLoggedIn, function ( req, res, next )
    {
        var listOfModels = req.body.models.split( "," );
        HeadsetModel.find( {
            'model': {
                $in: listOfModels
            }
        }, function ( err, models )
        {
            res.setHeader( 'Content-Type', 'application/json' );
            res.send( models );
        } );
    } );

    app.get( '/dashboard', isLoggedIn, function ( req, res, next )
    {
        var models = "";
        User.findOne( {
            email: req.user.email
        }, {
            "recommendation": 1,
            _id: 0,
            "recommendation": {
                $elemMatch: {
                    "status": "current"
                }
            }
        }, function ( err, user )
        {
        } );
        User.findOne( {
            email: req.user.email
        }, function ( err, user )
        {
            var models = '';
            var flag = "false";
            var recommendationId = '';
            var orderedModels = '';
            for ( j = 0; j < user.order.length; j++ )
            {
                if ( user.order[ j ].status == "new" )
                {
                    if ( user.order[ j ].recommendationId == user.order[ j ].recommendationId )
                    {
                        flag = "true";
                        orderedModels = user.order[ j ].models;
                    }
                }
            }
            for ( i = 0; i < user.recommendation.length; i++ )
            {
                if ( user.recommendation[ i ].status === 'current' || user.recommendation[
                        i ].status === 'selected' )
                {
                    if ( flag === "true" || user.order.length === 0 )
                    {
                        models = user.recommendation[ i ].models;
                        recommendationId = user.recommendation[ i ]._id;
                    }
                }
            }
            if ( flag === "true" )
            {
                res.render( 'checkout.ejs', {
                    user: user,
                    model_list: orderedModels,
                    error: ""
                } );
            }
            else
            {
                res.render( 'dashboard.ejs', {
                    user: user,
                    model_list: models,
                    recommendationId: recommendationId
                } );
            }
        } );
    } );

    app.get( '/profile', isLoggedIn, function ( req, res, next )
    {
        HeadsetStyle.find( {}, function ( err, headsetStyles )
        {
            PricePoints.find( {}, function ( err, pricePoints )
            {
                ActivityType.find( {}, function ( err, activitiesTypes )
                {
                    MusicType.find( {}, function ( err, musicTypes )
                    {
                        User.findOne( {
                            email: req.user.email
                        }, function ( err, user )
                        {
                            var count = user.visitCount;
                            if ( count === 1 )
                            {
                                var sendEmail = new sendgrid.Email();
                                sendEmail.addTo( user.email );
                                sendEmail.subject =
                                    "Welcome to Audio Troupe";
                                sendEmail.from =
                                    'support@audiotroupe.com';
                                sendEmail.html = '<h1>Hi there!</h1>';
                                sendEmail.addFilter( 'templates',
                                    'enable', 1 );
                                sendEmail.addFilter( 'templates',
                                    'template_id',
                                    'ea9d6493-929d-44b8-b344-fbc9521c295f'
                                );
                                sendgrid.send( sendEmail );
                                user.visitCount = count + 1;
                                user.save( function ( err )
                                {
                                    if ( err )
                                    {
                                        console.log( "errrr" + err );
                                    }
                                } );
                            }
                            console.log( user.profileUpdated );
                            if ( user.profileUpdated === "1" )
                            {
                                res.redirect( '/dashboard' );
                            }
                            else
                            {
                                res.render( 'register.ejs', {
                                    user: req.user,
                                    activities_list: activitiesTypes,
                                    pricepoints_list: pricePoints,
                                    headsetstyles_list: headsetStyles,
                                    musictypes_list: musicTypes
                                } );
                            }
                        } );
                    } );
                } );
            } );
        } );
    } );

    app.get( '/logout', function ( req, res, next )
    {
        req.logout();
        res.redirect( '/' );
    } );

    // send to facebook to do the authentication
    app.get( '/auth/facebook', passport.authenticate( 'facebook', {
        scope: 'public_profile,email'
    } ) );

    // handle the callback after facebook has authenticated the user
    app.get( '/auth/facebook/callback', passport.authenticate( 'facebook', {
            failureRedirect: '/'
        } ),
        function ( req, res, next )
        {
            if ( typeof req.user !== 'undefined' )
            {
                User.findOne( {
                    'fb_id': req.user.fb_id
                }, function ( err, user )
                {
                    if ( user.profileUpdated == '1' )
                    {
                        res.redirect( '/dashboard' );
                    }
                    else
                    {
                        res.redirect( '/profile' );
                    }
                } );
            }
        } );

    app.post( '/signUpUser', passport.authenticate( 'local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signUp',
        failureFlash: true
    } ) );

    app.post( '/signInUser', passport.authenticate( 'local-login', {
        successRedirect: '/dashboard',
        failureRedirect: '/signIn',
        failureFlash: true
    } ) );

    app.get( '*', function ( req, res, next )
    {
        https_redirect( req, res, next );
    } );

    var https_redirect = function ( req, res, next )
    {
        if ( req.headers[ 'x-forwarded-proto' ] != 'https' )
        {
            return res.redirect( 'https://' + req.headers.host + req.url );
        }
        else
        {
            return next();
        }
    };
};

var https_redirect = function(req, res, next) {
    if (req.headers['x-forwarded-proto'] != 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    } else {
      return next();
    }
};


function isLoggedIn( req, res, next )
{
    if ( req.isAuthenticated() )
    {
        return next();
    }
    res.redirect( '/' );
}
