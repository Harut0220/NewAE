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
        console.log(authHeader);
        
        // const user = { id: "656ecb2e923c5a66768f4cd3" };
        const {id,rating} = req.body
        console.log(id,rating);
        
        const ev=await Event.findById(id).populate('ratings').exec()
        console.log(ev,"ev");
        
        if (ev) {
            const r=new EventRating({event:id,user:user.id,rating})
            await r.save()
            const result=await Event.findByIdAndUpdate(id,{$push:{ratings:r._id}}, { new: true }).populate('ratings').exec()
            function calculateAverageRating(ratings) {
                if (ratings.length === 0) return 0;
        
                // Sum all the ratings
                const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        
                // Calculate the average
                const average = total / ratings.length;
        
                // Optionally, round to a certain number of decimal places
                return Math.round(average * 10) / 10; // Rounds to 1 decimal place
              }
        
              // Calculate and display the average rating
              const averageRating = calculateAverageRating(result.ratings);
              console.log(averageRating,"averageRating");
              
            //   const resultUpdated=await Event.findByIdAndUpdate(id,{$set:{ratingCalculated:averageRating}}, { new: true }).populate('ratings').exec()

             return res.status(200).send({status:'success',averageRating}); 
        }else{
            return res.status(404).send({status:'error',message:'Event not found'});
        }

    }

}

export default new RatingController();