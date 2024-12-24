import Event from "../../../models/event/Event.js";
import EventRating from "../../../models/event/EventRating.js"
import EventRatingService from "../../../services/EventRatingService.js"
import jwt from 'jsonwebtoken'
class RatingController{

    constructor(){
        this.EventRatingService = new EventRatingService()
    }

    addRating = async (req,res) => {
        const authHeader=req.headers.authorization
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        
        const {id,rating} = req.body
        
        const ev=await Event.findById(id).populate('ratings').exec()
        
        if (ev) {
            const r=new EventRating({event:id,user:user.id,rating})
            await r.save()
            const result=await Event.findByIdAndUpdate(id,{$push:{ratings:r._id}}, { new: true }).populate('ratings').exec()
            function calculateAverageRating(ratings) {
                if (ratings.length === 0) return 0;
        
                const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        
                const average = total / ratings.length;
        
                return Math.round(average * 10) / 10; 
              }
        
              const averageRating = calculateAverageRating(result.ratings);
              

             return res.status(200).send({status:'success',averageRating}); 
        }else{
            return res.status(404).send({status:'error',message:'Event not found'});
        }

    }

}

export default new RatingController();