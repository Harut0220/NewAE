const test = (req,res,next)=>{
    console.log(req)
    if(!req.query.name){
        res.send('UnAuth')
    }
    next()
}

export default test

