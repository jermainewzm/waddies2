/* though next is not used here, it must be
   listed in the function because
   express only treats the function as an errorhandler 
when it has exactly 4 parameters */


function errorHandler(err,req,res,next) {
    console.error(err)
    const status = err.status || 500
    const message = err.status ? err.message : "Something went wrong"
    res.status(status).json({error:message})
}

module.exports = errorHandler